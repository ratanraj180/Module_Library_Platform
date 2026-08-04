/**
 * @file secretScanner.js
 * @description Secret and credential leak scanner using Gitleaks with a custom regex fallback.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { extractForScan } = require('./extractArchive');
const { isGitleaksAvailable, runGitleaks } = require('./gitleaksRunner');
const { runCustomSecretScan } = require('./customSecretScanner');

function writeTempSource(sourceCode) {
  const tempFile = path.join(
    os.tmpdir(),
    `ml-secret-src-${process.hrtime.bigint()}.js`,
  );
  fs.writeFileSync(tempFile, sourceCode, 'utf8');
  return {
    tempFile,
    cleanup() {
      try { fs.unlinkSync(tempFile); } catch (_) {}
    },
  };
}

/**
 * Scans source code / files for leaked secrets and credentials.
 *
 * @param {Object} scanTarget - The artifact to scan.
 * @param {string} [scanTarget.filePath]    - Path to the uploaded archive or file.
 * @param {string} [scanTarget.sourceCode]  - Raw source code string.
 * @param {string} [scanTarget.moduleId]    - For logging.
 *
 * @returns {Promise<Object>} secretScan - Matches secretScanSchema sub-document.
 */
async function runSecretScan(scanTarget) {
  const { filePath, sourceCode, moduleId } = scanTarget;

  if (!filePath && !sourceCode) {
    const reason = filePath === undefined && sourceCode === undefined
      ? 'No filePath or sourceCode provided (component may have empty frontendCode and backendCode).'
      : 'Both filePath and sourceCode are empty.';
    console.log(`[SecretScanner] Scan skipped: ${reason}`);
    return {
      secretsFound: false,
      totalSecrets: 0,
      secretTypes: [],
      findings: [],
      scannerMeta: {
        engine: 'skipped',
        note: reason,
      },
    };
  }

  const startMs = Date.now();
  let tempSrcHandle = null;
  let resolvedPath = filePath || null;

  if (!resolvedPath && sourceCode) {
    tempSrcHandle = writeTempSource(sourceCode);
    resolvedPath = tempSrcHandle.tempFile;
  }

  let extraction = null;

  try {
    extraction = extractForScan(resolvedPath);
    const scanPath = extraction.extractedPath;

    let findings = [];
    let engineName = 'custom-secret-patterns';
    let engineVersion = '1.0.0';
    let filesScanned = 1;

    const hasGitleaks = await isGitleaksAvailable();

    if (hasGitleaks) {
      console.log('[SecretScanner] Invoking Gitleaks CLI scanner.');
      const gitResult = await runGitleaks(scanPath);
      findings = gitResult.findings;
      engineName = 'gitleaks';
      engineVersion = gitResult.version;
    } else {
      console.log('[SecretScanner] Gitleaks not found. Running built-in custom secret regex scanner.');
      const customResult = runCustomSecretScan(scanPath);
      findings = customResult.findings;
      filesScanned = customResult.filesScanned;
    }

    const secretTypesSet = new Set(findings.map((f) => f.metadata?.secretType).filter(Boolean));
    const secretTypes = Array.from(secretTypesSet);
    const totalSecrets = findings.length;
    const secretsFound = totalSecrets > 0;
    const scanTimeMs = Date.now() - startMs;

    console.log(`[SecretScanner] Complete — found=${secretsFound}, total=${totalSecrets}, types=[${secretTypes.join(', ')}], time=${scanTimeMs}ms`);

    return {
      secretsFound,
      totalSecrets,
      secretTypes,
      findings,
      scannerMeta: {
        engine: engineName,
        version: engineVersion,
        scanTimeMs,
        filesScanned,
        note: hasGitleaks ? null : 'Gitleaks CLI not installed. Used built-in regex fallback.',
      },
    };
  } finally {
    if (extraction) extraction.cleanup();
    if (tempSrcHandle) tempSrcHandle.cleanup();
  }
}

module.exports = {
  runSecretScan,
};
