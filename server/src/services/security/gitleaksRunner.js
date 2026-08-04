/**
 * @file gitleaksRunner.js
 * @description Runs Gitleaks CLI if available on the system.
 */

const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

let _gitleaksAvailable = null;

/**
 * Checks if the gitleaks binary is available.
 */
async function isGitleaksAvailable() {
  if (_gitleaksAvailable !== null) return _gitleaksAvailable;

  _gitleaksAvailable = await new Promise((resolve) => {
    execFile('gitleaks', ['version'], { timeout: 5000 }, (err) => {
      resolve(!err);
    });
  });

  if (_gitleaksAvailable) {
    console.log('[GitleaksRunner] Gitleaks CLI found and available.');
  } else {
    console.warn('[GitleaksRunner] Gitleaks CLI not found. Falling back to custom secret patterns.');
  }

  return _gitleaksAvailable;
}

/**
 * Helper to mask/redact sensitive values.
 * e.g., "ghp_1234567890..." -> "ghp_1234********"
 */
function maskSecret(secret, ruleId) {
  if (!secret) return '';
  const len = secret.length;
  if (len <= 8) {
    return '********';
  }

  // Preserve prefix if possible (e.g. ghp_, sk_live_)
  if (secret.startsWith('ghp_') || secret.startsWith('gho_') || secret.startsWith('ghu_') || secret.startsWith('ghs_') || secret.startsWith('ghr_')) {
    return 'ghp_' + '*'.repeat(Math.max(4, len - 4));
  }
  if (secret.startsWith('sk_live_')) {
    return 'sk_live_' + '*'.repeat(Math.max(4, len - 8));
  }
  if (secret.startsWith('rk_live_')) {
    return 'rk_live_' + '*'.repeat(Math.max(4, len - 8));
  }
  if (/^(?:AKIA|ASCA|AOIS|ACCA)/.test(secret)) {
    return secret.slice(0, 4) + '*'.repeat(len - 4);
  }

  // Default mask: show first 3 and last 3 characters
  return secret.slice(0, 3) + '*'.repeat(Math.max(4, len - 6)) + secret.slice(-3);
}

/**
 * Runs gitleaks detect on the target path.
 *
 * @param {string} targetPath
 * @returns {Promise<{ findings: Object[], version: string, scanTimeMs: number }>}
 */
async function runGitleaks(targetPath) {
  const startMs = Date.now();
  const reportFile = path.join(os.tmpdir(), `gitleaks-rep-${process.hrtime.bigint()}.json`);

  try {
    // gitleaks detect --source <path> --report-path <reportFile> --no-git --exit-code 0
    // Note: --exit-code 0 prevents gitleaks from exiting with code 1 when findings are found.
    const args = [
      'detect',
      '--source', targetPath,
      '--report-path', reportFile,
      '--no-git',
      '--exit-code', '0',
    ];

    await new Promise((resolve, reject) => {
      execFile('gitleaks', args, { timeout: 120000 }, (err, stdout, stderr) => {
        if (err) {
          reject(new Error(`Gitleaks execution failed: ${err.message}. Stderr: ${stderr}`));
          return;
        }
        resolve();
      });
    });

    let findings = [];
    if (fs.existsSync(reportFile)) {
      const content = fs.readFileSync(reportFile, 'utf8');
      if (content.trim()) {
        const rawFindings = JSON.parse(content);
        findings = rawFindings.map((f) => {
          const secretVal = f.Secret || f.Match || '';
          const masked = maskSecret(secretVal, f.RuleID);
          const relativeFile = f.File || 'unknown';
          const lineNum = f.StartLine || 1;

          return {
            id: f.RuleID || 'leaked-secret',
            title: `Leaked ${f.Description || 'Credential'}`,
            description: `Identified a potential secret (${f.Description || 'token'}) in ${relativeFile}:${lineNum}. Value has been redacted.`,
            severity: 'critical', // Secret leaks are critical severity
            location: `${relativeFile}:${lineNum}`,
            metadata: {
              line: lineNum,
              column: f.StartColumn || 0,
              secretType: f.RuleID || 'generic-secret',
              maskedValue: masked,
              engine: 'gitleaks',
            },
          };
        });
      }
    }

    return {
      findings,
      version: 'latest',
      scanTimeMs: Date.now() - startMs,
    };
  } finally {
    if (fs.existsSync(reportFile)) {
      try { fs.unlinkSync(reportFile); } catch (_) {}
    }
  }
}

module.exports = {
  isGitleaksAvailable,
  runGitleaks,
  maskSecret,
};
