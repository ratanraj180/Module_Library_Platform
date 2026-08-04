/**
 * @file dependencyScanner.js
 * @description npm audit–based dependency vulnerability scanner.
 *
 * ─── WHAT THIS FILE DOES ─────────────────────────────────────────────────────
 *
 * Replaces the architecture stub with a full implementation that:
 *
 *   1. Locates package.json inside the uploaded artifact (ZIP or directory).
 *   2. Parses all four dependency sections:
 *        dependencies, devDependencies, peerDependencies, optionalDependencies.
 *   3. Generates a package-lock.json (without downloading packages) if none exists.
 *   4. Runs `npm audit --json` to query the npm advisory database.
 *   5. Parses npm audit v1 (npm 6) and v2 (npm 7+) output formats.
 *   6. Normalises every vulnerability into the `findingSchema` shape:
 *        id (CVE or advisory id), title, description, severity, location, metadata.
 *   7. Returns the complete `dependencyScanSchema` sub-document.
 *
 * ─── HOW npm audit WORKS ─────────────────────────────────────────────────────
 *
 *   npm audit reads package-lock.json or npm-shrinkwrap.json, sends the
 *   dependency tree to the npm registry advisory API, and returns a JSON
 *   report of all known CVEs and security advisories for the exact installed
 *   versions.
 *
 *   Because the uploaded ZIP may not contain a lock file (developers often
 *   .gitignore it), we first run:
 *
 *     npm install --package-lock-only --ignore-scripts
 *
 *   This resolves the full dependency tree from the npm registry and writes
 *   a lock file — WITHOUT downloading any node_modules to disk.
 *   --ignore-scripts prevents any install scripts from running (critical for
 *   scanning untrusted code).
 *
 *   Then we run:
 *
 *     npm audit --json
 *
 *   npm exits with code 1 when vulnerabilities are found. We treat code 0
 *   (no vulns) and code 1 (vulns found) as both valid. Any other exit code
 *   is a real error.
 *
 * ─── OUTPUT FORMAT COMPATIBILITY ─────────────────────────────────────────────
 *
 *   npm 7+ produces "audit report v2" (auditReportVersion: 2) which nests
 *   vulnerabilities by package name and separates advisory metadata into
 *   a separate `via` array. npm 6 produces a flat `advisories` map.
 *   We detect and parse both.
 *
 * ─── SEVERITY MAPPING ─────────────────────────────────────────────────────────
 *
 *   npm        → our schema
 *   critical   → critical
 *   high       → high
 *   moderate   → medium   (npm uses "moderate", schema uses "medium")
 *   low        → low
 *   info       → low      (collapsed — not in dependencyScanSchema)
 *
 * ─── GRACEFUL DEGRADATION ────────────────────────────────────────────────────
 *
 *   If npm audit fails (private packages, network unavailable, malformed
 *   package.json), we return a partial result: the parsed dependency list is
 *   stored in dependenciesScanned, no CVE findings, and a descriptive note
 *   explains what happened. The pipeline is not interrupted.
 *
 * ─── SECURITY NOTE ────────────────────────────────────────────────────────────
 *
 *   All npm commands run with --ignore-scripts. This prevents preinstall /
 *   postinstall hooks in the uploaded package from executing on the server.
 */

'use strict';

const fs       = require('fs');
const path     = require('path');
const os       = require('os');
const { execFile } = require('child_process');

const { extractForScan } = require('./extractArchive');

// ─── Constants ────────────────────────────────────────────────────────────────

/** Source file extensions: all four dep sections we read from package.json */
const DEP_SECTIONS = [
  'dependencies',
  'devDependencies',
  'peerDependencies',
  'optionalDependencies',
];

/** Directories we skip when walking to find package.json */
const SKIP_WALK_DIRS = new Set(['node_modules', '.git', 'dist', 'build', '.cache']);

/** npm audit exit codes that mean "ran fine, possibly found things" */
const AUDIT_OK_CODES = new Set([0, 1]);

// ─── Severity Mapping ─────────────────────────────────────────────────────────

/**
 * Maps npm audit severity strings to our internal enum.
 * npm uses "moderate" where our schema uses "medium".
 * npm "info" is collapsed to "low" since dependencyScanSchema has no info bucket.
 */
function mapSeverity(npmSeverity) {
  const map = {
    critical: 'critical',
    high:     'high',
    moderate: 'medium',
    medium:   'medium',
    low:      'low',
    info:     'low',
  };
  return map[(npmSeverity || '').toLowerCase()] || 'low';
}

