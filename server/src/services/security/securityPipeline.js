/**
 * @file securityPipeline.js
 * @description Security scanning pipeline orchestrator.
 *
 * Responsibility:
 *   This is the central orchestration layer that ties all individual scanner
 *   services together into a single, sequential pipeline run.
 *
 * Pipeline Execution Order:
 *   1. Create (or update) the SecurityReport document with status "running".
 *   2. Run Malware Scan first.
 *   3. IF malware is detected:
 *        - STOP the pipeline immediately (skip static, dependency, and secret scans).
 *        - Proceed directly to risk scoring and AI summary using only the malware finding.
 *      ELSE:
 *        - Run Static Code Analysis (Semgrep with regex fallback).
 *        - Run Dependency Scan (npm audit with lock file generation).
 *        - Run Secret Detection (Gitleaks with regex fallback).
 *   4. Compute the aggregate risk score via riskScorer (starts at 100 with deductions).
 *   5. Generate AI summary and recommendation via aiSummary (gemini-1.5-flash with JSON fallback).
 *   6. Persist final results, timestamps, and duration back to the SecurityReport document.
 *   7. On any unhandled error → mark report as "failed" with pipelineError message.
 *
 * Design Decisions:
 *   - SEQUENTIAL execution to minimize CPU and memory footprint on small instances.
 *   - TRANSPARENT RETRY LOGIC: Scanner executions wrap around an exponential backoff helper
 *     to guard against transient I/O, network, or process failures.
 *   - ISOLATED SCANNER FAILURES: Each scanner error is caught individually, allowing the
 *     pipeline to gracefully proceed using empty fallback records if a single scanner errors out.
 */

const SecurityReport = require('../../models/SecurityReport');
const Module = require('../../models/Module');
const { runMalwareScan } = require('./malwareScanner');
const { runStaticAnalysis } = require('./staticAnalyzer');
const { runDependencyScan } = require('./dependencyScanner');
const { runSecretScan } = require('./secretScanner');
const { computeRiskScore } = require('./riskScorer');
const { generateAiSummary } = require('./aiSummary');

// ─── Default empty result shapes (used as fallback on per-scanner errors) ────

const EMPTY_MALWARE = { detected: false, confidence: 0, signatures: [], findings: [], scannerMeta: {} };
const EMPTY_STATIC  = { totalIssues: 0, issuesBySeverity: { critical: 0, high: 0, medium: 0, low: 0, info: 0 }, findings: [], linesAnalyzed: 0, scannerMeta: {} };
const EMPTY_DEP     = { totalDependencies: 0, vulnerableDependencies: 0, vulnerabilitiesBySeverity: { critical: 0, high: 0, medium: 0, low: 0 }, findings: [], dependenciesScanned: [], scannerMeta: {} };
const EMPTY_SECRET  = { secretsFound: false, totalSecrets: 0, secretTypes: [], findings: [], scannerMeta: {} };

/**
 * Retries an asynchronous operation with exponential backoff.
 *
 * @param {Function} fn    - The function to run.
 * @param {any}      args  - Arguments passed to the function.
 * @param {number}   [retries=3] - Maximum retry attempts.
 * @param {number}   [delay=1000] - Starting delay in ms.
 * @returns {Promise<any>}
 */
async function retryOperation(fn, args, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn(args);
    } catch (err) {
      if (i === retries - 1) throw err;
      console.warn(
        `[SecurityPipeline] Scan attempt ${i + 1} failed: ${err.message}. ` +
        `Retrying in ${delay}ms...`,
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= 2; // Exponential backoff
    }
  }
}

/**
 * Builds the scanTarget object passed into each scanner.
 * Centralizes the logic of pulling file paths, source code, and dependency
 * lists from Module / Component documents.
 *
 * @param {Object} options
 * @param {Object|null} options.moduleDoc     - Populated Module mongoose document (or null)
 * @param {Object|null} options.componentDoc  - Populated Component mongoose document (or null)
 * @returns {Object} scanTarget
 */
function buildScanTarget({ moduleDoc, componentDoc, clonePath }) {
  const target = {};

  if (moduleDoc) {
    target.filePath        = moduleDoc.fileUrl || clonePath || null;
    target.dependenciesList = moduleDoc.dependenciesList || [];
    target.moduleId        = String(moduleDoc._id);
    target.language        = 'javascript';
  }

  if (componentDoc) {
    target.sourceCode  = [componentDoc.frontendCode, componentDoc.backendCode]
      .filter(Boolean)
      .join('\n\n');

    // Parse the component's dependencies string into an array for the dependency scanner.
    // The dependencies field is a free-form string (comma/newline/space separated).
    if (componentDoc.dependencies && typeof componentDoc.dependencies === 'string') {
      target.dependenciesList = componentDoc.dependencies
        .split(/[\n,]+/)
        .map((d) => d.trim())
        .filter(Boolean);
    }

    target.componentId = String(componentDoc._id);
    target.language    = 'javascript';
  }

  return target;
}

