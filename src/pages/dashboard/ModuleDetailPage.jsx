import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Package, ArrowLeft, Download, GitBranch, Tag, User,
  Calendar, CheckCircle, XCircle, Clock, ExternalLink, RefreshCw, AlertTriangle,
  ShieldCheck
} from "lucide-react";

import { api } from "../../lib/api";
import { useAuth } from "../../hooks/useAuth";
import { Badge, Card } from "../../components/ui/index";
import { cn } from "../../lib/utils";

import {
  RiskBadge,
  SecurityScoreCard,
  SecuritySummary,
  RecommendationCard,
  FindingCard
} from "../../components/security/SecurityWidgets";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function statusVariant(status) {
  switch (status) {
    case "approved":  return "stable";
    case "submitted":
    case "pending":   return "beta";
    case "rejected":  return "deprecated";
    default:          return "default";
  }
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-white/[0.04] last:border-0">
      <Icon size={14} className="text-muted-foreground flex-shrink-0" />
      <span className="text-xs text-muted-foreground w-28 flex-shrink-0">{label}</span>
      <span className="text-xs text-foreground">{value || "—"}</span>
    </div>
  );
}

function Skeleton({ className = "" }) {
  return <div className={`animate-pulse rounded bg-white/[0.05] ${className}`} />;
}

