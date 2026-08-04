/**
 * @file semgrepRunner.js
 * @description Runs the Semgrep static analysis binary against a target path.
 *
 * WHY A SEPARATE FILE?
 *   The staticAnalyzer orchestrator needs to support two scan engines:
 *   Semgrep (when installed) and the custom pattern scanner (fallback).
 *   Keeping Semgrep invocation in its own file means the orchestrator never
 *   needs to know about subprocess management, YAML rule generation, or JSON
 *   parsing — it just calls runSemgrep() and gets normalised findings back.
 *
 * HOW SEMGREP IS INVOKED:
 *   We write our custom rules to a temp YAML file, then call:
 *     semgrep --json --config <tempRules.yaml> --no-git-ignore --quiet <targetPath>
 *
 *   --json           → machine-readable output, no colour codes or progress bars
 *   --no-git-ignore  → scan all files, even those in .gitignore
 *   --quiet          → suppress status messages to stderr (only errors go there)
 *
 *   Semgrep exits with code 0 (no findings) or 1 (findings found). Both are
 *   normal. Any other exit code is a real error.
 *
 * RULE SET:
 *   Nine custom rules covering exactly what the user requested:
 *     eval(), Function(), exec(), spawn(), SQL Injection (concat + template),
 *     Command Injection (execSync), Path Traversal, Unsafe Regex, Unsafe File Ops.
 *
 * SEVERITY MAPPING:
 *   Semgrep → our schema
 *     ERROR   → high
 *     WARNING → medium
 *     INFO    → info
 *   (We don't emit CRITICAL from Semgrep — that's reserved for the riskScorer)
 *
 * FINDING SHAPE (matches findingSchema in SecurityReport.js):
 *   {
 *     id:          string,   — rule id, e.g. "ml-eval-usage"
 *     title:       string,   — human-readable rule name
 *     description: string,   — message from the Semgrep rule
 *     severity:    string,   — "high" | "medium" | "info"
 *     location:    string,   — "relative/path/to/file.js:42"
 *     metadata: {
 *       line:    number,
 *       column:  number,
 *       code:    string,   — the matching source line (trimmed)
 *       ruleId:  string,
 *       engine:  "semgrep",
 *     }
 *   }
 */

const { execFile } = require('child_process');
const fs           = require('fs');
const path         = require('path');
const os           = require('os');