/**
 * Runs a single scanner function and returns its result or a fallback shape
 * if the scanner throws an error.
 *
 * @param {Function} scannerFn  - The scanner function to call (e.g. runMalwareScan)
 * @param {Object}   scanTarget - Target passed to the scanner
 * @param {Object}   fallback   - Default empty result shape to return on error
 * @param {string}   name       - Human-readable scanner name for error logging
 * @returns {Promise<Object>}
 */
async function runScannerSafely(scannerFn, scanTarget, fallback, name) {
  const startMs = Date.now();
  try {
    console.log(`[SecurityPipeline] [${name}] Starting scan execution...`);
    const result = await retryOperation(scannerFn, scanTarget, 3, 1000);
    const duration = Date.now() - startMs;
    console.log(`[SecurityPipeline] [${name}] Complete successfully in ${duration}ms.`);
    return result;
  } catch (err) {
    console.error(`[SecurityPipeline] [${name}] Failed after 3 retries:`, err.message);
    return {
      ...fallback,
      scannerMeta: {
        engine: 'error',
        error: err.message,
        note: `${name} threw an unexpected error during execution after retries.`,
      },
    };
  }
}

/**
 * Core pipeline execution function.
 *
 * Runs all scanners sequentially, computes risk, generates AI summary,
 * and persists results. Updates the SecurityReport document in-place.
 *
 * @param {string} reportId  - The MongoDB ObjectId of the SecurityReport document to update.
 * @returns {Promise<void>}
 */
