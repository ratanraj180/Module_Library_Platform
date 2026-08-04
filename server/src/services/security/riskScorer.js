/**
 * @file riskScorer.js
 * @description Risk score computation engine for security scan results.
 *
 * Responsibility:
 *   Computes a security score out of 100, where 100 represents a clean/safe status,
 *   and applies deductions based on identified security threats:
 *
 *   Scoring Deductions:
 *     - Starting Score: 100
 *     - Malware Detected:           -40 points
 *     - Critical Dependency:        -20 points
 *     - High Dependency:            -10 points
 *     - Medium Dependency:          -5 points
 *     - Secret Found:               -15 points
 *     - Dangerous Code (Static):    -10 points
 *
 *   Final score is clamped to the range [0, 100].
 *
 *   Risk Level Mapping:
 *     - Score = 100:                 'safe'
 *     - Score between [80, 99]:      'medium'
 *     - Score between [50, 79]:      'high'
 *     - Score < 50:                  'critical'
 */

/**
 * Derives the categorical risk level from the calculated numeric score.
 *
 * @param {number} score - A value in [0, 100].
 * @returns {"safe"|"medium"|"high"|"critical"}
 */
function scoreToLevel(score) {
  if (score >= 100) return 'safe';
  if (score >= 80) return 'medium';
  if (score >= 50) return 'high';
  return 'critical';
}

/**
 * Computes the aggregate security score from all scanner outputs.
 *
 * @param {Object} results - Scanner outputs collected by the pipeline.
 * @param {Object} [results.malwareResult]   - Output from malwareScanner.js
 * @param {Object} [results.staticAnalysis]  - Output from staticAnalyzer.js
 * @param {Object} [results.dependencyScan]  - Output from dependencyScanner.js
 * @param {Object} [results.secretScan]      - Output from secretScanner.js
 *
 * @returns {{ riskScore: number, riskLevel: string }} - Computed risk assessment.
 */
function computeRiskScore({ malwareResult, staticAnalysis, dependencyScan, secretScan }) {
  let score = 100;

  // 1. Malware Detected: -40 points
  if (malwareResult && malwareResult.detected) {
    score -= 40;
  }

  // 2. Dependency Vulnerabilities:
  // - Critical: -20 points (if at least one critical vulnerability exists)
  // - High:     -10 points (if at least one high vulnerability exists)
  // - Medium:   -5 points  (if at least one medium vulnerability exists)
  if (dependencyScan && dependencyScan.vulnerabilitiesBySeverity) {
    const dep = dependencyScan.vulnerabilitiesBySeverity;
    if (dep.critical > 0) {
      score -= 20;
    }
    if (dep.high > 0) {
      score -= 10;
    }
    if (dep.medium > 0) {
      score -= 5;
    }
  }

  // 3. Secret Found: -15 points (if at least one leaked secret key is detected)
  if (secretScan && secretScan.secretsFound) {
    score -= 15;
  }

  // 4. Dangerous Code (Static Analysis): -10 points (if any high/critical/medium issue is detected)
  if (staticAnalysis && staticAnalysis.findings && staticAnalysis.findings.length > 0) {
    const hasDangerousCode = staticAnalysis.findings.some(
      (f) => ['critical', 'high', 'medium'].includes(f.severity),
    );
    if (hasDangerousCode) {
      score -= 10;
    }
  }

  // Clamp final score to [0, 100]
  const riskScore = Math.max(0, Math.min(Math.round(score), 100));
  const riskLevel = scoreToLevel(riskScore);

  return {
    riskScore,
    riskLevel,
  };
}

module.exports = {
  computeRiskScore,
  scoreToLevel,
};
