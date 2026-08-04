/**
 * @file extractArchive.js
 * @description Utility to safely extract uploaded archive files before scanning.
 *
 * Responsibility:
 *   Takes a file path from disk, detects if it is a ZIP archive, extracts
 *   the contents to a system temp directory, and returns the path to scan
 *   together with a cleanup function that removes the temp directory when done.
 *
 *   Non-archive files (e.g. .js, .ts, .json) are returned as-is so the
 *   scanner can process them directly — no extraction needed.
 *
 * Supported archive formats:
 *   - .zip  (via adm-zip — pure JS, no native dependencies)
 *
 * Future formats to add:
 *   - .tar.gz  via the `tar` npm package
 *   - .tgz     (same)
 */

const fs   = require('fs');
const path = require('path');
const os   = require('os');

/**
 * Extracts a ZIP archive to a fresh temp directory.
 *
 * @param {string} filePath - Absolute path to the ZIP file on disk.
 * @returns {{ extractedPath: string, cleanup: Function }}
 *
 * @throws {Error} If the file is malformed or cannot be extracted.
 */
function extractZip(filePath) {
  // Lazy-require so the module load doesn't fail if adm-zip is somehow missing
  const AdmZip = require('adm-zip');

  // Create a unique temp directory for this extraction
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ml-scan-'));

  try {
    const zip = new AdmZip(filePath);
    zip.extractAllTo(tempDir, /* overwrite */ true);

    console.log(`[extractArchive] Extracted ZIP to temp dir: ${tempDir}`);

    return {
      extractedPath: tempDir,
      cleanup() {
        try {
          fs.rmSync(tempDir, { recursive: true, force: true });
          console.log(`[extractArchive] Cleaned up temp dir: ${tempDir}`);
        } catch (e) {
          console.warn(`[extractArchive] Cleanup warning: ${e.message}`);
        }
      },
    };
  } catch (err) {
    // Clean up the temp dir if extraction failed before returning it
    try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (_) {}
    throw new Error(`Failed to extract ZIP archive: ${err.message}`);
  }
}

/**
 * Determines whether to extract a file and returns a scan target + cleanup fn.
 *
 * @param {string} filePath - Absolute path to the uploaded file.
 * @returns {{ extractedPath: string, isArchive: boolean, cleanup: Function }}
 *   extractedPath — path to pass to the scanner (may be a directory for archives)
 *   isArchive     — whether extraction was performed
 *   cleanup       — call this when scanning is complete to remove temp files
 */
function extractForScan(filePath) {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === '.zip') {
    const result = extractZip(filePath);
    return { ...result, isArchive: true };
  }

  // Not an archive — scan the file directly, no cleanup needed
  return {
    extractedPath: filePath,
    isArchive: false,
    cleanup() {}, // No-op: file belongs to the upload pipeline, not us
  };
}

module.exports = { extractForScan };