// ─── Package.json Locator ─────────────────────────────────────────────────────

/**
 * Walks a directory tree (BFS, max depth 5) to find the first package.json.
 * The first one found closest to the root is returned — this handles the case
 * where an uploaded ZIP nests the project one directory deep (e.g. repo-main/).
 *
 * @param {string} startDir
 * @returns {string|null} Absolute path to package.json, or null if not found.
 */
function findPackageJson(startDir) {
  // BFS queue — each entry is [absolutePath, depth]
  const queue = [[startDir, 0]];

  while (queue.length > 0) {
    const [dir, depth] = queue.shift();

    if (depth > 5) continue;

    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }

    // Check for package.json at this level
    const pkgEntry = entries.find(
      (e) => e.isFile() && e.name === 'package.json',
    );
    if (pkgEntry) {
      return path.join(dir, 'package.json');
    }

    // Enqueue subdirectories
    for (const e of entries) {
      if (e.isDirectory() && !SKIP_WALK_DIRS.has(e.name)) {
        queue.push([path.join(dir, e.name), depth + 1]);
      }
    }
  }

  return null;
}

// ─── package.json Parser ──────────────────────────────────────────────────────

/**
 * Parses a package.json file and returns the combined list of all declared
 * dependency names + versions, plus total count.
 *
 * @param {string} pkgJsonPath — Absolute path to package.json.
 * @returns {{ deps: Record<string,string>, totalCount: number, names: string[] }}
 *   deps        — { "express": "^4.17.1", ... } merged from all sections
 *   totalCount  — total number of unique packages
 *   names       — sorted array of package names (stored in dependenciesScanned)
 */
function parsePackageDependencies(pkgJsonPath) {
  let pkg;
  try {
    pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
  } catch (e) {
    throw new Error(`Cannot parse package.json at ${pkgJsonPath}: ${e.message}`);
  }

  const deps = {};
  for (const section of DEP_SECTIONS) {
    if (pkg[section] && typeof pkg[section] === 'object') {
      Object.assign(deps, pkg[section]);
    }
  }

  const names = Object.keys(deps).sort();
  return { deps, totalCount: names.length, names };
}

// ─── npm Command Runner ───────────────────────────────────────────────────────

/**
 * Wraps execFile in a Promise. Resolves with { stdout, stderr, code }.
 * Never rejects — returns the exit code and output regardless of success/failure.
 *
 * @param {string}   cmd      - Executable name (e.g. 'npm')
 * @param {string[]} args     - Argument array
 * @param {string}   cwd      - Working directory
 * @param {number}   [timeoutMs=120000] - Kill after this many ms
 * @returns {Promise<{ stdout: string, stderr: string, code: number|null }>}
 */
function runCommand(cmd, args, cwd, timeoutMs = 120_000) {
  return new Promise((resolve) => {
    execFile(
      cmd,
      args,
      {
        cwd,
        timeout:   timeoutMs,
        maxBuffer: 20 * 1024 * 1024,  // 20 MB
        // Prevent npm from using the current terminal's stdin
        windowsHide: true,
      },
      (err, stdout, stderr) => {
        resolve({
          stdout: stdout || '',
          stderr: stderr || '',
          code:   err ? (err.code ?? null) : 0,
        });
      },
    );
  });
}

// ─── npm install --package-lock-only ─────────────────────────────────────────

/**
 * Generates a package-lock.json without downloading any packages.
 * This is the prerequisite for `npm audit` when no lock file is present.
 *
 * Uses --ignore-scripts to prevent preinstall/postinstall hooks from running
 * on the server — critical security measure when scanning untrusted code.
 *
 * @param {string} workDir - Directory containing package.json.
 * @returns {Promise<{ ok: boolean, error: string|null }>}
 */
async function generateLockFile(workDir) {
  console.log('[DependencyScanner] Generating package-lock.json (no download)...');

  const { code, stderr } = await runCommand(
    'npm',
    [
      'install',
      '--package-lock-only',   // Resolve deps + write lock file, do NOT download
      '--ignore-scripts',      // Never run install hooks on untrusted code
      '--no-fund',             // Suppress funding messages
      '--no-audit',            // Skip audit during install (we run it separately)
      '--loglevel', 'error',   // Suppress all non-error output
    ],
    workDir,
    90_000,  // 90-second timeout (network resolve can be slow)
  );

  if (code !== 0) {
    return {
      ok:    false,
      error: `npm install --package-lock-only failed (exit ${code}): ${stderr.slice(0, 500)}`,
    };
  }

  console.log('[DependencyScanner] package-lock.json generated.');
  return { ok: true, error: null };
}

