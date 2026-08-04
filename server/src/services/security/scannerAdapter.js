/**
 * @file scannerAdapter.js
 * @description Malware scanner abstraction layer.
 *
 * This file defines:
 *   1. MalwareScannerAdapter — abstract interface every scanner must implement.
 *   2. ClamAVScanner         — production implementation using the `clamscan` package.
 *   3. NoOpScanner           — safe fallback when ClamAV is unavailable.
 *   4. getActiveScanner()    — factory/singleton that resolves to the best available scanner.
 *
 * ─── Swapping Scanners ────────────────────────────────────────────────────────
 * To add a new scanner (e.g. VirusTotal, custom engine):
 *   1. Create a class that extends MalwareScannerAdapter.
 *   2. Implement `isAvailable()` and `scanPath(targetPath)`.
 *   3. Register it in the priority chain inside `getActiveScanner()`.
 *   4. The rest of the codebase needs zero changes.
 *
 * ─── ClamAV Configuration (.env) ─────────────────────────────────────────────
 *   CLAMAV_ENABLED=true           — Set to false to force NoOpScanner in dev
 *   CLAMAV_HOST=127.0.0.1         — clamd daemon host (default: localhost)
 *   CLAMAV_PORT=3310              — clamd daemon TCP port (default: 3310)
 *   CLAMAV_SOCKET=               — UNIX socket path (overrides host+port if set)
 *   CLAMAV_TIMEOUT_MS=30000       — Max ms to wait for a scan result
 *
 * ─── scanPath() Return Shape ─────────────────────────────────────────────────
 *   {
 *     passed:     boolean,   — true = clean, false = threat found
 *     threatName: string|null,
 *     allThreats: string[],  — full list of matched signatures
 *     scanTimeMs: number,    — wall-clock ms taken for this scan
 *     engine:     string,    — human-readable engine name
 *     version:    string,    — engine version string
 *     note:       string|null — optional informational message
 *   }
 */

// ─── Abstract Interface ────────────────────────────────────────────────────────

class MalwareScannerAdapter {
  /** Human-readable name of this scanner implementation. @returns {string} */
  get name() {
    throw new Error(`${this.constructor.name} must implement get name()`);
  }

  /** Version string of the underlying engine. @returns {string} */
  get version() {
    throw new Error(`${this.constructor.name} must implement get version()`);
  }

  /**
   * Check whether this scanner is available on the current system.
   * @returns {Promise<boolean>}
   */
  async isAvailable() {
    throw new Error(`${this.constructor.name} must implement isAvailable()`);
  }

  /**
   * Scan a file or directory for malware.
   *
   * @param {string} targetPath - Absolute path to the file or extracted directory.
   * @returns {Promise<{
   *   passed: boolean,
   *   threatName: string|null,
   *   allThreats: string[],
   *   scanTimeMs: number,
   *   engine: string,
   *   version: string,
   *   note: string|null
   * }>}
   */
  async scanPath(_targetPath) {
    throw new Error(`${this.constructor.name} must implement scanPath()`);
  }
}

// ─── ClamAV Implementation ────────────────────────────────────────────────────

class ClamAVScanner extends MalwareScannerAdapter {
  constructor() {
    super();
    // Cached, initialized clamscan instance (initialized lazily on first use)
    this._clam = null;
  }

  get name() { return 'ClamAV'; }
  get version() { return 'clamdscan'; }

  /**
   * Lazily initializes the ClamAV client.
   * Reads configuration from environment variables.
   *
   * @returns {Promise<import('clamscan')>}
   * @throws {Error} If ClamAV daemon is unreachable or not configured.
   */
  async _init() {
    if (this._clam) return this._clam;

    const NodeClam = require('clamscan');

    const opts = {
      removeInfected: false,     // Never auto-delete — let the controller handle it
      quarantineInfected: false,
      scanLog: null,
      debugMode: false,

      // ── clamd socket / daemon options ─────────────────────────────────────
      clamdscan: {
        active:  true,
        timeout: parseInt(process.env.CLAMAV_TIMEOUT_MS || '30000', 10),
        localFallback: false,   // Do NOT fall back to clamscan binary silently
      },
    };

    // Socket path takes priority over host:port (Unix sockets are faster)
    const socket = process.env.CLAMAV_SOCKET || '';
    if (socket) {
      opts.clamdscan.socket = socket;
    } else {
      opts.clamdscan.host = process.env.CLAMAV_HOST || '127.0.0.1';
      opts.clamdscan.port = parseInt(process.env.CLAMAV_PORT || '3310', 10);
    }

    this._clam = await new NodeClam().init(opts);
    return this._clam;
  }

  async isAvailable() {
    // Respect the explicit opt-out env var so devs can disable ClamAV cleanly
    if (process.env.CLAMAV_ENABLED === 'false') return false;

    try {
      await this._init();
      return true;
    } catch {
      return false;
    }
  }

