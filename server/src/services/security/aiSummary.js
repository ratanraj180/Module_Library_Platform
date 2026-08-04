/**
 * @file aiSummary.js
 * @description AI-powered natural-language summary and recommendation generator.
 *
 * Responsibility:
 *   Summarizes the metadata and scan metrics from the Malware Scan, Static Analysis,
 *   Dependency Scan, and Secret Detection.
 *
 *   CRITICAL SECURITY REQUIREMENTS:
 *     1. DO NOT let the AI scan raw source code. Only pass scan metadata/findings summaries.
 *     2. The AI must ONLY summarize the output metrics of the 4 security scanners.
 *     3. Limits the summary to a maximum of 300 words.
 *     4. Supports Google Gemini API (gemini-1.5-flash) with a deterministic,
 *        high-quality, rule-based fallback if no API key is configured.
 *     5. Keep approval decisions under Maintainer/Admin control (scans do not
 *        automatically approve or reject modules; review Controller remains the gate).
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Normalizes findings into a concise structural text summary for prompt input.
 * Keeps source code out of the input.
 */
function summarizeFindingsForPrompt(findings) {
  if (!findings || findings.length === 0) return 'None';
  return findings
    .slice(0, 8)
    .map((f) => `- [${(f.severity || 'low').toUpperCase()}] ${f.title || 'Finding'} (Location: ${f.location || 'unknown'})`)
    .join('\n');
}

/**
 * Builds a prompt for the AI summary engine.
 *
 * @param {Object} context
 * @returns {string}
 */
