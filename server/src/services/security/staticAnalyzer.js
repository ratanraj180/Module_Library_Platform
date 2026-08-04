/**
 * @file staticAnalyzer.js
 * @description Static code analysis orchestrator — replaces the architecture stub.
 *
 * RESPONSIBILITY:
 *   This is the single entry point the security pipeline calls for static
 *   analysis. It does NOT contain scanner logic — it delegates to one of two
 *   scanner engines:
 *
 *     1. Semgrep (preferred)
 *        A production-grade multi-language semantic analysis engine.
 *        Used when the `semgrep` binary is present on the system.
 *        See: semgrepRunner.js
 *
 *     2. Custom Pattern Scanner (fallback)
 *        A pure-Node.js regex line scanner, zero external dependencies.
 *        Activates automatically when Semgrep is not installed.
 *        See: customPatternScanner.js
 *
 * ENGINE SELECTION LOGIC:
 *   ┌─ isSemgrepAvailable()? ──────────────────────────────────────────────┐
 *   │ YES → runSemgrep(scanPath) + countSourceLines(scanPath)              │
 *   │ NO  → runCustomPatternScan(scanPath) [includes line count]           │
 *   └──────────────────────────────────────────────────────────────────────┘
 *
 * INPUT (scanTarget from buildScanTarget in securityPipeline.js):
 *   scanTarget.filePath   — absolute path to the uploaded file on disk
 *   scanTarget.sourceCode — inline source string (component inline-code use case)
 *
 * ARCHIVE HANDLING:
 *   If filePath points to a .zip, extractForScan() decompresses it to a temp
 *   directory. Both Semgrep and the custom scanner then receive a directory
 *   path and will recursively scan all source files inside it.
 *   The temp directory is always removed in the finally block.
 *
 * OUTPUT (staticAnalysisSchema sub-document shape):
 *   {
 *     totalIssues:        number,
 *     issuesBySeverity: { critical, high, medium, low, info },
 *     findings:           Array<findingSchema>,
 *     linesAnalyzed:      number,
 *     scannerMeta: {
 *       engine:      "semgrep" | "custom-pattern" | "skipped",
 *       version:     string | null,
 *       scanTimeMs:  number,
 *       filesScanned: number,
 *       errors:      string[] | null,
 *       note:        string | null,
 *     }
 *   }
 *
 * FINDING LOCATION FORMAT (as the user requested):
 *   Every finding.location is formatted as  "filename.js:42"
 *   (relative path from scan root + colon + 1-indexed line number)
 *   The metadata object additionally stores column, matched code snippet,
 *   and the rule id for programmatic use.
 */

const fs   = require('fs');
const path = require('path');
const os   = require('os');
const { extractForScan }          = require('./extractArchive');
const { isSemgrepAvailable, runSemgrep } = require('./semgrepRunner');
const { runCustomPatternScan, countSourceLines } = require('./customPatternScanner');

// ─── Empty Result ─────────────────────────────────────────────────────────────
// Returned when there is nothing to scan (e.g. GitHub import with no artifact).

function emptyStaticResult(note) {
  return {
    totalIssues: 0,
    issuesBySeverity: { critical: 0, high: 0, medium: 0, low: 0, info: 0 },
    findings:         [],
    linesAnalyzed:    0,
    scannerMeta: {
      engine:      'skipped',
      version:     null,
      scanTimeMs:  0,
      filesScanned: 0,
      errors:      null,
      note,
    },
  };
}

// ─── Severity Counter ─────────────────────────────────────────────────────────

function countBySeverity(findings) {
  const counts = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
  for (const f of findings) {
    if (counts.hasOwnProperty(f.severity)) {
      counts[f.severity]++;
    }
  }
  return counts;
}

// ─── Inline Source → Temp File ────────────────────────────────────────────────
// Components may provide raw source code rather than a file path.
// We write it to a temp .js file so both engines can read it from disk.

function writeTempSource(sourceCode) {
  const tempFile = path.join(
    os.tmpdir(),
    `ml-static-src-${process.hrtime.bigint()}.js`,
  );
  fs.writeFileSync(tempFile, sourceCode, 'utf8');
  return {
    tempFile,
    cleanup() {
      try { fs.unlinkSync(tempFile); } catch (_) {}
    },
  };
}

// ─── Main Entry Point ─────────────────────────────────────────────────────────

/**
 * Runs static analysis on the provided scan target.
 *
 * Called by executePipeline() in securityPipeline.js as:
 *   const staticAnalysis = await runScannerSafely(runStaticAnalysis, scanTarget, ...);
 *
 * @param {Object}  scanTarget
 * @param {string}  [scanTarget.filePath]   - Absolute path to uploaded file / archive.
 * @param {string}  [scanTarget.sourceCode] - Raw source code string (component case).
 * @param {string}  [scanTarget.moduleId]   - Module id (for logging only).
 * @returns {Promise<Object>} staticAnalysis — matches staticAnalysisSchema sub-document.
 */