  async scanPath(targetPath) {
    const startMs = Date.now();
    const clam = await this._init();

    const fs = require("fs");
    const path = require("path");

    console.log("================================");
    console.log("Target Path:", targetPath);
    console.log("Is Directory:", fs.lstatSync(targetPath).isDirectory());
    console.log("================================");

    let isInfected = false;
    let viruses = [];

    const stats = fs.lstatSync(targetPath);
    if (stats.isDirectory()) {
      const allFiles = [];
      const getFilesRecursively = (dir) => {
        let entries;
        try {
          entries = fs.readdirSync(dir, { withFileTypes: true });
        } catch {
          return;
        }
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            getFilesRecursively(fullPath);
          } else if (entry.isFile()) {
            allFiles.push(fullPath);
          }
        }
      };
      getFilesRecursively(targetPath);

      for (const file of allFiles) {
        const fileResult = await clam.scanFile(file);
        if (fileResult.isInfected) {
          isInfected = true;
          if (Array.isArray(fileResult.viruses)) {
            viruses.push(...fileResult.viruses);
          }
        }
      }
    } else {
      const result = await clam.scanFile(targetPath);
      isInfected = result.isInfected;
      viruses = result.viruses;
    }

    const scanTimeMs = Date.now() - startMs;

    const detected = !!isInfected;
    const allThreats = Array.isArray(viruses) ? viruses.filter(Boolean) : [];
    const threatName = allThreats.length > 0 ? allThreats[0] : null;

    console.log(
      `[ClamAVScanner] ${detected ? '⚠ MALWARE' : '✓ Clean'} — ` +
      `${detected ? allThreats.join(', ') : 'no threats'} (${scanTimeMs}ms)`,
    );

    return {
      passed: !detected,
      threatName,
      allThreats,
      scanTimeMs,
      engine: this.name,
      version: this.version,
      note: null,
    };
  }
}

// ─── NoOp Fallback Scanner ────────────────────────────────────────────────────

/**
 * Safe passthrough scanner used when ClamAV is not installed or unreachable.
 *
 * IMPORTANT: The NoOpScanner always returns `passed: true`. It is intentionally
 * permissive so that development environments without ClamAV installed are not
 * blocked. It logs a prominent warning so operators know scanning is inactive.
 *
 * In production, always ensure ClamAV is running. Set CLAMAV_ENABLED=true.
 */
class NoOpScanner extends MalwareScannerAdapter {
  get name() { return 'NoOp'; }
  get version() { return '0.0.0'; }

  async isAvailable() { return true; }

  async scanPath(_targetPath) {
    console.warn(
      '\n⚠️  [MalwareScanner] WARNING: ClamAV is not available.\n' +
      '    Files are NOT being scanned for malware.\n' +
      '    Install ClamAV and ensure the clamd daemon is running.\n' +
      '    See: server/docs/CLAMAV_SETUP.md\n',
    );

    return {
      passed:     true,    // Permissive — do NOT block uploads without ClamAV
      threatName: null,
      allThreats: [],
      scanTimeMs: 0,
      engine:     'NoOp',
      version:    '0.0.0',
      note:       'ClamAV is not available. This file was not scanned. ' +
                  'Install ClamAV for real malware protection. See CLAMAV_SETUP.md.',
    };
  }
}

// ─── Singleton Factory ────────────────────────────────────────────────────────

/** Cached scanner instance — initialized once per process lifetime. */
let _activeScanner = null;

/**
 * Returns the best available malware scanner for the current environment.
 *
 * Resolution order:
 *   1. ClamAV (if CLAMAV_ENABLED !== 'false' and daemon is reachable)
 *   2. NoOpScanner (fallback — always available, logs a warning)
 *
 * The result is cached for the lifetime of the process so ClamAV is only
 * initialized once (the init handshake can take 100-500ms).
 *
 * @returns {Promise<MalwareScannerAdapter>}
 */
async function getActiveScanner() {
  if (_activeScanner) return _activeScanner;

  const candidates = [
    new ClamAVScanner(),
    // Add more scanners here in priority order (e.g. VirusTotalScanner)
  ];

  for (const scanner of candidates) {
    const available = await scanner.isAvailable();
    if (available) {
      _activeScanner = scanner;
      console.log(`[MalwareAdapter] Active scanner: ${scanner.name} (${scanner.version})`);
      return _activeScanner;
    }
  }

  // Last resort — NoOp
  _activeScanner = new NoOpScanner();
  console.warn('[MalwareAdapter] No real scanner available. Using NoOpScanner (files not scanned).');
  return _activeScanner;
}

/**
 * Resets the cached scanner singleton.
 * Useful in tests that need to control which scanner is active.
 */
function resetScanner() {
  _activeScanner = null;
}

module.exports = {
  MalwareScannerAdapter,
  ClamAVScanner,
  NoOpScanner,
  getActiveScanner,
  resetScanner,
};
