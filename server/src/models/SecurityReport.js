/**
 * @file SecurityReport.js
 * @description Mongoose model for storing security scan results.
 *
 * Each document represents a single security scan run against a module or component.
 * The model holds structured sub-documents for every scanner's output:
 *   - malwareResult     → output from the malware scanner
 *   - staticAnalysis    → output from the static code analyzer
 *   - dependencyScan    → output from the dependency vulnerability scanner
 *   - secretScan        → output from the secret / credential leak scanner
 *
 * A computed riskScore (0–100) and a derived riskLevel (low/medium/high/critical)
 * represent the overall security posture of the scanned artifact.
 *
 * The aiSummary and recommendation fields hold LLM-generated natural-language
 * descriptions that are populated after all scanners complete.
 *
 * Indexes:
 *   - moduleId + createdAt  → fast history queries per module
 *   - componentId + createdAt → fast history queries per component
 *   - scanStatus             → filter pending / running / completed / failed scans
 */

const mongoose = require('mongoose');

// ─── Sub-schema: Individual scanner finding ───────────────────────────────────
// Reused across multiple scanner result sub-documents.
const findingSchema = new mongoose.Schema(
  {
    // Short machine-readable identifier, e.g. "CVE-2023-1234" or "hardcoded-secret"
    id: { type: String },

    // Human-readable title of the finding
    title: { type: String },

    // Detailed description of what was found
    description: { type: String },

    // Severity level of this specific finding
    severity: {
      type: String,
      enum: ['info', 'low', 'medium', 'high', 'critical'],
      default: 'info',
    },

    // File path and line number where the issue was detected (optional)
    location: { type: String },

    // Any additional metadata the scanner wants to attach
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  { _id: false }, // No separate _id for sub-documents
);

// ─── Sub-schema: Malware Scanner Result ───────────────────────────────────────
const malwareResultSchema = new mongoose.Schema(
  {
    // Whether malware signatures were detected
    detected: { type: Boolean, default: false },

    // Confidence score returned by the scanner (0–1)
    confidence: { type: Number, min: 0, max: 1, default: 0 },

    // List of malware families / signatures matched
    signatures: [{ type: String }],

    // Array of individual findings from this scanner
    findings: [findingSchema],

    // Raw scanner output or engine version info (for auditability)
    scannerMeta: { type: mongoose.Schema.Types.Mixed },
  },
  { _id: false },
);

// ─── Sub-schema: Static Analysis Result ──────────────────────────────────────
const staticAnalysisSchema = new mongoose.Schema(
  {
    // Total number of issues found across all severity levels
    totalIssues: { type: Number, default: 0 },

    // Breakdown by severity bucket
    issuesBySeverity: {
      critical: { type: Number, default: 0 },
      high: { type: Number, default: 0 },
      medium: { type: Number, default: 0 },
      low: { type: Number, default: 0 },
      info: { type: Number, default: 0 },
    },

    // Individual findings from the static analysis engine
    findings: [findingSchema],

    // Lines of code analyzed (informational)
    linesAnalyzed: { type: Number, default: 0 },

    // Scanner engine name + version
    scannerMeta: { type: mongoose.Schema.Types.Mixed },
  },
  { _id: false },
);

// ─── Sub-schema: Dependency Scan Result ──────────────────────────────────────
const dependencyScanSchema = new mongoose.Schema(
  {
    // Total dependencies inspected
    totalDependencies: { type: Number, default: 0 },

    // How many had known vulnerabilities
    vulnerableDependencies: { type: Number, default: 0 },

    // Breakdown by severity
    vulnerabilitiesBySeverity: {
      critical: { type: Number, default: 0 },
      high: { type: Number, default: 0 },
      medium: { type: Number, default: 0 },
      low: { type: Number, default: 0 },
    },

    // Detailed per-vulnerability findings (e.g. CVE entries)
    findings: [findingSchema],

    // Snapshot of the dependency list at scan time
    dependenciesScanned: [{ type: String }],

    // Scanner / advisory database meta
    scannerMeta: { type: mongoose.Schema.Types.Mixed },
  },
  { _id: false },
);

// ─── Sub-schema: Secret Scan Result ──────────────────────────────────────────
const secretScanSchema = new mongoose.Schema(
  {
    // Whether any secrets / credentials were found
    secretsFound: { type: Boolean, default: false },

    // Total count of leaked secrets detected
    totalSecrets: { type: Number, default: 0 },

    // Categories of secrets detected, e.g. ["AWS_KEY", "GITHUB_TOKEN"]
    secretTypes: [{ type: String }],

    // Individual findings with redacted values for safe storage
    findings: [findingSchema],

    // Scanner engine meta
    scannerMeta: { type: mongoose.Schema.Types.Mixed },
  },
  { _id: false },
);

// ─── Main Schema ─────────────────────────────────────────────────────────────
const securityReportSchema = new mongoose.Schema(
  {
    // ── Target Reference ────────────────────────────────────────────────────
    // A scan targets either a Module OR a Component — at least one must be set.

    resourceType: {
      type: String,
      enum: ['module', 'component'],
      required: true,
      default: 'module',
      index: true,
    },

    moduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Module',
      default: null,
      index: true,
    },

    componentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Component',
      default: null,
      index: true,
    },

    // ── Scan Lifecycle ───────────────────────────────────────────────────────

    // Current status of the pipeline run
    scanStatus: {
      type: String,
      enum: ['pending', 'running', 'completed', 'failed'],
      default: 'pending',
      index: true,
    },

    // ISO timestamp when the scan started executing
    startedAt: {
      type: Date,
      default: null,
    },

    // Wall-clock duration of the entire scan in milliseconds.
    // Stored (not virtual) so it is queryable and available in .lean() results.
    durationMs: {
      type: Number,
      default: null,
    },

    // ISO timestamp when the scan finished (success or failure)
    completedAt: {
      type: Date,
      default: null,
    },

    // Human-readable error message if the scan pipeline itself failed
    pipelineError: {
      type: String,
      default: null,
    },

    // Which user triggered this scan (for audit trail)
    triggeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    // Whether this is a manual re-scan (vs. first-time automatic scan)
    isRescan: {
      type: Boolean,
      default: false,
    },

    // ── Scanner Results ──────────────────────────────────────────────────────

    // Output of the malware detection scanner
    malwareResult: {
      type: malwareResultSchema,
      default: () => ({}),
    },

    // Output of the static code analysis scanner
    staticAnalysis: {
      type: staticAnalysisSchema,
      default: () => ({}),
    },

    // Output of the dependency vulnerability scanner
    dependencyScan: {
      type: dependencyScanSchema,
      default: () => ({}),
    },

    // Output of the secret / credential leak scanner
    secretScan: {
      type: secretScanSchema,
      default: () => ({}),
    },

    // ── Risk Assessment ──────────────────────────────────────────────────────

    // Computed aggregate risk score in range [0, 100].
    // Higher = more dangerous. Calculated by riskScorer.js.
    riskScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    // Categorical risk level derived from riskScore.
    // Levels: safe | medium | high | critical
    riskLevel: {
      type: String,
      enum: ['low', 'safe', 'medium', 'high', 'critical'],
      default: 'safe',
    },

    // ── AI-Generated Content ─────────────────────────────────────────────────

    // Natural-language executive summary produced by the AI summarizer
    aiSummary: {
      type: String,
      default: null,
    },

    // Actionable recommendation produced by the AI summarizer
    recommendation: {
      type: String,
      default: null,
    },
  },
  {
    // Automatically manage createdAt and updatedAt timestamps
    timestamps: true,
  },
);

// ─── Compound Indexes ─────────────────────────────────────────────────────────

// Efficiently retrieve the latest scan for a module, sorted by creation time
securityReportSchema.index({ moduleId: 1, createdAt: -1 });

// Efficiently retrieve the latest scan for a component
securityReportSchema.index({ componentId: 1, createdAt: -1 });

module.exports = mongoose.model('SecurityReport', securityReportSchema);