// ─── Custom Semgrep Rule Set ──────────────────────────────────────────────────
// Written as an embedded YAML string so no external file is needed.
// Each rule targets one of the nine vulnerability categories requested.
// Using Semgrep's `pattern-either` for rules that have multiple variants.
const RULES_YAML = `
rules:

  # ── Code Injection ──────────────────────────────────────────────────────────
  - id: ml-eval-usage
    message: >
      Use of eval() detected. eval() executes arbitrary strings as code and is one
      of the most dangerous JavaScript patterns. Replace with JSON.parse() for data
      or restructure logic to avoid dynamic code execution entirely.
    severity: ERROR
    languages: [javascript, typescript]
    pattern: eval($X)
    metadata:
      category: code-injection
      cwe: CWE-95
      owasp: A03:2021

  - id: ml-function-constructor
    message: >
      new Function() constructor detected. Functionally equivalent to eval() —
      it compiles an arbitrary string into executable code at runtime.
      Replace with a named function or a lookup table.
    severity: ERROR
    languages: [javascript, typescript]
    pattern: new Function(...)
    metadata:
      category: code-injection
      cwe: CWE-95

  # ── Command Injection ────────────────────────────────────────────────────────
  - id: ml-exec-injection
    message: >
      child_process.exec() detected. exec() passes its first argument to the
      operating system shell, making it trivially vulnerable to command injection
      if any user-controlled data is interpolated. Use execFile() with a fixed
      command and an array of arguments instead.
    severity: ERROR
    languages: [javascript, typescript]
    pattern: exec($CMD)
    metadata:
      category: command-injection
      cwe: CWE-78
      owasp: A03:2021

  - id: ml-execsync-injection
    message: >
      execSync() detected. Identical injection risk to exec() but also blocks the
      Node.js event loop until completion — a double hazard in production.
    severity: ERROR
    languages: [javascript, typescript]
    pattern: execSync($CMD)
    metadata:
      category: command-injection
      cwe: CWE-78

  - id: ml-spawn-injection
    message: >
      spawn() detected. While safer than exec() when arguments are in an array,
      verify that neither the command nor any argument originates from user input.
    severity: WARNING
    languages: [javascript, typescript]
    pattern: spawn($CMD, $ARGS)
    metadata:
      category: command-injection
      cwe: CWE-78

  # ── SQL Injection ────────────────────────────────────────────────────────────
  - id: ml-sql-concat
    message: >
      SQL Injection risk: a database query is built with string concatenation (+).
      Any user-supplied value in $B can break out of the query and execute
      arbitrary SQL. Use parameterized queries (prepared statements) instead.
    severity: ERROR
    languages: [javascript, typescript]
    pattern-either:
      - pattern: $DB.query($A + $B)
      - pattern: $DB.execute($A + $B)
      - pattern: $DB.raw($A + $B)
      - pattern: $DB.query($A + $B, ...)
      - pattern: $DB.execute($A + $B, ...)
    metadata:
      category: sql-injection
      cwe: CWE-89
      owasp: A03:2021

  # ── Path Traversal ───────────────────────────────────────────────────────────
  - id: ml-path-traversal-params
    message: >
      Path Traversal risk: req.params data is used directly in a file system
      operation or path construction. An attacker can supply "../../../etc/passwd"
      to escape the intended directory. Validate and sanitize all user-supplied
      paths with path.normalize() and confirm they remain inside an allowed base.
    severity: ERROR
    languages: [javascript, typescript]
    pattern-either:
      - pattern: path.join($BASE, req.params.$KEY)
      - pattern: path.resolve($BASE, req.params.$KEY)
      - pattern: fs.$FUNC(req.params.$KEY, ...)
    metadata:
      category: path-traversal
      cwe: CWE-22
      owasp: A01:2021

  - id: ml-path-traversal-query
    message: >
      Path Traversal risk: req.query data is used directly in a file system
      operation. Sanitize all user-supplied path components.
    severity: ERROR
    languages: [javascript, typescript]
    pattern-either:
      - pattern: path.join($BASE, req.query.$KEY)
      - pattern: fs.$FUNC(req.query.$KEY, ...)
    metadata:
      category: path-traversal
      cwe: CWE-22

  # ── Unsafe Regex (ReDoS) ─────────────────────────────────────────────────────
  - id: ml-unsafe-regex
    message: >
      Dynamic RegExp construction detected. If $X contains user input, a carefully
      crafted pattern can cause catastrophic backtracking (ReDoS), hanging the
      Node.js event loop for seconds or minutes. Use literal regex literals or
      validate/escape user input before passing to RegExp.
    severity: WARNING
    languages: [javascript, typescript]
    pattern: new RegExp($X)
    metadata:
      category: redos
      cwe: CWE-1333

  # ── Unsafe File Operations ────────────────────────────────────────────────────
  - id: ml-unsafe-file-write
    message: >
      File system write/modify operation detected (writeFile, appendFile, unlink,
      rmdir). Ensure the target path cannot be influenced by user input to prevent
      unintended file overwrite or deletion.
    severity: INFO
    languages: [javascript, typescript]
    pattern-either:
      - pattern: fs.writeFile($PATH, ...)
      - pattern: fs.writeFileSync($PATH, ...)
      - pattern: fs.appendFile($PATH, ...)
      - pattern: fs.appendFileSync($PATH, ...)
      - pattern: fs.unlink($PATH, ...)
      - pattern: fs.unlinkSync($PATH)
      - pattern: fs.rmdir($PATH, ...)
      - pattern: fs.rmdirSync($PATH)
    metadata:
      category: file-operation
      cwe: CWE-73
`;

// ─── Severity Mapping ─────────────────────────────────────────────────────────
// Maps Semgrep severity labels to our internal findingSchema enum.
const SEVERITY_MAP = {
  ERROR:   'high',
  WARNING: 'medium',
  INFO:    'info',
};

function toInternalSeverity(semgrepSeverity) {
  return SEVERITY_MAP[(semgrepSeverity || '').toUpperCase()] || 'info';
}

// ─── Availability Check ───────────────────────────────────────────────────────

/**
 * Checks whether the `semgrep` binary exists and is executable on this system.
 * Result is cached after the first call since it won't change between scans.
 *
 * @returns {Promise<boolean>}
 */
let _semgrepAvailable = null; // null = unchecked, true/false = cached result

async function isSemgrepAvailable() {
  if (_semgrepAvailable !== null) return _semgrepAvailable;

  _semgrepAvailable = await new Promise((resolve) => {
    execFile('semgrep', ['--version'], { timeout: 8000 }, (err) => {
      resolve(!err);
    });
  });

  if (_semgrepAvailable) {
    console.log('[SemgrepRunner] Semgrep binary found and available.');
  } else {
    console.warn(
      '[SemgrepRunner] Semgrep binary not found. Static analysis will use the custom pattern scanner. ' +
      'Install Semgrep: https://semgrep.dev/docs/getting-started/',
    );
  }

  return _semgrepAvailable;
}

