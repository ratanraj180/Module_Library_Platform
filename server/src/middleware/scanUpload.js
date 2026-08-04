/**
 * @file scanUpload.js
 * @description Express middleware that runs the malware pipeline on every uploaded file.
 *
 * This middleware sits between `uploadArtifact` (multer) and the validation
 * rules in the module route. Its job is:
 *
 *   1. Skip gracefully if no file was uploaded (e.g. GitHub import, manual entry).
 *   2. Call `runUploadScan()` from the SecurityPipeline — this ALWAYS creates a
 *      SecurityReport document (even for clean files), fulfilling the requirement
 *      that every upload has an audit trail.
 *   3. If malware is detected:
 *        a. Delete the infected file from disk immediately.
 *        b. Return HTTP 400 with threat details and reportId.
 *        c. The module is NOT created.
 *   4. If the file is clean:
 *        a. Attach `req.securityReportId` and `req.malwareScanResult` for
 *           downstream handlers (e.g. createModule can link the report).
 *        b. Call next() to proceed with the module creation flow.
 *   5. If the scanner infrastructure itself fails (ClamAV down, adm-zip error):
 *        a. Log the error.
 *        b. Allow the upload through — scanner errors must not block legitimate
 *           uploads. The SecurityReport is marked "failed" for ops visibility.
 *
 * The module's `req.securityReportId` is later picked up by `createModule`
 * to update the SecurityReport with the real moduleId after module creation.
 */

const fs   = require('fs');
const path = require('path');
const { runUploadScan } = require('../services/security/securityPipeline');

/**
 * Express middleware — scans an uploaded file for malware before module creation.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
async function scanUpload(req, res, next) {
  // ── Skip: no file uploaded (GitHub import / manual entry without artifact) ─
  if (!req.file) {
    console.log('[ScanUpload] No file uploaded. Skipping malware scan.');
    return next();
  }

  const filePath = req.file.path;
  const userId   = req.user?.id || null;
  const filename = path.basename(filePath);

  console.log(`[ScanUpload] File received: ${filename}. Starting malware scan pipeline.`);

  try {
    // ── Delegate to the pipeline service ──────────────────────────────────────
    // runUploadScan() creates the SecurityReport, runs ClamAV (or NoOp fallback),
    // persists lifecycle fields, and returns the structured result.
    const scanResult = await runUploadScan({
      filePath,
      moduleId:    null,   // Module doesn't exist yet; linked in createModule
      triggeredBy: userId,
    });

    // ── Log outcome ───────────────────────────────────────────────────────────
    console.log(
      `[ScanUpload] Scan result — passed=${scanResult.passed}, ` +
      `riskLevel=${scanResult.riskLevel}, durationMs=${scanResult.scanTimeMs}, ` +
      `reportId=${scanResult.reportId}`,
    );

    // ── Malware detected → reject upload ──────────────────────────────────────
    if (!scanResult.passed) {
      // Delete the infected file from disk immediately
      try {
        fs.unlinkSync(filePath);
        console.warn(
          `[ScanUpload] ⚠ Malware detected. Infected file deleted: ${filename}. ` +
          `Threat: ${scanResult.threatName}`,
        );
      } catch (unlinkErr) {
        // Log but don't crash — the rejection still happens
        console.error(
          `[ScanUpload] Failed to delete infected file "${filename}": ${unlinkErr.message}`,
        );
      }

      // Return structured error response — do NOT call next()
      return res.status(400).json({
        success:  false,
        message:  'Upload rejected: malware was detected in the submitted file.',
        threat: {
          name:      scanResult.threatName || 'Unknown threat',
          riskScore: scanResult.riskScore,
          riskLevel: scanResult.riskLevel,
        },
        reportId:  scanResult.reportId,
        action:    'The file has been deleted. Please review the security report and resubmit a clean version.',
      });
    }

    // ── Clean scan → attach metadata and proceed ──────────────────────────────
    // These properties are read by createModule to link the security report
    // and optionally surface the scan badge in the API response.
    req.securityReportId  = scanResult.reportId;
    req.malwareScanResult = {
      passed:     scanResult.passed,
      riskScore:  scanResult.riskScore,
      riskLevel:  scanResult.riskLevel,
      scanTimeMs: scanResult.scanTimeMs,
      reportId:   scanResult.reportId,
      // Log a note if the NoOp scanner was used (ClamAV unavailable)
      scannerNote: scanResult.malwareResult?.scannerMeta?.note || null,
    };

    if (scanResult.malwareResult?.scannerMeta?.engine === 'NoOp') {
      console.warn(
        '[ScanUpload] ⚠ Upload allowed but ClamAV was not available. ' +
        'File was NOT scanned. See CLAMAV_SETUP.md.',
      );
    }

    return next();
  } catch (err) {
    // ── Unexpected middleware-level error ─────────────────────────────────────
    // This catch handles errors outside the pipeline (e.g. DB connection lost
    // before the SecurityReport could be created). We allow the upload through
    // and log prominently so ops can investigate.
    console.error(
      `[ScanUpload] ❌ Unexpected error in scan middleware: ${err.message}`,
      err.stack,
    );
    return next();
  }
}

module.exports = { scanUpload };
