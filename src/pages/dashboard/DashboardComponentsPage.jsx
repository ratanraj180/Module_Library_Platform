import { useState, useEffect, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Code, Search, Filter, RefreshCw, ChevronLeft, ChevronRight, Plus, Copy, Check, Send, AlertTriangle } from "lucide-react";
import { api } from "../../lib/api";
import { Badge, Card } from "../../components/ui/index";
import { useAuth } from "../../hooks/useAuth";

const CATEGORIES = ["UI Components", "Backend Components"];
const STATUSES = ["pending", "submitted", "approved", "rejected"];

function statusVariant(status) {
  switch (status) {
    case "approved":
      return "stable";
    case "submitted":
      return "beta";
    case "pending":
      return "beta";
    case "rejected":
      return "deprecated";
    default:
      return "default";
  }
}

function Skeleton({ className = "" }) {
  return <div className={`animate-pulse rounded bg-white/[0.05] ${className}`} />;
}

export function DashboardComponentsPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [components, setComponents] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copiedId, setCopiedId] = useState(null);
  const [submittingId, setSubmittingId] = useState(null);

  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";
  const status = searchParams.get("status") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);

  const fetchComponents = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page, limit: 12 });
      if (search) params.set("search", search);
      if (category) params.set("category", category);
      if (status) params.set("status", status);
      
      // Filter by current owner unless admin is checking all components
      if (user.role !== "admin") {
        params.set("owner", user.id);
      }

      const data = await api.get(`/api/components?${params}`);
      setComponents(data?.modules || []); // Align key name with backend pagination wrapper
      setPagination(data?.pagination || { page: 1, pages: 1, total: 0 });
    } catch (err) {
      setError(err.message || "Failed to load components.");
    } finally {
      setLoading(false);
    }
  }, [search, category, status, page, user]);

  useEffect(() => {
    fetchComponents();
  }, [fetchComponents]);

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value); else next.delete(key);
    if (key !== "page") next.delete("page");
    setSearchParams(next);
  };

  const handleCopyInstall = (e, id, command) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(command || `npm install @org/component-${id}`);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSubmitForReview = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    setSubmittingId(id);
    try {
      await api.patch(`/api/components/${id}/submit`);
      fetchComponents();
    } catch (err) {
      setError(err.message || "Failed to submit component for review.");
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Components Marketplace</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {user?.role === "admin" ? "All registered marketplace components" : "Your components and code snippets catalog"}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/dashboard/publish-component"
            className="flex items-center gap-2 rounded-lg btn-primary px-3 py-1.5 text-xs font-bold text-black"
          >
            <Plus size={13} />
            Publish Component
          </Link>
          <button
            onClick={fetchComponents}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-all disabled:opacity-40"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-white/[0.06] p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search components…"
              value={search}
              onChange={(e) => updateParam("search", e.target.value)}
              className="input-field pl-9 text-sm w-full"
            />
          </div>

          {/* Category filter */}
          <div className="relative">
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <select
              value={category}
              onChange={(e) => updateParam("category", e.target.value)}
              className="input-field pl-9 text-sm appearance-none pr-8 min-w-[155px]"
            >
              <option value="">All Categories</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Status filter */}
          <div className="relative">
            <select
              value={status}
              onChange={(e) => updateParam("status", e.target.value)}
              className="input-field text-sm appearance-none pr-8 min-w-[130px]"
            >
              <option value="">All Statuses</option>
              {STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>
        </div>
      </Card>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-48" />)}
        </div>
      ) : components.length === 0 ? (
        <Card className="border-white/[0.06] flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Code size={36} className="mb-3 opacity-30 animate-pulse text-gold-400" />
          <p className="text-sm">No components found</p>
          <p className="text-xs mt-1 opacity-60">Try adding a component or adjusting your search filters.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {components.map((comp) => (
            <Card
              key={comp._id}
              className="border-white/[0.06] p-5 h-full flex flex-col gap-3 group relative hover:border-gold-500/20"
            >
              {/* Top row */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-8 w-8 rounded-lg bg-gold-500/10 flex items-center justify-center flex-shrink-0">
                    <Code size={14} className="text-gold-400" />
                  </div>
                  <div className="min-w-0">
                    <Link to={`/components/${comp._id}`} className="hover:text-gold-300 transition-colors">
                      <h3 className="text-sm font-semibold text-foreground truncate">
                        {comp.title}
                      </h3>
                    </Link>
                    <p className="text-[10px] text-muted-foreground">v{comp.currentVersion}</p>
                  </div>
                </div>
                <Badge variant={statusVariant(comp.status)}>{comp.status}</Badge>
              </div>

              {/* Description */}
              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 flex-1">
                {comp.description}
              </p>

              {/* Rejection comment alert if rejected */}
              {comp.status === "rejected" && comp.rejectComment && (
                <div className="flex items-start gap-1.5 rounded bg-red-500/10 border border-red-500/20 p-2 text-[11px] text-red-400">
                  <AlertTriangle size={12} className="mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <span className="font-semibold block">Rejection Feedback:</span>
                    <span className="break-words opacity-90">{comp.rejectComment}</span>
                  </div>
                </div>
              )}

              {/* Component Specs / Installation Command */}
              <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2 border-t border-white/[0.04]">
                <span className="truncate max-w-[180px]">{comp.category}</span>
                <div className="flex gap-2">
                  {comp.status === "pending" && (
                    <button
                      onClick={(e) => handleSubmitForReview(e, comp._id)}
                      disabled={submittingId === comp._id}
                      className="flex items-center gap-1 text-[11px] text-gold-400 hover:text-gold-300 font-semibold"
                    >
                      <Send size={11} />
                      {submittingId === comp._id ? "Submitting…" : "Submit"}
                    </button>
                  )}
                  {comp.installation && (
                    <button
                      onClick={(e) => handleCopyInstall(e, comp._id, comp.installation)}
                      className="text-muted-foreground hover:text-white transition-colors"
                      title="Copy Installation Command"
                    >
                      {copiedId === comp._id ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    </button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Page {pagination.page} of {pagination.pages}
          </p>
          <div className="flex gap-2">
            <button
              disabled={pagination.page <= 1}
              onClick={() => updateParam("page", String(page - 1))}
              className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg border border-white/[0.08] text-muted-foreground hover:text-foreground disabled:opacity-40 transition-all"
            >
              <ChevronLeft size={13} /> Prev
            </button>
            <button
              disabled={pagination.page >= pagination.pages}
              onClick={() => updateParam("page", String(page + 1))}
              className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg border border-white/[0.08] text-muted-foreground hover:text-foreground disabled:opacity-40 transition-all"
            >
              Next <ChevronRight size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