function buildPrompt(context) {
  const malwareSummary = context.malwareResult?.detected
    ? `Malware signatures detected: ${context.malwareResult.signatures?.join(', ') || 'Unknown'}`
    : 'No malware detected';

  const secretTypes = context.secretScan?.secretTypes || [];
  const secretSummary = context.secretScan?.secretsFound
    ? `Exposed secrets detected! Types: ${secretTypes.join(', ')}. Count: ${context.secretScan.totalSecrets}`
    : 'No exposed secrets found';

  const depCounts = context.dependencyScan?.vulnerabilitiesBySeverity || { critical: 0, high: 0, medium: 0, low: 0 };
  const depSummary = `Vulnerabilities: Critical=${depCounts.critical}, High=${depCounts.high}, Medium=${depCounts.medium}, Low=${depCounts.low}. Unique affected packages=${context.dependencyScan?.vulnerableDependencies || 0}`;

  const staticCounts = context.staticAnalysis?.issuesBySeverity || { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
  const staticSummary = `Dangerous code patterns: Critical=${staticCounts.critical}, High=${staticCounts.high}, Medium=${staticCounts.medium}, Low=${staticCounts.low}, Info=${staticCounts.info}`;

  return `
You are a senior Application Security Assistant. You are reviewing security metadata for the software module: "${context.moduleName}".
Your task is to generate a security review summary of this module.

CRITICAL:
1. Do not scan or look at the source code (it is not provided to you).
2. ONLY summarize the outputs of the scanners provided below.
3. Keep the total output for all fields under 300 words.
4. Output your response as a valid JSON object with exactly two keys:
   - "aiSummary": should describe the general security posture, overall risk level, and a concise summary.
   - "recommendation": should list the major findings and prioritized actionable recommendations.

SCAN SUMMARY DATA:
- Risk Score: ${context.riskScore}/100
- Risk Level: ${context.riskLevel.toUpperCase()}
- Malware Scan: ${malwareSummary}
- Secret Detection: ${secretSummary}
- Dependency Scan: ${depSummary}
- Static Code Analysis: ${staticSummary}

TOP DETECTED FINDINGS:
${summarizeFindingsForPrompt([...(context.staticAnalysis?.findings || []), ...(context.dependencyScan?.findings || []), ...(context.secretScan?.findings || [])])}

RESPONSE FORMAT:
Your response must be a single JSON object matching this structure:
{
  "aiSummary": "Posture review summary text...",
  "recommendation": "Major findings and prioritized recommendations..."
}
`;
}

/**
 * Deterministic fallback generator if no Gemini API Key is set.
 * Returns professional-grade summaries matching the requirements.
 */
function getLocalFallback(context) {
  const findings = [];
  if (context.malwareResult?.detected) findings.push('Malware detected');
  if (context.secretScan?.secretsFound) findings.push('Leaked credentials/secrets');
  if (context.dependencyScan?.vulnerableDependencies > 0) {
    findings.push(`${context.dependencyScan.vulnerableDependencies} vulnerable packages`);
  }
  const staticCounts = context.staticAnalysis?.issuesBySeverity || {};
  const dangerousPatternsCount = (staticCounts.critical || 0) + (staticCounts.high || 0) + (staticCounts.medium || 0);
  if (dangerousPatternsCount > 0) {
    findings.push(`${dangerousPatternsCount} dangerous code patterns`);
  }

  const summaryFindings = findings.length > 0 ? findings.join(', ') : 'No threats identified';

  // 1. aiSummary (Executive summary & Overall Risk)
  const aiSummary = `Security review completed for "${context.moduleName}". Computed overall risk is ${context.riskLevel.toUpperCase()} (score: ${context.riskScore}/100). Primary signals evaluated: ${summaryFindings}. The module requires evaluation prior to use.`;

  // 2. recommendation (Major findings & Recommendations)
  let recommendation = 'No critical remediation items. Continue standard module review.';
  if (context.riskLevel === 'critical' || context.riskLevel === 'high') {
    recommendation = `MAJOR FINDINGS:\n- Found critical indicators: ${findings.join('; ')}.\n\nRECOMMENDATIONS:\n1. Quarantined for immediate review. Do not publish to production.\n2. Purge and cycle any exposed keys/credentials.\n3. Resolve high/critical dependencies and dangerous syntax patterns immediately.`;
  } else if (context.riskLevel === 'medium') {
    recommendation = `MAJOR FINDINGS:\n- Minor issues detected: ${findings.join('; ')}.\n\nRECOMMENDATIONS:\n1. Update transitive dependencies with security fixes.\n2. Fix code patterns flagging quality or path traversal indicators.`;
  }

  return { aiSummary, recommendation };
}

/**
 * Generates an AI-powered summary and recommendation block.
 *
 * @param {Object} context
 * @returns {Promise<{ aiSummary: string, recommendation: string }>}
 */
async function generateAiSummary(context) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.log('[AiSummary] No GEMINI_API_KEY environment variable found. Using local rule-based fallback generator.');
    return getLocalFallback(context);
  }

  try {
    const prompt = buildPrompt(context);
    const genAI = new GoogleGenerativeAI(apiKey);
    // Use gemini-1.5-flash as the fast, efficient utility model
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });

    const result = await model.generateContent(prompt);
    const textResponse = result.response.text();
    const parsed = JSON.parse(textResponse);

    if (parsed.aiSummary && parsed.recommendation) {
      // Validate length constraint
      const totalWords = (parsed.aiSummary.split(/\s+/).length) + (parsed.recommendation.split(/\s+/).length);
      if (totalWords > 300) {
        console.warn(`[AiSummary] AI output exceeded 300 words (${totalWords} words). Truncating to maintain bounds.`);
        parsed.aiSummary = parsed.aiSummary.slice(0, 800) + '...';
        parsed.recommendation = parsed.recommendation.slice(0, 1000) + '...';
      }
      return {
        aiSummary: parsed.aiSummary,
        recommendation: parsed.recommendation,
      };
    }
  } catch (err) {
    console.error(`[AiSummary] Exception in Google Gemini API generation: ${err.message}. Falling back.`);
  }

  return getLocalFallback(context);
}

module.exports = {
  generateAiSummary,
  buildPrompt,
};
