/**
 * @file customPatternScanner.js
 * @description Pure-Node.js regex-based static analysis scanner.
 *
 * WHY THIS EXISTS:
 *   Semgrep requires a Python installation and the semgrep binary. In
 *   environments where that is not available (most dev machines, CI agents
 *   that haven't installed Semgrep), the staticAnalyzer falls back to this
 *   file. No external tools, no native binaries — just Node.js fs + regex.
 *
 * SCANNING STRATEGY:
 *   1. Walk the target directory (or single file) collecting all JS/TS source files.
 *      node_modules, dist, and other noise directories are automatically skipped.
 *   2. Read each file line by line.
 *   3. For each non-comment line, run every pattern against it.
 *   4. First pattern match on a line wins (no duplicate findings per line per pattern).
 *   5. Return findings with relative file path + 1-indexed line number.
 *
 * PATTERNS IMPLEMENTED (one per vulnerability category requested):
 *   ① eval()                — code injection
 *   ② new Function()        — code injection
 *   ③ exec()                — command injection
 *   ④ execSync()            — command injection (synchronous)
 *   ⑤ spawn()               — command injection
 *   ⑥ SQL injection (concat)— DB query with string +
 *   ⑦ SQL injection (tmpl)  — DB query with template literal ${}
 *   ⑧ Path traversal        — req.params/query/body → fs/path ops
 *   ⑨ Unsafe regex          — new RegExp(variable)
 *   ⑩ Unsafe file ops       — fs.writeFile/unlink/rmdir
 *
 * FINDING SHAPE (matches findingSchema in SecurityReport.js):
 *   {
 *     id:          string,  — rule id matching Semgrep convention ("ml-...")
 *     title:       string,
 *     description: string,
 *     severity:    "critical"|"high"|"medium"|"low"|"info",
 *     location:    string,  — "relative/path.js:42"
 *     metadata: {
 *       line:    number,
 *       column:  number,
 *       code:    string,   — the matching line (trimmed, max 300 chars)
 *       ruleId:  string,
 *       engine:  "custom-pattern",
 *     }
 *   }
 */

const fs   = require('fs');
const path = require('path');

// ─── Source file extensions to include ───────────────────────────────────────
const SOURCE_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs']);

// ─── Directories to skip during recursive walk ────────────────────────────────
const SKIP_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', '.cache',
  'coverage', '.nyc_output', '.turbo', '.next', 'out',
]);

