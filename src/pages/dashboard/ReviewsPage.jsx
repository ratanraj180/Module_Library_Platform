import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ClipboardList, CheckCircle, XCircle, Package, RefreshCw, AlertTriangle } from "lucide-react";
import { api } from "../../lib/api";
import { useAuth } from "../../hooks/useAuth";
import { Badge, Card } from "../../components/ui/index";
import { cn } from "../../lib/utils";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function Skeleton({ className = "" }) {
  return <div className={`animate-pulse rounded bg-white/[0.05] ${className}`} />;
}

// ─── ReviewsPage ──────────────────────────────────────────────────────────────
export function ReviewsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [queue, setQueue]             = useState([]);
  const [allReviews, setAllReviews]   = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");
  const [securityReports, setSecurityReports] = useState({});

  const [actionLoading, setActionLoading] = useState(null); // holds module id being actioned
  const [actionError, setActionError]     = useState("");
  const [rejectTarget, setRejectTarget]   = useState(null); // { id, comment }

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [reviewsData, queueData] = await Promise.all([
        api.get("/api/reviews"),
        isAdmin ? api.get("/api/modules/queue") : Promise.resolve([]),
      ]);
      setAllReviews(Array.isArray(reviewsData) ? reviewsData : []);
      const queueList = Array.isArray(queueData) ? queueData : [];
      setQueue(queueList);

      if (queueList.length > 0) {
        const reports = await Promise.all(
          queueList.map(async (mod) => {
            try {
              const repRes = await api.get(`/api/security/report/module/${mod._id}`);
              return { moduleId: mod._id, report: repRes.report };
            } catch (e) {
              return { moduleId: mod._id, report: null };
            }
          })
        );
        const secMap = {};
        reports.forEach(r => {
          if (r.report) {
            secMap[r.moduleId] = r.report;
          }
        });
        setSecurityReports(secMap);
      }
    } catch (err) {
      setError(err.message || "Failed to load reviews.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleApprove = async (moduleId) => {
    setActionLoading(moduleId);
    setActionError("");
    try {
      await api.patch(`/api/modules/${moduleId}/approve`, { comment: "Approved" });
      await fetchData();
    } catch (err) {
      setActionError(err.message || "Failed to approve.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectTarget?.comment?.trim()) {
      setActionError("A comment is required to reject a module.");
      return;
    }
    setActionLoading(rejectTarget.id);
    setActionError("");
    try {
      await api.patch(`/api/modules/${rejectTarget.id}/reject`, { comment: rejectTarget.comment });
      setRejectTarget(null);
      await fetchData();
    } catch (err) {
      setActionError(err.message || "Failed to reject.");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Module Reviews</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isAdmin ? "Review and approve pending module submissions." : "View review history."}
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-all disabled:opacity-40"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400 flex gap-2">
          <AlertTriangle size={15} className="flex-shrink-0 mt-0.5" /> {error}
        </div>
      )}

      {/* Action error */}
      {actionError && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {actionError}
        </div>
      )}

      {/* ── Admin: Approval Queue ── */}
      {isAdmin && (
        <Card className="border-white/[0.06]">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-white/[0.06]">
            <ClipboardList size={16} className="text-gold-400" />
            <h2 className="text-sm font-semibold text-foreground">Pending Approval</h2>
            {!loading && (
              <span className="ml-auto text-xs text-muted-foreground">{queue.length} waiting</span>
            )}
          </div>

          {loading ? (
            <div className="p-5 space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
          ) : queue.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-muted-foreground">
              <CheckCircle size={28} className="mb-2 text-emerald-400 opacity-60" />
              <p className="text-sm">All caught up — no pending submissions.</p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {queue.map((mod) => (
                <div key={mod._id} className="px-5 py-4">
                  {/* Reject form for this module */}
                  {rejectTarget?.id === mod._id ? (
                    <div className="space-y-2">
                      <p className="text-xs text-foreground font-medium mb-1">Rejecting: {mod.title}</p>
                      <textarea
                        value={rejectTarget.comment}
                        onChange={(e) => setRejectTarget({ ...rejectTarget, comment: e.target.value })}
                        placeholder="Reason for rejection (required)…"
                        rows={2}
                        className="input-field w-full text-sm resize-none"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleReject}
                          disabled={actionLoading === mod._id}
                          className="px-3 py-1.5 text-xs rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold disabled:opacity-50 transition-all"
                        >
                          Confirm Reject
                        </button>
                        <button
                          onClick={() => { setRejectTarget(null); setActionError(""); }}
                          className="px-3 py-1.5 text-xs rounded-lg border border-white/[0.08] text-muted-foreground hover:text-foreground"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-8 w-8 rounded-lg bg-gold-500/10 flex items-center justify-center flex-shrink-0">
                          <Package size={14} className="text-gold-400" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2.5">
                            <Link
                              to={`/dashboard/modules/${mod._id}`}
                              className="text-sm font-medium text-foreground hover:text-gold-300 transition-colors truncate block"
                            >
                              {mod.title}
                            </Link>
                            {/* Security Status Badge */}
                            {(() => {
                              const rep = securityReports[mod._id];
                              if (!rep) return <span className="text-[9px] text-muted-foreground/45 border border-white/[0.04] px-1.5 py-0.5 rounded font-mono bg-white/[0.01]">NO REPORT</span>;
                              if (rep.scanStatus === 'pending' || rep.scanStatus === 'running') {
                                return <span className="text-[9px] text-yellow-400/80 border border-yellow-500/20 px-1.5 py-0.5 rounded font-mono bg-yellow-500/5 animate-pulse">SCANNING</span>;
                              }
                              if (rep.scanStatus === 'failed') {
                                return <span className="text-[9px] text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded font-mono bg-red-500/5">FAILED</span>;
                              }
                              if (rep.malwareResult?.detected) {
                                return <span className="text-[9px] text-red-500 border border-red-500/30 px-1.5 py-0.5 rounded font-mono bg-red-500/10 font-bold">🚨 INFECTED</span>;
                              }
                              return (
                                <span className={cn(
                                  "text-[9px] border px-1.5 py-0.5 rounded font-mono font-bold",
                                  rep.riskScore < 80 
                                    ? "bg-red-500/10 text-red-400 border-red-500/20"
                                    : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                )}>
                                  SCORE: {rep.riskScore}/100
                                </span>
                              );
                            })()}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {mod.category} · {mod.technology} · by {mod.owner?.name || "Unknown"}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to approve "${mod.title}"?`)) {
                              handleApprove(mod._id);
                            }
                          }}
                          disabled={actionLoading === mod._id}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold disabled:opacity-50 transition-all"
                        >
                          <CheckCircle size={13} /> Approve
                        </button>
                        <button
                          onClick={() => setRejectTarget({ id: mod._id, comment: "" })}
                          disabled={actionLoading === mod._id}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-red-600/80 hover:bg-red-600 text-white font-semibold disabled:opacity-50 transition-all"
                        >
                          <XCircle size={13} /> Reject
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* ── All Reviews ── */}
      <Card className="border-white/[0.06]">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-white/[0.06]">
          <ClipboardList size={16} className="text-gold-400" />
          <h2 className="text-sm font-semibold text-foreground">Review History</h2>
          {!loading && (
            <span className="ml-auto text-xs text-muted-foreground">{allReviews.length} reviews</span>
          )}
        </div>

        {loading ? (
          <div className="p-5 space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
        ) : allReviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-muted-foreground">
            <ClipboardList size={28} className="mb-2 opacity-30" />
            <p className="text-sm">No reviews yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {allReviews.map((r) => (
              <div key={r._id} className="flex items-start gap-3 px-5 py-4">
                <div className={`mt-0.5 flex-shrink-0 ${r.status === "approved" ? "text-emerald-400" : "text-red-400"}`}>
                  {r.status === "approved" ? <CheckCircle size={15} /> : <XCircle size={15} />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <Link
                      to={`/dashboard/modules/${r.module?._id}`}
                      className="text-sm font-medium text-foreground hover:text-gold-300 transition-colors"
                    >
                      {r.module?.title || "Unknown Module"}
                    </Link>
                    <div className="flex items-center gap-2">
                      <Badge variant={r.status === "approved" ? "stable" : "deprecated"}>{r.status}</Badge>
                      <span className="text-[11px] text-muted-foreground">{new Date(r.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">by {r.reviewer?.name || "Reviewer"}</p>
                  {r.comment && <p className="text-xs text-muted-foreground/70 mt-1 italic">"{r.comment}"</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
