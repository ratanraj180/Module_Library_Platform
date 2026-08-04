/**
 * @file customSecretScanner.js
 * @description Built-in regex-based secret scanner fallback.
 */

const fs = require('fs');
const path = require('path');
const { maskSecret } = require('./gitleaksRunner');

const SOURCE_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.json', '.env', '.yml', '.yaml', '.conf']);
const SKIP_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', '.cache',
  'coverage', '.nyc_output', '.turbo', '.next', 'out',
]);

const SECRET_RULES = [
  {
    id: 'github-token',
    title: 'GitHub Access Token',
    regex: /\b(gh[pousr]_[A-Za-z0-9_]{36,255})\b/,
    description: 'GitHub personal access token, OAuth token, or runner token detected.',
  },
  {
    id: 'aws-access-key-id',
    title: 'AWS Access Key ID',
    regex: /\b((?:AKIA|ASCA|AOIS|ACCA)[0-9A-Z]{16})\b/,
    description: 'AWS access key identifier identified.',
  },
  {
    id: 'aws-secret-access-key',
    title: 'AWS Secret Access Key',
    // Looks for assignment of 40-character base64/hex secret associated with AWS secret key indicator
    regex: /(?:aws|amazon|secret|access).{0,15}['"]([A-Za-z0-9+/]{40})['"]/i,
    description: 'AWS secret access key identified.',
  },
  {
    id: 'jwt-secret',
    title: 'JSON Web Token Secret',
    // Allow any character except quotes for JWT secrets
    regex: /(?:jwt|jsonwebtoken|jwt_secret|token_secret).{0,15}['"]([^'\"\r\n]{16,})['"]/i,
    description: 'JSON Web Token (JWT) signature secret key detected.',
  },
  {
    id: 'database-password',
    title: 'Database connection password',
    // Matches database URI with password: mongodb://user:pass@host
    // Or key assignments like: db_password = "foo"
    regex: /(?:\b(?:mongodb(?:\+srv)?|postgres|mysql|sqlite|mariadb|redis):\/\/[a-zA-Z0-9_.-]+:([^@\s:]+)@[a-zA-Z0-9_.-]+)|(?:db_pass|db_password|database_password|mysql_password|postgres_password).{0,15}['"]([^'\"]{4,})['"]/i,
    description: 'Potential database connection password or URI credential exposed.',
  },
  {
    id: 'private-key',
    title: 'Asymmetric Private Key',
    regex: /-----BEGIN [A-Z ]+ PRIVATE KEY-----/,
    description: 'PEM, RSA, DSA, EC or generic asymmetric cryptographic private key file/block detected.',
  },
  {
    id: 'stripe-api-key',
    title: 'Stripe API Key',
    regex: /\b((?:sk|rk)_live_[0-9a-zA-Z]{24,32})\b/,
    description: 'Stripe live API key or restricted key detected.',
  },
  {
    id: 'generic-api-key',
    title: 'Generic API Key / Secret',
    regex: /(?:api_key|apikey|client_secret|clientsecret|stripe_key|stripe_secret|secret_key).{0,15}['"]([a-zA-Z0-9_\-]{16,})['"]/i,
    description: 'General application token or provider API key identified.',
  },
];

function collectSourceFiles(dirPath, acc = [], depth = 0) {
  if (depth > 15) return acc;

  let entries;
  try {
    entries = fs.readdirSync(dirPath, { withFileTypes: true });
  } catch {
    return acc;
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

function scanFileForSecrets(filePath, basePath) {
  let content;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch {
    return [];
  }

  const lines = content.split('\n');
  const findings = [];
  const displayPath = path.relative(basePath, filePath);

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const rawLine = lines[lineIdx];
    const lineNum = lineIdx + 1;

    for (const rule of SECRET_RULES) {
      const match = rule.regex.exec(rawLine);
      if (!match) continue;

      // Extract the actual matched secret (usually captured group 1 or 2, fallback to whole match)
      const secretVal = match[1] || match[2] || match[0];
      const masked = maskSecret(secretVal, rule.id);

      findings.push({
        id: rule.id,
        title: `Leaked ${rule.title}`,
        description: rule.description,
        severity: 'critical', // Secret leaks are always critical
        location: `${displayPath}:${lineNum}`,
        metadata: {
          line: lineNum,
          column: match.index + 1,
          secretType: rule.id,
          maskedValue: masked,
          engine: 'custom-secret-patterns',
        },
      });

      // Break on first match per line to avoid duplicate findings for same line
      break;
    }
  }

  return findings;
}

function runCustomSecretScan(targetPath) {
  let sourceFiles;
  let basePath;

  const stat = fs.statSync(targetPath);
  if (stat.isDirectory()) {
    sourceFiles = collectSourceFiles(targetPath);
    basePath = targetPath;
  } else {
    sourceFiles = [targetPath];
    basePath = path.dirname(targetPath);
  }

  const findings = [];
  for (const file of sourceFiles) {
    findings.push(...scanFileForSecrets(file, basePath));
  }

  console.log(`[CustomSecretScanner] Scanned ${sourceFiles.length} file(s), found ${findings.length} secret(s).`);

  return {
    findings,
    filesScanned: sourceFiles.length,
  };
}

module.exports = {
  runCustomSecretScan,
};