// ─── npm audit Runner ─────────────────────────────────────────────────────────

/**
 * Runs `npm audit --json` in the given directory and returns the parsed JSON.
 *
 * npm exits 0 when no vulnerabilities are found, 1 when vulnerabilities
 * are found. Both are valid — any other code is a real error.
 *
 * @param {string} workDir - Directory containing package.json + package-lock.json.
 * @returns {Promise<{ auditJson: Object|null, error: string|null }>}
 */
async function runNpmAudit(workDir) {
  console.log('[DependencyScanner] Running npm audit --json...');

  const { stdout, stderr, code } = await runCommand(
    'npm',
    ['audit', '--json', '--ignore-scripts'],
    workDir,
    60_000,  // 60-second timeout
  );

  // npm exits 1 when it finds vulnerabilities — that is expected and OK
  if (!AUDIT_OK_CODES.has(code)) {
    return {
      auditJson: null,
      error: `npm audit failed (exit ${code}): ${stderr.slice(0, 500)}`,
    };
  }

  // The audit output may have non-JSON preamble (npm warnings) on stderr.
  // stdout should be pure JSON when --json is used.
  if (!stdout.trim()) {
    return { auditJson: null, error: 'npm audit produced no output.' };
  }

  try {
    // Find the first '{' to skip any accidental text before the JSON
    const jsonStart = stdout.indexOf('{');
    if (jsonStart === -1) {
      return { auditJson: null, error: 'npm audit JSON not found in output.' };
    }
    const auditJson = JSON.parse(stdout.slice(jsonStart));
    return { auditJson, error: null };
  } catch (parseErr) {
    return { auditJson: null, error: `npm audit JSON parse error: ${parseErr.message}` };
  }
}

// ─── Audit Output Parsers ─────────────────────────────────────────────────────

/**
 * Parses npm audit v1 output (npm < 7).
 *
 * v1 structure:
 *   {
 *     "advisories": {
 *       "1234": {
 *         "module_name": "lodash",
 *         "cves": ["CVE-2021-23337"],
 *         "severity": "high",
 *         "title": "Prototype Pollution",
 *         "url": "...",
 *         "recommendation": "Upgrade to 4.17.21",
 *         "findings": [{ "version": "4.17.20", "paths": [...] }]
 *       }
 *     },
 *     "metadata": {
 *       "vulnerabilities": { "info": 0, "low": 0, "moderate": 5, "high": 2, "critical": 1 },
 *       "totalDependencies": 15
 *     }
 *   }
 *
 * @param {Object}   auditJson  - Parsed npm audit JSON.
 * @param {string[]} depNames   - All dependency names from package.json.
 * @returns {{ findings: Object[], vulnerabilitiesBySeverity: Object, vulnerableDependencies: number }}
 */
function parseAuditV1(auditJson, depNames) {
  const advisories = auditJson.advisories || {};
  const findings   = [];
  const vulnerablePackages = new Set();

  for (const [advisoryId, advisory] of Object.entries(advisories)) {
    const packageName = advisory.module_name || 'unknown';
    const severity    = mapSeverity(advisory.severity);
    const cves        = Array.isArray(advisory.cves) && advisory.cves.length > 0
      ? advisory.cves
      : [];

    // Use first CVE as the finding id, fall back to advisory id
    const findingId = cves[0] || `GHSA-${advisoryId}`;

    // Collect all installed version ranges from the findings array
    const installedVersions = (advisory.findings || [])
      .map((f) => f.version)
      .filter(Boolean)
      .join(', ');

    findings.push({
      id:          findingId,
      title:       `${packageName}: ${advisory.title || 'Security Advisory'}`,
      description: advisory.overview || advisory.recommendation || advisory.title || '',
      severity,
      // Location is the dependency declaration file
      location:    'package.json',
      metadata: {
        package:           packageName,
        installedVersions,
        fixedIn:           advisory.patched_versions || advisory.recommendation || null,
        affectedVersions:  advisory.vulnerable_versions || null,
        cves,
        advisoryId:        String(advisoryId),
        advisoryUrl:       advisory.url || null,
        recommendation:    advisory.recommendation || null,
        engine:            'npm-audit-v1',
      },
    });

    vulnerablePackages.add(packageName);
  }

  // npm v1 metadata has the authoritative severity counts
  const meta = (auditJson.metadata || {}).vulnerabilities || {};
  const vulnerabilitiesBySeverity = {
    critical: meta.critical || 0,
    high:     meta.high     || 0,
    medium:   meta.moderate || 0,  // npm uses "moderate"
    low:      (meta.low     || 0) + (meta.info || 0),
  };

  return { findings, vulnerabilitiesBySeverity, vulnerableDependencies: vulnerablePackages.size };
}

