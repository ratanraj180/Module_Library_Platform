import { useState, useEffect, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Package, Search, Filter, Download, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { api } from "../../lib/api";
import { Badge, Card } from "../../components/ui/index";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const CATEGORIES = ["Frontend", "Backend", "Database", "Utility", "DevOps", "Other"];
const STATUSES   = ["pending", "submitted", "approved", "rejected"];

function statusVariant(status) {
  switch (status) {
    case "approved":  return "stable";
    case "submitted": return "beta";
    case "pending":   return "beta";
    case "rejected":  return "deprecated";
    default:          return "default";
  }
}

function Skeleton({ className = "" }) {
  return <div className={`animate-pulse rounded bg-white/[0.05] ${className}`} />;
}

// ─── ModulesPage ──────────────────────────────────────────────────────────────
export function ModulesPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [modules, setModules]     = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");

  const search   = searchParams.get("search")   || "";
  const category = searchParams.get("category") || "";
  const status   = searchParams.get("status")   || "";
  const page     = parseInt(searchParams.get("page") || "1", 10);

  const fetchModules = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page, limit: 12 });
      if (search)   params.set("search", search);
      if (category) params.set("category", category);
      if (status)   params.set("status", status);

      const data = await api.get(`/api/modules?${params}`);
      setModules(data?.modules || []);
      setPagination(data?.pagination || { page: 1, pages: 1, total: 0 });
    } catch (err) {
      setError(err.message || "Failed to load modules.");
    } finally {
      setLoading(false);
    }
  }, [search, category, status, page]);

  useEffect(() => { fetchModules(); }, [fetchModules]);

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value); else next.delete(key);
    if (key !== "page") next.delete("page");
    setSearchParams(next);
  };

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Modules</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {loading ? "Loading…" : `${pagination.total} module${pagination.total !== 1 ? "s" : ""} found`}
          </p>
        </div>
        <button
          onClick={fetchModules}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-all disabled:opacity-40"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <Card className="border-white/[0.06] p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search modules…"
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
              className="input-field pl-9 text-sm appearance-none pr-8 min-w-[140px]"
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

      {/* Module grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-44" />)}
        </div>
      ) : modules.length === 0 ? (
        <Card className="border-white/[0.06] flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Package size={36} className="mb-3 opacity-30" />
          <p className="text-sm">No modules found</p>
          <p className="text-xs mt-1 opacity-60">Try adjusting your search or filters.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map((mod) => (
            <Link key={mod._id} to={`/dashboard/modules/${mod._id}`}>
              <Card
                hover
                className="border-white/[0.06] p-5 h-full flex flex-col gap-3 group transition-all hover:border-gold-500/20"
              >
                {/* Top row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-8 w-8 rounded-lg bg-gold-500/10 flex items-center justify-center flex-shrink-0">
                      <Package size={14} className="text-gold-400" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-foreground group-hover:text-gold-300 transition-colors truncate">
                        {mod.title}
                      </h3>
                      <p className="text-[11px] text-muted-foreground">v{mod.currentVersion}</p>
                    </div>
                  </div>
                  <Badge variant={statusVariant(mod.status)}>{mod.status}</Badge>
                </div>

                {/* Description */}
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 flex-1">
                  {mod.description}
                </p>

                {/* Footer */}
                <div className="flex flex-col gap-2 pt-2 border-t border-white/[0.04]">
                  {/* Selected Categories and Tech Stack Badges */}
                  <div className="flex flex-wrap gap-1">
                    {(Array.isArray(mod.categories) && mod.categories.length > 0 ? mod.categories : [mod.category || "Other"]).map((cat) => (
                      <span key={cat} className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-gold-500/10 text-gold-300 border border-gold-500/20">
                        {cat}
                      </span>
                    ))}
                    {(Array.isArray(mod.technologies) && mod.technologies.length > 0 ? mod.technologies : [mod.technology || "JavaScript"]).map((tech) => (
                      <span key={tech} className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">
                        {tech}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>{mod.currentVersion}</span>
                    <span className="flex items-center gap-1">
                      <Download size={11} /> {mod.downloadCount || 0}
                    </span>
                  </div>
                </div>
              </Card>
            </Link>
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