// ─── Pattern Definitions ──────────────────────────────────────────────────────
// Each pattern maps 1-to-1 with a Semgrep rule id so findings are comparable
// between both engines. Severity levels match those in SEVERITY_MAP of semgrepRunner.js.
const PATTERNS = [
  // ① eval() — code injection
  {
    id:          'ml-eval-usage',
    title:       'Use of eval()',
    regex:       /\beval\s*\(/,
    severity:    'high',
    description: (
      'eval() executes arbitrary strings as code, enabling code injection. ' +
      'Replace with JSON.parse() for data or restructure to avoid dynamic execution.'
    ),
  },

  // ② new Function() — code injection
  {
    id:          'ml-function-constructor',
    title:       'Use of Function() constructor',
    regex:       /\bnew\s+Function\s*\(/,
    severity:    'high',
    description: (
      'The Function() constructor is functionally identical to eval() — it compiles ' +
      'an arbitrary string into executable code. Replace with a named function.'
    ),
  },

  // ③ child_process.exec()
  {
    id:          'ml-exec-injection',
    title:       'child_process exec() usage',
    regex:       /\bexec\s*\(/,
    severity:    'high',
    description: (
      'exec() passes its argument to the OS shell. With user-controlled input this ' +
      'enables command injection. Use execFile() with a fixed command + arg array.'
    ),
  },

  // ④ execSync()
  {
    id:          'ml-execsync-injection',
    title:       'execSync() usage',
    regex:       /\bexecSync\s*\(/,
    severity:    'high',
    description: (
      'execSync() has the same command-injection risk as exec() and additionally ' +
      'blocks the Node.js event loop until the command completes.'
    ),
  },

  // ⑤ spawn()
  {
    id:          'ml-spawn-injection',
    title:       'spawn() usage',
    regex:       /\bspawn\s*\(/,
    severity:    'medium',
    description: (
      'spawn() executes a command. Safer than exec() when arguments are in an array, ' +
      'but verify no argument originates from user-controlled input.'
    ),
  },

  // ⑥ SQL injection — string concatenation in query calls
  {
    id:          'ml-sql-concat',
    title:       'SQL Injection (string concatenation)',
    // Matches: db.query('...' + x) or db.execute(`...` + x)
    // The key signal is: .query/.execute/.raw followed by an opening paren,
    // a string literal (any quote style), and then a + concatenation operator.
    regex:       /\.(query|execute|raw)\s*\(\s*['"`].*\+/,
    severity:    'critical',
    description: (
      'Database query built with string concatenation. User-supplied data in the ' +
      'concatenated string can break out and execute arbitrary SQL. Use parameterized queries.'
    ),
  },

  // ⑦ SQL injection — template literal with interpolation in query calls
  {
    id:          'ml-sql-template',
    title:       'SQL Injection (template literal)',
    // Matches: .query(`...${...}`) / .execute(`${req.body...}`)
    regex:       /\.(query|execute|raw)\s*\(`[^`]*\$\{/,
    severity:    'critical',
    description: (
      'Database query uses a template literal with ${...} interpolation. ' +
      'Interpolated user data enables SQL injection. Use parameterized queries.'
    ),
  },

  // ⑧ Path traversal — req.params/query/body used in file system operations
  {
    id:          'ml-path-traversal',
    title:       'Path Traversal Risk',
    // Two signals that commonly appear on the same or adjacent lines:
    // (a) req.params/query/body  anywhere in the line AND
    // (b) fs. or path.join/resolve anywhere in the line
    // Using two separate regex checks joined with AND in scanFile.
    regex:       /\b(fs\.(readFile|writeFile|createReadStream|createWriteStream|existsSync|stat|unlink|open)|path\.(join|resolve))\b.*req\.(params|query|body)|req\.(params|query|body).*\b(fs\.|path\.(join|resolve))/,
    severity:    'high',
    description: (
      'User request data (req.params/query/body) is used in a file system operation. ' +
      "An attacker can supply '../../../etc/passwd' to escape the intended directory. " +
      'Validate and normalize paths; confirm they stay within an allowed base directory.'
    ),
  },

  // ⑨ Unsafe dynamic RegExp
  {
    id:          'ml-unsafe-regex',
    title:       'Unsafe Dynamic RegExp',
    // Matches new RegExp(...) where the first char after '(' is NOT a string literal
    regex:       /\bnew\s+RegExp\s*\(\s*(?!['"` ])/,
    severity:    'medium',
    description: (
      'new RegExp() with a non-literal argument. If the argument contains user input, ' +
      'a crafted pattern can cause catastrophic backtracking (ReDoS). ' +
      'Escape user input with a library like escape-string-regexp before passing to RegExp.'
    ),
  },

  // ⑩ Unsafe file write / destructive file operations
  {
    id:          'ml-unsafe-file-write',
    title:       'Unsafe File Operation',
    regex:       /\bfs\.(writeFile|appendFile|unlink|rmdir|rmdirSync|unlinkSync|writeFileSync|appendFileSync|open)\s*\(/,
    severity:    'low',
    description: (
      'File system write or destructive operation detected. ' +
      'Ensure the path argument is not user-controlled; validate with path.normalize() ' +
      'and confirm the resolved path is inside the expected directory.'
    ),
  },
];

// ─── Directory Walk ───────────────────────────────────────────────────────────

/**
 * Recursively collects all JS/TS source files from a directory.
 * Skips directories in SKIP_DIRS and limits recursion depth to 15.
 *
 * @param {string}   dirPath - Absolute path to start from.
 * @param {string[]} [acc]   - Accumulator (internal use).
 * @param {number}   [depth] - Current recursion depth (internal use).
 * @returns {string[]} Absolute paths to all source files found.
 */
function collectSourceFiles(dirPath, acc = [], depth = 0) {
  if (depth > 15) return acc;

  let entries;
  try {
    entries = fs.readdirSync(dirPath, { withFileTypes: true });
  } catch {
    return acc; // Unreadable directory — skip silently
  }

  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) {
        collectSourceFiles(path.join(dirPath, entry.name), acc, depth + 1);
      }
    } else if (entry.isFile()) {
      if (SOURCE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
        acc.push(path.join(dirPath, entry.name));
      }
    }
  }

  return acc;
}

// ─── Line Counter ─────────────────────────────────────────────────────────────

/**
 * Counts the total number of lines across a list of source files.
 * Used to populate `linesAnalyzed` in the staticAnalysis result.
 *
 * @param {string[]} files
 * @returns {number}
 */
function countTotalLines(files) {
  let total = 0;
  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      total += content.split('\n').length;
    } catch { /* skip files we can't read */ }
  }
  return total;
}

// ─── Single-File Scanner ──────────────────────────────────────────────────────

/**
 * Scans a single file line by line against all patterns.
 *
 * Comment-only lines (// ... and * ...) are skipped to reduce noise.
 * One finding is produced per pattern per line — if a line matches multiple
 * patterns only the first match is recorded to avoid duplicate noise.
 *
 * @param {string} filePath  - Absolute path to the file to scan.
 * @param {string} basePath  - Root directory; used to compute the relative path for display.
 * @returns {Object[]} Array of finding objects matching findingSchema.
 */
function scanFile(filePath, basePath) {
  let content;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch {
    return []; // Unreadable file — skip
  }

  const lines       = content.split('\n');
  const findings    = [];
  // Display path relative to the scan root, e.g. "src/utils/helper.js"
  const displayPath = path.relative(basePath, filePath);

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const rawLine  = lines[lineIdx];
    const lineNum  = lineIdx + 1;

    // ── Skip comment-only lines ────────────────────────────────────────────
    // This reduces false positives from documented examples in comments.
    const trimmed = rawLine.trimStart();
    if (
      trimmed.startsWith('//') ||
      trimmed.startsWith('*')  ||
      trimmed.startsWith('/*') ||
      trimmed.startsWith('#')
    ) continue;

    // ── Test each pattern against this line ────────────────────────────────
    // We stop after the first matching pattern per line to avoid flooding
    // a single line with multiple overlapping findings.
    for (const pattern of PATTERNS) {
      const match = pattern.regex.exec(rawLine);
      if (!match) continue;

      findings.push({
        id:          pattern.id,
        title:       pattern.title,
        description: pattern.description,
        severity:    pattern.severity,
        // "path/to/file.js:42" — file name + line number as requested
        location:   `${displayPath}:${lineNum}`,
        metadata: {
          line:    lineNum,
          column:  match.index + 1, // 1-indexed column of the match
          endLine: lineNum,
          // Store the matched line (trimmed + capped) for the report UI
          code:    rawLine.trim().slice(0, 300),
          ruleId:  pattern.id,
          engine:  'custom-pattern',
        },
      });

      // Move to next line after first match
      break;
    }
  }

  return findings;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Runs the custom pattern scanner against a file or directory.
 *
 * @param {string} targetPath - Absolute path to file or directory.
 * @returns {{
 *   findings:      Object[],
 *   linesAnalyzed: number,
 *   filesScanned:  number,
 * }}
 */
function runCustomPatternScan(targetPath) {
  let sourceFiles;
  let basePath;

  const stat = fs.statSync(targetPath);

  if (stat.isDirectory()) {
    sourceFiles = collectSourceFiles(targetPath);
    basePath    = targetPath;
  } else {
    // Single file — treat its directory as the base so the relative path is just the filename
    sourceFiles = SOURCE_EXTENSIONS.has(path.extname(targetPath).toLowerCase())
      ? [targetPath]
      : [];
    basePath    = path.dirname(targetPath);
  }

  const findings = [];
  for (const file of sourceFiles) {
    findings.push(...scanFile(file, basePath));
  }

  const linesAnalyzed = countTotalLines(sourceFiles);

  console.log(
    `[CustomPatternScanner] Scanned ${sourceFiles.length} file(s), ` +
    `${linesAnalyzed} line(s), ${findings.length} finding(s).`,
  );

  return {
    findings,
    linesAnalyzed,
    filesScanned: sourceFiles.length,
  };
}

/**
 * Only counts lines — used when Semgrep is the primary engine but we still
 * need a `linesAnalyzed` number to populate the schema field.
 *
 * @param {string} targetPath
 * @returns {number}
 */
function countSourceLines(targetPath) {
  try {
    const stat = fs.statSync(targetPath);
    const files = stat.isDirectory()
      ? collectSourceFiles(targetPath)
      : [targetPath];
    return countTotalLines(files);
  } catch {
    return 0;
  }
}

module.exports = { runCustomPatternScan, countSourceLines };