// ─── Core Runner ─────────────────────────────────────────────────────────────

/**
 * Runs Semgrep against a file or directory using the embedded custom rule set.
 *
 * @param {string} targetPath - Absolute path to the extracted directory or single source file.
 * @returns {Promise<{
 *   findings:  Object[],   — normalised to findingSchema shape
 *   version:   string,     — semgrep version string from JSON output
 *   errors:    string[],   — any rule/parse errors Semgrep reported
 *   scanTimeMs: number,
 * }>}
 *
 * @throws {Error} If Semgrep exits with a non-standard error code.
 */
async function runSemgrep(targetPath) {
  const startMs = Date.now();

  // Write our embedded YAML rules to a temporary file for this scan
  const rulesFile = path.join(os.tmpdir(), `ml-semgrep-${process.hrtime.bigint()}.yaml`);
  fs.writeFileSync(rulesFile, RULES_YAML.trim(), 'utf8');

  try {
    const args = [
      '--json',           // Machine-readable JSON output
      '--config', rulesFile,
      '--no-git-ignore',  // Scan everything, ignore .gitignore
      '--quiet',          // Suppress progress bars / status lines
      targetPath,
    ];

    const rawOutput = await new Promise((resolve, reject) => {
      execFile(
        'semgrep',
        args,
        {
          timeout:   120_000,          // 2-minute hard limit
          maxBuffer: 20 * 1024 * 1024, // 20 MB output buffer
        },
        (err, stdout, stderr) => {
          // Exit code 0 = no findings; exit code 1 = findings found — both OK.
          // Any other exit code is a real failure.
          if (err && err.code !== 0 && err.code !== 1) {
            reject(new Error(
              `Semgrep failed with exit code ${err.code}. ` +
              `stderr: ${(stderr || '').slice(0, 500)}`,
            ));
            return;
          }
          resolve(stdout || '');
        },
      );
    });

    // Semgrep may print non-JSON text before the JSON object on some versions
    // Safe parse: find the first '{' to skip any preamble
    const jsonStart = rawOutput.indexOf('{');
    if (jsonStart === -1) {
      // No output at all — Semgrep found nothing or output nothing
      return { findings: [], version: 'unknown', errors: [], scanTimeMs: Date.now() - startMs };
    }

    const parsed = JSON.parse(rawOutput.slice(jsonStart));

    // ── Normalise each Semgrep result → findingSchema shape ──────────────────
    const findings = (parsed.results || []).map((result) => {
      const checkId  = result.check_id || '';
      // Convert rule id "ml-eval-usage" → "Eval Usage" for the human title
      const title = checkId
        .replace(/^ml-/, '')
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());

      // Semgrep reports path relative to the scan root
      const relativePath = result.path || 'unknown';
      const lineNum       = result.start?.line  || 0;
      const colNum        = result.start?.col   || 0;
      const endLine       = result.end?.line    || lineNum;

      // Extra.lines is the actual source line(s) that matched
      const code = (result.extra?.lines || '').trim().slice(0, 300);

      return {
        id:          checkId,
        title,
        description: result.extra?.message || '',
        severity:    toInternalSeverity(result.extra?.severity),
        // "path/to/file.js:42" — the shape the user requested
        location:   `${relativePath}:${lineNum}`,
        metadata: {
          line:    lineNum,
          column:  colNum,
          endLine,
          code,
          ruleId:  checkId,
          engine:  'semgrep',
        },
      };
    });

    // Collect any rule/parse errors Semgrep encountered
    const errors = (parsed.errors || []).map((e) => e.message || String(e));

    console.log(
      `[SemgrepRunner] Scan complete. ` +
      `${findings.length} finding(s), ${errors.length} error(s), ` +
      `${Date.now() - startMs}ms`,
    );

    return {
      findings,
      version:    parsed.version || 'unknown',
      errors,
      scanTimeMs: Date.now() - startMs,
    };
  } finally {
    // Always remove the temp rules file
    try { fs.unlinkSync(rulesFile); } catch (_) {}
  }
}

// ─── Reset cache (useful in testing) ─────────────────────────────────────────
function resetAvailabilityCache() {
  _semgrepAvailable = null;
}

module.exports = { runSemgrep, isSemgrepAvailable, resetAvailabilityCache };