/**
 * Parses npm audit v2 output (npm >= 7).
 *
 * v2 structure:
 *   {
 *     "auditReportVersion": 2,
 *     "vulnerabilities": {
 *       "lodash": {
 *         "name": "lodash",
 *         "severity": "high",
 *         "via": [
 *           {
 *             "source": 1234,
 *             "name": "lodash",
 *             "title": "Prototype Pollution",
 *             "url": "https://github.com/advisories/GHSA-...",
 *             "severity": "high",
 *             "range": "< 4.17.21"
 *           }
 *         ],
 *         "range": "<4.17.21",
 *         "fixAvailable": { "name": "lodash", "version": "4.17.21" }
 *       }
 *     },
 *     "metadata": {
 *       "vulnerabilities": { "info": 0, "low": 0, "moderate": 5, "high": 2, "critical": 1, "total": 8 },
 *       "dependencies": { "prod": 10, "dev": 5, "total": 15 }
 *     }
 *   }
 *
 * @param {Object}   auditJson - Parsed npm audit JSON.
 * @param {string[]} depNames  - All dependency names from package.json.
 * @returns {{ findings: Object[], vulnerabilitiesBySeverity: Object, vulnerableDependencies: number }}
 */
function parseAuditV2(auditJson, depNames) {
  const vulnerabilities = auditJson.vulnerabilities || {};
  const findings        = [];
  const vulnerablePackages = new Set();

  for (const [packageName, vulnInfo] of Object.entries(vulnerabilities)) {
    const severity = mapSeverity(vulnInfo.severity);
    vulnerablePackages.add(packageName);

    // `via` is an array of advisory objects OR package-name strings (transitive deps).
    // We only create findings for the advisory objects (those with a `title` field).
    const viaAdvisories = (vulnInfo.via || []).filter(
      (v) => typeof v === 'object' && v.title,
    );

    if (viaAdvisories.length === 0) {
      // This package is vulnerable only because a transitive dep is — still log it
      findings.push({
        id:          `transitive-${packageName}`,
        title:       `${packageName}: Vulnerable transitive dependency`,
        description: (
          `${packageName} includes a dependency with a known vulnerability. ` +
          `Range affected: ${vulnInfo.range || 'unknown'}.`
        ),
        severity,
        location:    'package.json',
        metadata: {
          package:          packageName,
          range:            vulnInfo.range || null,
          fixAvailable:     vulnInfo.fixAvailable || null,
          isDirect:         vulnInfo.isDirect || false,
          isTransitive:     true,
          cves:             [],
          engine:           'npm-audit-v2',
        },
      });
      continue;
    }

    for (const advisory of viaAdvisories) {
      const advisoryId = advisory.source
        ? String(advisory.source)
        : (advisory.url || '').split('/').pop() || 'unknown';

      // Try to find CVE numbers from advisory URL patterns.
      // GitHub advisory URLs contain the GHSA id, not CVE — CVE ids are NOT
      // directly available in npm audit v2 JSON output. We record the GHSA id
      // as the finding id; operators can look it up at advisory.url.
      const cveMatch = (advisory.url || '').match(/CVE-\d{4}-\d+/i);
      const cves     = cveMatch ? [cveMatch[0].toUpperCase()] : [];

      // Extract GHSA id from GitHub advisory URL if present
      const ghsaMatch = (advisory.url || '').match(/(GHSA-[a-z0-9-]+)/i);
      const ghsaId    = ghsaMatch ? ghsaMatch[1] : null;

      // Preference order: CVE → GHSA id → numeric advisory id
      const findingId = cves[0]
        ? cves[0]
        : ghsaId
          ? ghsaId
          : advisoryId;

      const fixVersion = typeof vulnInfo.fixAvailable === 'object' && vulnInfo.fixAvailable
        ? `${vulnInfo.fixAvailable.name}@${vulnInfo.fixAvailable.version}`
        : (vulnInfo.fixAvailable ? 'Fix available' : 'No fix available');

      findings.push({
        id:          String(findingId),
        title:       `${packageName}: ${advisory.title || 'Security Advisory'}`,
        description: advisory.title || '',
        severity:    mapSeverity(advisory.severity || vulnInfo.severity),
        location:    'package.json',
        metadata: {
          package:          packageName,
          affectedVersions: advisory.range || vulnInfo.range || null,
          fixedIn:          fixVersion,
          cves,
          advisoryId,
          advisoryUrl:      advisory.url || null,
          isDirect:         vulnInfo.isDirect || false,
          isTransitive:     false,
          engine:           'npm-audit-v2',
        },
      });
    }
  }

  // v2 metadata carries authoritative severity counts
  const meta = (auditJson.metadata || {}).vulnerabilities || {};
  const vulnerabilitiesBySeverity = {
    critical: meta.critical || 0,
    high:     meta.high     || 0,
    medium:   meta.moderate || 0,
    low:      (meta.low     || 0) + (meta.info || 0),
  };

  return { findings, vulnerabilitiesBySeverity, vulnerableDependencies: vulnerablePackages.size };
}