// ─── ModuleDetailPage ─────────────────────────────────────────────────────────
export function ModuleDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [module, setModule]     = useState(null);
  const [versions, setVersions] = useState([]);
  const [reviews, setReviews]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");

  // Action states
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError]     = useState("");
  const [rejectComment, setRejectComment] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [securityReport, setSecurityReport] = useState(null);
  const [overrideChecked, setOverrideChecked] = useState(false);
  const [activeTab, setActiveTab]         = useState("overview");

  const fetchAll = async () => {
    setLoading(true);
    setError("");
    try {
      const [modData, vData, rData, secData] = await Promise.all([
        api.get(`/api/modules/${id}`),
        api.get(`/api/modules/${id}/versions`).catch(() => []),
        api.get(`/api/reviews?moduleId=${id}`).catch(() => []),
        api.get(`/api/security/report/${id}`).catch(() => null),
      ]);
      setModule(modData);
      setVersions(Array.isArray(vData) ? vData : []);
      setReviews(Array.isArray(rData) ? rData : []);
      if (secData && secData.report) {
        setSecurityReport(secData.report);
      } else {
        setSecurityReport(null);
      }
    } catch (err) {
      if (err.status === 401 || err.status === 403 || err.message?.toLowerCase().includes("unauthorized") || err.message?.toLowerCase().includes("not authorized")) {
        navigate("/login", { state: { from: `/dashboard/modules/${id}` } });
      } else {
        setError(err.message || "Failed to load module.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (id) fetchAll(); }, [id]);

  const handleApprove = async () => {
    setActionLoading(true);
    setActionError("");
    try {
      await api.patch(`/api/modules/${id}/approve`, { 
        comment: "Approved",
        overrideThreshold: overrideChecked 
      });
      await fetchAll();
    } catch (err) {
      setActionError(err.message || "Failed to approve.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectComment.trim()) {
      setActionError("A comment is required to reject a module.");
      return;
    }
    setActionLoading(true);
    setActionError("");
    try {
      await api.patch(`/api/modules/${id}/reject`, { comment: rejectComment });
      setShowRejectForm(false);
      setRejectComment("");
      await fetchAll();
    } catch (err) {
      setActionError(err.message || "Failed to reject.");
    } finally {
      setActionLoading(false);
    }
  };
 
  const handleSubmitForReview = async () => {
    setActionLoading(true);
    setActionError("");
    try {
      await api.patch(`/api/modules/${id}/submit`);
      await fetchAll();
    } catch (err) {
      setActionError(err.message || "Failed to submit for review.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-5 max-w-4xl mx-auto">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-56" />
        <Skeleton className="h-40" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-4 text-sm text-red-400 flex items-center gap-2">
          <AlertTriangle size={16} />
          {error}
        </div>
      </div>
    );
  }

  if (!module) return null;

  const canAdminAct = isAdmin && module.status === "submitted";
  const isOwner = module.owner?._id === user?._id || module.owner === user?._id;
  const canSubmit = isOwner && user?.role === "developer" && module.status === "pending";

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft size={15} /> Back to Modules
      </button>

      {/* Header card */}
      <Card className="border-white/[0.06] p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-gold-500/10 flex items-center justify-center flex-shrink-0">
              <Package size={22} className="text-gold-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-foreground">{module.title}</h1>
                {module.importedFromGithub && (
                  <span className="inline-flex items-center gap-1 text-[9px] uppercase font-black px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400">
                    Imported from GitHub
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                <Badge variant={statusVariant(module.status)}>{module.status}</Badge>
                <span className="text-xs text-muted-foreground">v{module.currentVersion}</span>
                
                {/* Categories */}
                <div className="flex gap-1.5">
                  {(Array.isArray(module.categories) && module.categories.length > 0 ? module.categories : [module.category || "Other"]).map((cat) => (
                    <span key={cat} className="text-[10px] px-1.5 py-0.5 rounded bg-gold-500/10 text-gold-300 border border-gold-500/20">
                      {cat}
                    </span>
                  ))}
                </div>

                {module.importedFromGithub && (
                  <span className="text-xs text-blue-400">★ {module.githubStars || 0} stars</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            {module.importedFromGithub && (
              <button
                onClick={async () => {
                  setActionLoading(true);
                  setActionError("");
                  try {
                    await api.post(`/api/modules/${id}/sync`);
                    await fetchAll();
                    alert("GitHub Repository metadata sync completed successfully!");
                  } catch (err) {
                    setActionError(err.message || "Failed to sync GitHub repository.");
                  } finally {
                    setActionLoading(false);
                  }
                }}
                disabled={actionLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-white/[0.08] bg-white/[0.02] text-muted-foreground hover:text-foreground transition-all disabled:opacity-40"
              >
                <RefreshCw size={12} className={actionLoading ? "animate-spin" : ""} /> Sync Repository
              </button>
            )}
            {module.repositoryUrl && (
              <a
                href={module.repositoryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-white/[0.08] text-muted-foreground hover:text-foreground transition-all"
              >
                <ExternalLink size={12} /> Repository
              </a>
            )}
          </div>
        </div>

        <p className="mt-4 text-sm text-muted-foreground leading-relaxed">{module.description}</p>

        {/* Tags */}
        {module.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-4">
            {module.tags.map((tag) => (
              <span key={tag} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/[0.04] text-[11px] text-muted-foreground border border-white/[0.06]">
                <Tag size={10} /> {tag}
              </span>
            ))}
          </div>
        )}
      </Card>

      {/* Admin actions */}
      {isAdmin && canAdminAct && (
        <Card className="border-gold-500/20 bg-gold-500/5 p-5 space-y-4">
          <p className="text-sm font-medium text-gold-300">Admin Actions</p>

          {/* Display Security Scan Audit before Approve */}
          {securityReport && (
            <div className="rounded-xl border border-white/[0.06] bg-background/50 p-4 space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-white/[0.04] pb-2">
                <span className="font-bold text-foreground flex items-center gap-1.5">
                  <ShieldCheck size={12} className="text-gold-300" />
                  Pre-Approval Security Audit
                </span>
                <span className="font-mono text-muted-foreground/50">Score: {securityReport.riskScore}/100</span>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/[0.01] rounded-lg p-2 border border-white/[0.02]">
                  <span className="text-[10px] text-muted-foreground/60 block">Malware Result</span>
                  <span className={cn("font-bold text-xs", securityReport.malwareResult?.detected ? "text-red-400" : "text-emerald-400")}>
                    {securityReport.malwareResult?.detected ? "🚨 INFECTED" : "✓ Clean"}
                  </span>
                </div>
                <div className="bg-white/[0.01] rounded-lg p-2 border border-white/[0.02]">
                  <span className="text-[10px] text-muted-foreground/60 block">Risk Rating</span>
                  <span className="font-mono text-xs uppercase font-bold text-foreground">
                    {securityReport.riskLevel}
                  </span>
                </div>
              </div>

              {/* AI summary snippet */}
              {securityReport.aiSummary && (
                <div className="bg-white/[0.01] border border-white/[0.02] rounded-lg p-2.5 text-[11px] text-muted-foreground/80 leading-relaxed">
                  <p className="font-semibold text-foreground/80 mb-1">AI Posture Summary:</p>
                  {securityReport.aiSummary}
                </div>
              )}

              {/* Malware found warning */}
              {securityReport.malwareResult?.detected && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-xs text-red-400 font-semibold flex items-center gap-2">
                  <AlertTriangle size={14} className="animate-bounce" />
                  Approval disabled: Severe threat identified (Malware detected).
                </div>
              )}

              {/* Score below threshold override logic */}
              {!securityReport.malwareResult?.detected && securityReport.riskScore < 80 && (
                <div className="space-y-2">
                  <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-3 py-2 text-xs text-yellow-400 leading-relaxed">
                    ⚠️ Safety score ({securityReport.riskScore}) is below the required threshold of 80. Approving this module requires manual override confirmation.
                  </div>
                  <label className="flex items-center gap-2 text-xs font-medium text-foreground cursor-pointer select-none py-1">
                    <input
                      type="checkbox"
                      checked={overrideChecked}
                      onChange={(e) => setOverrideChecked(e.target.checked)}
                      className="rounded bg-background border-white/[0.08] text-gold-500 focus:ring-0 cursor-pointer h-4 w-4"
                    />
                    I confirm that I have reviewed the code vulnerabilities and wish to force manual override approval.
                  </label>
                </div>
              )}
            </div>
          )}

          {actionError && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
              {actionError}
            </div>
          )}

          {showRejectForm ? (
            <div className="space-y-3">
              <textarea
                value={rejectComment}
                onChange={(e) => setRejectComment(e.target.value)}
                placeholder="Reason for rejection (required)…"
                rows={3}
                className="input-field w-full text-sm resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleReject}
                  disabled={actionLoading}
                  className="flex items-center gap-2 px-4 py-2 text-xs rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold transition-all disabled:opacity-50"
                >
                  <XCircle size={13} /> Confirm Reject
                </button>
                <button
                  onClick={() => { setShowRejectForm(false); setRejectComment(""); setActionError(""); }}
                  className="px-4 py-2 text-xs rounded-lg border border-white/[0.08] text-muted-foreground hover:text-foreground transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (window.confirm(`Are you sure you want to approve "${module.title}"?`)) {
                    handleApprove();
                  }
                }}
                disabled={
                  actionLoading || 
                  (securityReport && securityReport.malwareResult?.detected) || 
                  (securityReport && securityReport.riskScore < 80 && !overrideChecked)
                }
                className="flex items-center gap-2 px-4 py-2 text-xs rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <CheckCircle size={13} /> Approve
              </button>
              <button
                onClick={() => setShowRejectForm(true)}
                disabled={actionLoading}
                className="flex items-center gap-2 px-4 py-2 text-xs rounded-lg bg-red-600/80 hover:bg-red-600 text-white font-semibold transition-all disabled:opacity-50"
              >
                <XCircle size={13} /> Reject
              </button>
            </div>
          )}
        </Card>
      )}

      {/* Maintainer actions */}
      {canSubmit && (
        <Card className="border-gold-500/20 bg-gold-500/5 p-5">
          <p className="text-sm font-medium text-gold-300 mb-3">Owner Actions</p>

          {actionError && (
            <div className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
              {actionError}
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => {
                if (window.confirm(`Are you sure you want to submit "${module.title}" for review?`)) {
                  handleSubmitForReview();
                }
              }}
              disabled={actionLoading}
              className="flex items-center gap-1.5 px-4 py-2 text-xs rounded-lg bg-gold-500 hover:bg-gold-600 text-black font-semibold transition-all disabled:opacity-50"
            >
              <CheckCircle size={13} /> Submit for Review
            </button>
          </div>
        </Card>
      )}

      {/* Error Alert Info */}
      {actionError && !showRejectForm && !isAdmin && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-400">
          {actionError}
        </div>
      )}

      {/* Tabs Header */}
      <div className="flex gap-4 border-b border-white/[0.06] pb-3 mb-6">
        <button
          onClick={() => setActiveTab("overview")}
          className={cn(
            "text-xs font-bold uppercase tracking-wider pb-1.5 border-b-2 transition-all",
            activeTab === "overview"
              ? "border-gold-500 text-gold-400"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab("security")}
          className={cn(
            "text-xs font-bold uppercase tracking-wider pb-1.5 border-b-2 transition-all",
            activeTab === "security"
              ? "border-gold-500 text-gold-400"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Security Report
        </button>
      </div>

      {activeTab === "overview" ? (
        <div className="space-y-5 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Module info */}
            <Card className="border-white/[0.06] p-5 md:col-span-2">
              <h2 className="text-sm font-semibold text-foreground mb-3">Module Details</h2>
              <InfoRow icon={User}      label="Owner"        value={module.owner?.name} />
              {/* Custom Info Row displaying all technologies as modern tags */}
              <div className="flex items-start gap-3 py-2 border-b border-white/[0.04]">
                <Tag size={14} className="text-gold-400 mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="text-xs text-muted-foreground">Technologies</span>
                  <div className="flex flex-wrap gap-1 mt-0.5 sm:mt-0 justify-end">
                    {(Array.isArray(module.technologies) && module.technologies.length > 0 ? module.technologies : [module.technology || "JavaScript"]).map((tech) => (
                      <span key={tech} className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <InfoRow icon={GitBranch} label="Version"      value={module.currentVersion} />
              <InfoRow icon={Download}  label="Downloads"    value={module.downloadCount} />
              <InfoRow icon={Calendar}  label="Created"      value={new Date(module.createdAt).toLocaleDateString()} />
              <InfoRow icon={Calendar}  label="Updated"      value={new Date(module.updatedAt).toLocaleDateString()} />
              {module.githubLastUpdated && (
                <InfoRow icon={Calendar}  label="GitHub Last Sync" value={new Date(module.githubLastUpdated).toLocaleString()} />
              )}
              {module.approvedBy && (
                <InfoRow icon={CheckCircle} label="Approved at" value={module.approvedAt ? new Date(module.approvedAt).toLocaleDateString() : "—"} />
              )}
            </Card>

            {/* Versions */}
            <Card className="border-white/[0.06] p-5">
              <h2 className="text-sm font-semibold text-foreground mb-3">Versions</h2>
              {versions.length === 0 ? (
                <p className="text-xs text-muted-foreground">No version history available.</p>
              ) : (
                <div className="space-y-2">
                  {versions.map((v) => (
                    <div key={v._id} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
                      <span className="text-xs font-mono text-gold-300">{v.versionNumber}</span>
                      <span className="text-[11px] text-muted-foreground">{new Date(v.createdAt).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Dependencies & Documentation */}
          {module.importedFromGithub && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Dependencies List */}
              <Card className="border-white/[0.06] p-5">
                <h2 className="text-sm font-semibold text-foreground mb-3">Package Dependencies</h2>
                {module.dependenciesList?.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No dependencies configured in package.json.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5 max-h-56 overflow-y-auto pr-1">
                    {module.dependenciesList?.map((dep) => (
                      <span key={dep} className="text-[10px] font-mono px-2 py-0.5 bg-white/[0.02] border border-white/[0.04] text-muted-foreground rounded">
                        {dep}
                      </span>
                    ))}
                  </div>
                )}
              </Card>

              {/* README Documentation content */}
              <Card className="border-white/[0.06] p-5 md:col-span-2 space-y-3">
                <h2 className="text-sm font-semibold text-foreground border-b border-white/[0.04] pb-2">README Documentation</h2>
                {module.readmeContent ? (
                  <pre className="text-[11px] font-mono text-muted-foreground leading-relaxed whitespace-pre-wrap max-h-72 overflow-y-auto bg-white/[0.01] p-3 rounded-lg border border-white/[0.03]">
                    {module.readmeContent}
                  </pre>
                ) : (
                  <p className="text-xs text-muted-foreground">No README file detected in the imported repository.</p>
                )}
              </Card>
            </div>
          )}

          {/* Reviews */}
          <Card className="border-white/[0.06] p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4">Review History</h2>
            {reviews.length === 0 ? (
              <p className="text-xs text-muted-foreground">No reviews yet.</p>
            ) : (
              <div className="space-y-3">
                {reviews.map((r) => (
                  <div key={r._id} className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                    <div className={`mt-0.5 flex-shrink-0 ${r.status === "approved" ? "text-emerald-400" : "text-red-400"}`}>
                      {r.status === "approved" ? <CheckCircle size={14} /> : <XCircle size={14} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-foreground">{r.reviewer?.name || "Reviewer"}</span>
                        <Badge variant={r.status === "approved" ? "stable" : "deprecated"}>{r.status}</Badge>
                      </div>
                      {r.comment && <p className="text-xs text-muted-foreground mt-1">{r.comment}</p>}
                      <p className="text-[11px] text-muted-foreground/60 mt-1">{new Date(r.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      ) : (
        /* Render Security Report Tab */
        <div className="space-y-6 animate-scale-in">
          {securityReport ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1 space-y-6">
                <SecurityScoreCard score={securityReport.riskScore} level={securityReport.riskLevel} />
                <SecuritySummary summary={securityReport.aiSummary} />
                <RecommendationCard recommendation={securityReport.recommendation} />
              </div>
              <div className="md:col-span-2">
                <Card className="p-5 bg-card/30 border-white/[0.06]">
                  <div className="flex items-center justify-between pb-3 border-b border-white/[0.04] mb-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Audit Findings</h3>
                    <span className="text-[9px] font-mono text-muted-foreground/40">
                      Total: {[
                        ...(securityReport.malwareResult?.findings || []),
                        ...(securityReport.staticAnalysis?.findings || []),
                        ...(securityReport.dependencyScan?.findings || []),
                        ...(securityReport.secretScan?.findings || [])
                      ].length} issues
                    </span>
                  </div>
                  <div className="space-y-3">
                    {[
                      ...(securityReport.malwareResult?.findings || []),
                      ...(securityReport.staticAnalysis?.findings || []),
                      ...(securityReport.dependencyScan?.findings || []),
                      ...(securityReport.secretScan?.findings || [])
                    ].length === 0 ? (
                      <div className="flex flex-col items-center justify-center text-center gap-3 py-16">
                        <div className="h-10 w-10 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                          <ShieldCheck size={20} />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-foreground">Perfect Audit Record</h4>
                          <p className="text-[10px] text-muted-foreground/60 max-w-xs mt-1">
                            No concerns found during static analysis, dependency vulnerability, malware, or credential scans.
                          </p>
                        </div>
                      </div>
                    ) : (
                      [
                        ...(securityReport.malwareResult?.findings || []),
                        ...(securityReport.staticAnalysis?.findings || []),
                        ...(securityReport.dependencyScan?.findings || []),
                        ...(securityReport.secretScan?.findings || [])
                      ].map((finding, idx) => (
                        <FindingCard finding={finding} key={idx} />
                      ))
                    )}
                  </div>
                </Card>
              </div>
            </div>
          ) : (
            <Card className="p-12 text-center border-white/[0.06] bg-card/20">
              <p className="text-xs text-muted-foreground">No security report has been generated for this module yet.</p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