async function runStaticAnalysis(scanTarget) {
  const { filePath, sourceCode, moduleId } = scanTarget;

  // ── Guard: nothing to analyse ─────────────────────────────────────────────
  if (!filePath && !sourceCode) {
    const reason = filePath === undefined && sourceCode === undefined
      ? 'No filePath or sourceCode provided (component may have empty frontendCode and backendCode).'
      : 'Both filePath and sourceCode are empty.';
    console.log(`[StaticAnalyzer] Scan skipped: ${reason}`);
    return emptyStaticResult(reason);
  }

  const startMs = Date.now();

  // ── Resolve the path we will actually scan ────────────────────────────────
  // Prefer filePath; fall back to writing sourceCode to a temp file.
  let tempSrcHandle  = null;
  let resolvedPath   = filePath || null;

  if (!resolvedPath && sourceCode) {
    tempSrcHandle = writeTempSource(sourceCode);
    resolvedPath  = tempSrcHandle.tempFile;
    console.log('[StaticAnalyzer] Wrote inline sourceCode to temp file.');
  }

  // ── Extract archive (ZIP → temp dir) if needed ───────────────────────────
  // extractForScan returns the same path unchanged for non-archive files/dirs.
  let extraction = null;

  try {
    extraction = extractForScan(resolvedPath);
    const scanPath = extraction.extractedPath;

    console.log(
      `[StaticAnalyzer] Scanning: ${path.basename(scanPath)} ` +
      `(${extraction.isArchive ? 'extracted directory' : 'file/directory'}) ` +
      `— moduleId: ${moduleId || 'n/a'}`,
    );

    // ── Engine selection ───────────────────────────────────────────────────
    let findings     = [];
    let linesAnalyzed = 0;
    let engine       = 'custom-pattern';
    let version      = '1.0.0';
    let errors       = null;
    let note         = null;

    const semgrepAvailable = await isSemgrepAvailable();

    if (semgrepAvailable) {
      // ── PRIMARY: Semgrep ─────────────────────────────────────────────────
      // Semgrep performs semantic analysis — it understands AST-level patterns,
      // not just text, giving fewer false positives than regex.
      console.log('[StaticAnalyzer] Using Semgrep as primary engine.');

      const semgrepResult = await runSemgrep(scanPath);
      findings     = semgrepResult.findings;
      version      = semgrepResult.version;
      errors       = semgrepResult.errors.length > 0 ? semgrepResult.errors : null;
      engine       = 'semgrep';

      // Semgrep doesn't report linesAnalyzed — count separately.
      // We use countSourceLines() (no pattern scanning, just line counting).
      linesAnalyzed = countSourceLines(scanPath);

      if (errors) {
        console.warn(`[StaticAnalyzer] Semgrep reported ${errors.length} rule error(s).`);
      }
    } else {
      // ── FALLBACK: Custom Pattern Scanner ─────────────────────────────────
      // Pure-Node.js regex scanner — works everywhere, no installation needed.
      // Slightly more prone to false positives than Semgrep due to regex limits.
      console.log('[StaticAnalyzer] Semgrep not available. Using custom pattern scanner.');

      const customResult = runCustomPatternScan(scanPath);
      findings      = customResult.findings;
      linesAnalyzed = customResult.linesAnalyzed;
      engine        = 'custom-pattern';
      version       = '1.0.0';
      note          =
        'Semgrep is not installed. Results produced by the built-in regex scanner. ' +
        'Install Semgrep for more accurate semantic analysis: https://semgrep.dev';
    }

    // ── Aggregate ─────────────────────────────────────────────────────────
    const issuesBySeverity = countBySeverity(findings);

    // Count unique files that have findings
    const affectedFiles = new Set(
      findings.map((f) => (f.location || '').split(':')[0]),
    ).size;

    const scanTimeMs = Date.now() - startMs;

    console.log(
      `[StaticAnalyzer] Complete — ` +
      `${findings.length} finding(s) across ${affectedFiles} file(s), ` +
      `${linesAnalyzed} line(s) analysed, ${scanTimeMs}ms [engine: ${engine}]`,
    );

    return {
      totalIssues:      findings.length,
      issuesBySeverity,
      findings,
      linesAnalyzed,
      scannerMeta: {
        engine,
        version,
        scanTimeMs,
        filesScanned: affectedFiles,
        errors,
        note,
      },
    };
  } finally {
    // ── Always clean up temp resources ────────────────────────────────────
    if (extraction)   extraction.cleanup();
    if (tempSrcHandle) tempSrcHandle.cleanup();
  }
}

module.exports = { runStaticAnalysis };