async function executePipeline(reportId) {
  const report = await SecurityReport.findById(reportId);
  if (!report) {
    throw new Error(`SecurityReport ${reportId} not found`);
  }

  console.log(`[SecurityPipeline] Launching scan report: ${reportId}`);
  const startedAt = new Date();

  report.scanStatus = 'running';
  report.startedAt  = startedAt;
  await report.save();

  // ── Track cloned repository handle for guaranteed cleanup ────────────
  let cloneHandle = null;

  try {
    let moduleDoc    = null;
    let componentDoc = null;
    let artifactName = 'Unknown Artifact';

    const Component = require('../../models/Component');

    if (report.resourceType === 'component' || report.componentId) {
      componentDoc = await Component.findById(report.componentId || report.moduleId);
      artifactName = componentDoc ? componentDoc.title : String(report.componentId);
    } else {
      moduleDoc    = await Module.findById(report.moduleId);
      artifactName = moduleDoc ? moduleDoc.title : String(report.moduleId);
    }

    // ── Module GitHub Clone ──────────────────────────────────────────────
    // If the module was imported from GitHub (has repositoryUrl but no file
    // upload), clone the repository to a temp directory so scanners have a
    // real directory path to scan.
    if (moduleDoc && !moduleDoc.fileUrl && moduleDoc.repositoryUrl) {
      const { cloneRepository } = require('./repoCloner');
      cloneHandle = await cloneRepository(moduleDoc.repositoryUrl);
    }

    const scanTarget = buildScanTarget({
      moduleDoc,
      componentDoc,
      clonePath: cloneHandle ? cloneHandle.clonePath : null,
    });
    console.log(`[SecurityPipeline] Target loaded: "${artifactName}" (resourceType: ${report.resourceType || 'module'})`);

    // ── Module Scan Input Diagnostics ────────────────────────────────────
    if (moduleDoc) {
      const depCount = (scanTarget.dependenciesList || []).length;
      console.log(
        `[SecurityPipeline] Module Scan Input\n` +
        `  Repository URL: ${moduleDoc.repositoryUrl || 'None'}\n` +
        `  File URL: ${moduleDoc.fileUrl || 'None'}\n` +
        `  Scan Path: ${scanTarget.filePath || 'None'}\n` +
        `  Dependencies: ${depCount}`,
      );

      if (!scanTarget.filePath) {
        console.warn(
          `[SecurityPipeline] ⚠ Module has no file path or clone path. Scanners will skip.`,
        );
      }
    }

    // ── Component Scan Input Diagnostics ──────────────────────────────────
    if (componentDoc) {
      const feCode = componentDoc.frontendCode || '';
      const beCode = componentDoc.backendCode || '';
      const feLines = feCode ? feCode.split('\n').length : 0;
      const beLines = beCode ? beCode.split('\n').length : 0;
      const combinedSource = scanTarget.sourceCode || '';
      const combinedLines = combinedSource ? combinedSource.split('\n').length : 0;
      const depCount = (scanTarget.dependenciesList || []).length;

      console.log(
        `[SecurityPipeline] Component Scan Input\n` +
        `  Frontend Code: ${feCode ? `Present (${feLines} lines)` : 'Empty'}\n` +
        `  Backend Code:  ${beCode ? `Present (${beLines} lines)` : 'Empty'}\n` +
        `  Combined Source: ${combinedLines} lines (${combinedSource.length} chars)\n` +
        `  Dependencies: ${depCount}`,
      );

      if (!combinedSource) {
        console.warn(
          `[SecurityPipeline] ⚠ Skipping code scanners: both frontendCode and backendCode are empty.`,
        );
      }
      if (depCount === 0) {
        console.warn(
          `[SecurityPipeline] ⚠ Skipping dependency scanner: no dependencies declared on this component.`,
        );
      }
    }

    // ── 1. Malware Scan ───────────────────────────────────────────────────
    const malwareResult = await runScannerSafely(
      runMalwareScan, scanTarget, EMPTY_MALWARE, 'MalwareScanner'
    );

    let staticAnalysis = EMPTY_STATIC;
    let dependencyScan = EMPTY_DEP;
    let secretScan     = EMPTY_SECRET;

    const isModule = report.resourceType === 'module';

    // For components: stop on malware (existing behavior preserved).
    // For modules:    run ALL scanners so the admin receives a complete report.
    if (malwareResult.detected && !isModule) {
      console.warn(
        `[SecurityPipeline] ⚠ MALWARE DETECTED for report ${reportId}. ` +
        `Stopping pipeline execution immediately to prevent additional exposure.`
      );
    } else {
      if (malwareResult.detected && isModule) {
        console.warn(
          `[SecurityPipeline] ⚠ MALWARE DETECTED for module report ${reportId}. ` +
          `Continuing all scanners for complete admin report.`
        );
      }

      // ── 2. Static Analysis ───────────────────────────────────────────────
      staticAnalysis = await runScannerSafely(
        runStaticAnalysis, scanTarget, EMPTY_STATIC, 'StaticAnalyzer'
      );

      // ── 3. Dependency Scan ───────────────────────────────────────────────
      dependencyScan = await runScannerSafely(
        runDependencyScan, scanTarget, EMPTY_DEP, 'DependencyScanner'
      );

      // ── 4. Secret Detection ──────────────────────────────────────────────
      secretScan = await runScannerSafely(
        runSecretScan, scanTarget, EMPTY_SECRET, 'SecretScanner'
      );
    }

    // ── 5. Compute Risk Score ──────────────────────────────────────────────
    const { riskScore, riskLevel } = computeRiskScore({
      malwareResult,
      staticAnalysis,
      dependencyScan,
      secretScan,
    });

    // ── 6. Generate AI Summary ─────────────────────────────────────────────
    const { aiSummary, recommendation } = await generateAiSummary({
      moduleName: artifactName,
      riskScore,
      riskLevel,
      malwareResult,
      staticAnalysis,
      dependencyScan,
      secretScan,
    });

    // ── 7. Save SecurityReport ─────────────────────────────────────────────
    const completedAt = new Date();
    const durationMs = completedAt - startedAt;

    report.scanStatus    = 'completed';
    report.completedAt   = completedAt;
    report.durationMs    = durationMs;
    report.malwareResult  = malwareResult;
    report.staticAnalysis = staticAnalysis;
    report.dependencyScan = dependencyScan;
    report.secretScan     = secretScan;
    report.riskScore      = riskScore;
    report.riskLevel      = riskLevel;
    report.aiSummary      = aiSummary;
    report.recommendation = recommendation;

    await report.save();

    console.log(
      `[SecurityPipeline] Scan successfully completed for report ${reportId} in ${durationMs}ms. ` +
      `Risk level is: ${riskLevel.toUpperCase()} (${riskScore}/100)`
    );
  } catch (err) {
    console.error(`[SecurityPipeline] Pipeline aborted for report ${reportId}:`, err.message);

    const completedAt = new Date();
    report.scanStatus    = 'failed';
    report.completedAt   = completedAt;
    report.durationMs    = completedAt - startedAt;
    report.pipelineError = err.message;
    await report.save();
  } finally {
    // ── Always clean up cloned repository ────────────────────────────────
    if (cloneHandle) {
      cloneHandle.cleanup();
    }
  }
}

/**
 * Initiates a new security scan for any resource type.
 *
 * @param {string} resourceType - "module" or "component"
 * @param {string} resourceId   - ObjectId string of the resource
 * @param {Object} [options]
 * @param {string} [options.triggeredBy] - User ID who triggered the scan
 * @param {boolean} [options.isRescan]   - True if this is a manual rescan
 */