// ─── Empty Result ─────────────────────────────────────────────────────────────

function emptyResult(depNames, note) {
  return {
    totalDependencies:        depNames.length,
    vulnerableDependencies:   0,
    vulnerabilitiesBySeverity: { critical: 0, high: 0, medium: 0, low: 0 },
    findings:                 [],
    dependenciesScanned:      depNames,
    scannerMeta: {
      engine:     'npm-audit',
      advisoryDb: 'npmjs.org',
      note,
    },
  };
}

// ─── Main Entry Point ─────────────────────────────────────────────────────────

/**
 * Scans a module's dependencies for known CVE vulnerabilities using npm audit.
 *
 * Called by executePipeline() in securityPipeline.js via runScannerSafely().
 *
 * @param {Object}   scanTarget
 * @param {string}   [scanTarget.filePath]        - Absolute path to uploaded file / archive.
 * @param {string[]} [scanTarget.dependenciesList] - Pre-parsed package names (GitHub imports).
 * @param {string}   [scanTarget.moduleId]         - For logging only.
 *
 * @returns {Promise<Object>} dependencyScan — matches dependencyScanSchema sub-document.
 */
async function runDependencyScan(scanTarget) {
  const { filePath, dependenciesList = [], moduleId } = scanTarget;
  const startMs = Date.now();

  // ── Guard: nothing to scan ────────────────────────────────────────────────
  if (!filePath && dependenciesList.length === 0) {
    const reason = 'No filePath or dependencies provided. Component has no declared dependencies.';
    console.log(`[DependencyScanner] Scan skipped: ${reason}`);
    return emptyResult([], reason);
  }

  // ── Step 1: Resolve scan directory ───────────────────────────────────────
  // If we only have a dependenciesList (GitHub import, no uploaded file),
  // we cannot run npm audit — return a partial result with the list stored.
  if (!filePath) {
    console.log(
      `[DependencyScanner] No uploaded file. Storing pre-parsed dependency list ` +
      `(${dependenciesList.length} packages) without CVE scan.`,
    );
    return emptyResult(
      dependenciesList,
      'No uploaded artifact. Dependency list stored but CVE scan requires a ' +
      'package.json file. Upload a module archive for full vulnerability scanning.',
    );
  }

  // ── Step 2: Extract archive to temp dir ──────────────────────────────────
  // extractForScan handles .zip → temp dir, and passes non-archive paths through.
  let extraction = null;

  try {
    extraction = extractForScan(filePath);
    const scanDir = extraction.extractedPath;

    console.log(
      `[DependencyScanner] Scan directory: ${path.basename(scanDir)} ` +
      `(moduleId: ${moduleId || 'n/a'})`,
    );

    // ── Step 3: Find package.json ─────────────────────────────────────────
    const pkgJsonPath = findPackageJson(scanDir);

    if (!pkgJsonPath) {
      console.log('[DependencyScanner] No package.json found in artifact. Scan skipped.');
      // Fall back to the pre-parsed list stored on the module document
      return emptyResult(
        dependenciesList,
        'No package.json found in the uploaded artifact. ' +
        'Ensure the archive contains a valid Node.js project with package.json.',
      );
    }

    const workDir = path.dirname(pkgJsonPath);
    console.log(`[DependencyScanner] Found package.json at: ${path.relative(scanDir, pkgJsonPath)}`);

    // ── Step 4: Parse package.json dependencies ───────────────────────────
    let parsedDeps;
    try {
      parsedDeps = parsePackageDependencies(pkgJsonPath);
    } catch (parseErr) {
      console.error(`[DependencyScanner] ${parseErr.message}`);
      return emptyResult(dependenciesList, parseErr.message);
    }

    const { names: depNames, totalCount } = parsedDeps;
    console.log(`[DependencyScanner] Found ${totalCount} declared dependencies.`);

    if (totalCount === 0) {
      console.log('[DependencyScanner] package.json has no dependencies. Nothing to scan.');
      return emptyResult([], 'package.json has no declared dependencies.');
    }

    // ── Step 5: Ensure package-lock.json exists ───────────────────────────
    // npm audit requires a lock file to know exact installed versions.
    // If the uploaded ZIP doesn't include one, generate it now.
    const lockfilePath = path.join(workDir, 'package-lock.json');
    const shrinkwrapPath = path.join(workDir, 'npm-shrinkwrap.json');
    const hasLockFile = fs.existsSync(lockfilePath) || fs.existsSync(shrinkwrapPath);

    if (!hasLockFile) {
      console.log('[DependencyScanner] No lock file found. Generating one...');
      const lockResult = await generateLockFile(workDir);

      if (!lockResult.ok) {
        // Lock file generation failed — likely private registry or network issue.
        // Return the dependency list without CVE data rather than failing the scan.
        console.warn(`[DependencyScanner] Lock file generation failed: ${lockResult.error}`);
        return emptyResult(
          depNames,
          `Could not generate package-lock.json: ${lockResult.error} ` +
          'This usually means the package has private dependencies or is offline. ' +
          'Dependency list stored; CVE data unavailable.',
        );
      }
    } else {
      console.log('[DependencyScanner] Existing lock file found. Skipping npm install.');
    }

    // ── Step 6: Run npm audit ─────────────────────────────────────────────
    const { auditJson, error: auditErr } = await runNpmAudit(workDir);

    if (auditErr || !auditJson) {
      console.warn(`[DependencyScanner] npm audit error: ${auditErr}`);
      return emptyResult(
        depNames,
        `npm audit did not complete: ${auditErr || 'no output'} ` +
        'Dependency list stored; CVE data unavailable.',
      );
    }

    // ── Step 7: Parse audit output (v1 or v2) ────────────────────────────
    // Detect format by presence of auditReportVersion field.
    const isV2 = auditJson.auditReportVersion === 2;

    console.log(
      `[DependencyScanner] Parsing npm audit ${isV2 ? 'v2' : 'v1'} output...`,
    );

    const { findings, vulnerabilitiesBySeverity, vulnerableDependencies } = isV2
      ? parseAuditV2(auditJson, depNames)
      : parseAuditV1(auditJson, depNames);

    // ── Step 8: Collect all CVE ids from findings ─────────────────────────
    const allCves = [...new Set(
      findings.flatMap((f) => f.metadata?.cves || []),
    )].filter(Boolean);

    // ── Step 9: Get total dependency count from audit metadata ────────────
    // The audit's totalDependencies includes transitive deps, which is more
    // accurate than just the direct dep count from package.json.
    let totalDependencies = totalCount; // fallback: direct deps from package.json
    if (isV2) {
      const metaDeps = auditJson.metadata?.dependencies?.total;
      if (metaDeps && metaDeps > 0) totalDependencies = metaDeps;
    } else {
      const metaTotal = auditJson.metadata?.totalDependencies;
      if (metaTotal && metaTotal > 0) totalDependencies = metaTotal;
    }

    const totalVulns = Object.values(vulnerabilitiesBySeverity).reduce((a, b) => a + b, 0);
    const scanTimeMs = Date.now() - startMs;

    console.log(
      `[DependencyScanner] Complete — ` +
      `${totalDependencies} deps, ${totalVulns} vulnerabilities ` +
      `(${vulnerableDependencies} packages affected), ${scanTimeMs}ms`,
    );

    return {
      totalDependencies,
      vulnerableDependencies,
      vulnerabilitiesBySeverity,
      findings,
      // Store all direct dep names for the history view
      dependenciesScanned: depNames,
      scannerMeta: {
        engine:         'npm-audit',
        auditVersion:   isV2 ? 'v2' : 'v1',
        advisoryDb:     'npmjs.org',
        scanTimeMs,
        totalVulns,
        cves:           allCves,
        note:           null,
      },
    };
  } finally {
    // ── Always clean up the extracted temp directory ───────────────────────
    if (extraction) extraction.cleanup();
  }
}

module.exports = { runDependencyScan };
