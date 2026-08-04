/**
 * @file repoCloner.js
 * @description GitHub repository cloner for Module security scanning.
 *
 * Responsibility:
 *   Validates a GitHub URL, clones the public repository into a temporary
 *   directory using a shallow clone, and returns a handle with the clone
 *   path and a cleanup function that deletes the temp directory.
 *
 * Design decisions:
 *   - PUBLIC REPOS ONLY. No GitHub token support — private repos will fail
 *     with a descriptive error message.
 *   - SHALLOW CLONE (--depth 1 --single-branch) to minimise disk and network
 *     usage. Security scanning does not need git history.
 *   - 60-SECOND TIMEOUT to guard against hung clones on unreachable repos.
 *   - DETERMINISTIC CLEANUP via the returned cleanup() function, called by
 *     the pipeline in a finally block.
 *
 * This file does NOT touch any scanner, component, auth, or frontend code.
 */

'use strict';

const fs         = require('fs');
const path       = require('path');
const os         = require('os');
const crypto     = require('crypto');
const { execFile } = require('child_process');

// ─── GitHub URL Validation ────────────────────────────────────────────────────

/**
 * Validates and parses a GitHub repository URL.
 *
 * Accepts:
 *   https://github.com/owner/repo
 *   https://github.com/owner/repo.git
 *   https://github.com/owner/repo/
 *   http://github.com/owner/repo
 *
 * @param {string} url — The repository URL to validate.
 * @returns {{ owner: string, repo: string }} Parsed owner and repo name.
 * @throws {Error} If the URL is not a valid GitHub repository URL.
 */
function validateGithubUrl(url) {
  if (!url || typeof url !== 'string') {
    throw new Error('[ModulePipeline] Repository URL is required.');
  }

  const trimmed = url.trim().replace(/\/+$/, '').replace(/\.git$/, '');
  const match = trimmed.match(
    /^https?:\/\/github\.com\/([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)$/,
  );

  if (!match) {
    throw new Error(
      `[ModulePipeline] Invalid GitHub URL: "${url}". ` +
      `Expected format: https://github.com/owner/repository`,
    );
  }

  return { owner: match[1], repo: match[2] };
}

// ─── Repository Cloner ───────────────────────────────────────────────────────

/**
 * Clones a public GitHub repository into a temporary directory.
 *
 * Uses `git clone --depth 1 --single-branch` for minimal footprint.
 * Returns a handle with the clone path and a cleanup function.
 *
 * @param {string} repositoryUrl — Full GitHub repository URL.
 * @returns {Promise<{ clonePath: string, cleanup: Function }>}
 * @throws {Error} On invalid URL, clone failure, timeout, or private repo.
 */
async function cloneRepository(repositoryUrl) {
  // ── Validate URL ────────────────────────────────────────────────────────
  const { owner, repo } = validateGithubUrl(repositoryUrl);

  // ── Create unique temp directory ────────────────────────────────────────
  const uniqueId = crypto.randomBytes(8).toString('hex');
  const parentDir = path.join(os.tmpdir(), `module-library-${uniqueId}`);
  fs.mkdirSync(parentDir, { recursive: true });

  const clonePath = path.join(parentDir, repo);
  const cloneUrl = `https://github.com/${owner}/${repo}.git`;

  console.log(`[ModulePipeline] Cloning repository: ${cloneUrl}`);

  // ── Run git clone ──────────────────────────────────────────────────────
  try {
    await new Promise((resolve, reject) => {
      execFile(
        'git',
        [
          'clone',
          '--depth', '1',
          '--single-branch',
          cloneUrl,
          clonePath,
        ],
        {
          timeout: 60_000,       // 60-second timeout
          maxBuffer: 10 * 1024 * 1024, // 10 MB
          windowsHide: true,
        },
        (err, stdout, stderr) => {
          if (err) {
            // Provide descriptive error messages for common failure modes
            const exitCode = err.code;
            const output = (stderr || stdout || '').trim();

            if (exitCode === 128 || output.includes('not found') || output.includes('Repository not found')) {
              return reject(new Error(
                `[ModulePipeline] Repository not found or is private: ${cloneUrl}. ` +
                `Only public GitHub repositories are supported.`,
              ));
            }

            if (err.killed || output.includes('timeout')) {
              return reject(new Error(
                `[ModulePipeline] Clone timed out after 60 seconds for: ${cloneUrl}. ` +
                `Check your network connection or try again later.`,
              ));
            }

            return reject(new Error(
              `[ModulePipeline] Git clone failed (exit ${exitCode}): ${output.slice(0, 500)}`,
            ));
          }

          resolve();
        },
      );
    });
  } catch (cloneErr) {
    // Clean up the empty parent directory on clone failure
    try { fs.rmSync(parentDir, { recursive: true, force: true }); } catch (_) {}
    throw cloneErr;
  }

  // ── Verify clone path exists ───────────────────────────────────────────
  if (!fs.existsSync(clonePath)) {
    try { fs.rmSync(parentDir, { recursive: true, force: true }); } catch (_) {}
    throw new Error(
      `[ModulePipeline] Clone completed but directory not found at: ${clonePath}`,
    );
  }

  console.log(`[ModulePipeline] Repository cloned successfully.`);
  console.log(`[ModulePipeline] Clone path: ${clonePath}`);

  // ── Return handle with cleanup function ────────────────────────────────
  return {
    clonePath,
    cleanup() {
      try {
        console.log(`[ModulePipeline] Cleaning temporary repository...`);
        fs.rmSync(parentDir, { recursive: true, force: true });
        console.log(`[ModulePipeline] Temporary repository deleted.`);
      } catch (cleanupErr) {
        console.error(
          `[ModulePipeline] Failed to clean up temp directory ${parentDir}: ` +
          cleanupErr.message,
        );
      }
    },
  };
}

module.exports = { validateGithubUrl, cloneRepository };