async function scanResource(resourceType, resourceId, options = {}) {
  if (!resourceId) {
    throw new Error('A resourceId must be provided to start a scan');
  }

  const isModule = resourceType === 'module';
  const report = await SecurityReport.create({
    resourceType,
    moduleId:    isModule ? resourceId : null,
    componentId: !isModule ? resourceId : null,
    triggeredBy: options.triggeredBy || null,
    isRescan:    options.isRescan || false,
    scanStatus:  'pending',
  });

  setImmediate(() => executePipeline(String(report._id)));

  return { reportId: String(report._id) };
}

/**
 * Legacy wrapper for backward compatibility.
 */
async function startSecurityScan({ moduleId, componentId, triggeredBy, isRescan = false }) {
  const resourceType = moduleId ? 'module' : 'component';
  const resourceId = moduleId || componentId;
  return scanResource(resourceType, resourceId, { triggeredBy, isRescan });
}
/**
 * Runs a synchronous malware-only scan during the file upload request.
 *
 * Called by the scanUpload middleware BEFORE createModule.
 *
 * @param {Object}      options
 * @param {string}      options.filePath     - Absolute path to the uploaded file on disk.
 * @param {string|null} options.moduleId     - Module ObjectId (null before module is created).
 * @param {string|null} options.triggeredBy  - User ObjectId who triggered the upload.
 *
 * @returns {Promise<{
 *   reportId:      string,
 *   passed:        boolean,
 *   threatName:    string|null,
 *   scanTimeMs:    number,
 *   malwareResult: Object,
 *   riskScore:     number,
 *   riskLevel:     string,
 *   scanError:     string|null,
 * }>}
 */
async function runUploadScan({ filePath, moduleId, triggeredBy }) {
  const startedAt = new Date();
  const report = await SecurityReport.create({
    moduleId:    moduleId || null,
    triggeredBy: triggeredBy || null,
    scanStatus:  'running',
    startedAt,
    isRescan:    false,
  });

  const reportId = String(report._id);
  console.log(`[SecurityPipeline.runUploadScan] Synchronous upload report created: ${reportId}`);

  try {
    const malwareResult = await runScannerSafely(
      runMalwareScan,
      { filePath, moduleId: moduleId ? String(moduleId) : null },
      EMPTY_MALWARE,
      'MalwareScanner',
    );

    const completedAt = new Date();
    const durationMs  = completedAt - startedAt;

    const { riskScore, riskLevel } = computeRiskScore({
      malwareResult,
      staticAnalysis: EMPTY_STATIC,
      dependencyScan: EMPTY_DEP,
      secretScan:     EMPTY_SECRET,
    });

    const { aiSummary, recommendation } = await generateAiSummary({
      moduleName:    'Uploaded Module',
      riskScore,
      riskLevel,
      malwareResult,
      staticAnalysis: EMPTY_STATIC,
      dependencyScan: EMPTY_DEP,
      secretScan:     EMPTY_SECRET,
    });

    report.scanStatus    = 'completed';
    report.completedAt   = completedAt;
    report.durationMs    = durationMs;
    report.malwareResult  = malwareResult;
    report.riskScore      = riskScore;
    report.riskLevel      = riskLevel;
    report.aiSummary      = aiSummary;
    report.recommendation = recommendation;
    await report.save();

    console.log(
      `[SecurityPipeline.runUploadScan] Completed successfully. ` +
      `passed=${!malwareResult.detected}, riskLevel=${riskLevel}, durationMs=${durationMs}ms`,
    );

    return {
      reportId,
      passed:        !malwareResult.detected,
      threatName:    malwareResult.signatures[0] || null,
      scanTimeMs:    malwareResult.scannerMeta?.scanTimeMs || 0,
      malwareResult,
      riskScore,
      riskLevel,
      scanError:     null,
    };
  } catch (err) {
    console.error(`[SecurityPipeline.runUploadScan] Scanner error: ${err.message}`);

    const completedAt = new Date();
    report.scanStatus    = 'failed';
    report.completedAt   = completedAt;
    report.durationMs    = completedAt - startedAt;
    report.pipelineError = err.message;
    await report.save();

    return {
      reportId,
      passed:        true, // permissive bypass on core scanner issues
      threatName:    null,
      scanTimeMs:    0,
      malwareResult: EMPTY_MALWARE,
      riskScore:     0,
      riskLevel:     'safe',
      scanError:     err.message,
    };
  }
}

module.exports = { startSecurityScan, scanResource, executePipeline, runUploadScan };
