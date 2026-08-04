import { useState, useEffect } from "react";
import { BarChart3, Package, Download, CheckCircle, Clock, XCircle, RefreshCw, AlertTriangle, PieChart } from "lucide-react";
import { api } from "../../lib/api";
import { Card } from "../../components/ui/index";

// ─── Stat Card Component ──────────────────────────────────────────────────────
function AnalyticsStatCard({ icon: Icon, label, value, color = "gold", percentage }) {
  const colorMap = {
    gold: "from-gold-500/15 via-gold-500/5 to-transparent text-gold-300 border-gold-500/10",
    green: "from-emerald-500/15 via-emerald-500/5 to-transparent text-emerald-300 border-emerald-500/10",
    blue: "from-blue-500/15 via-blue-500/5 to-transparent text-blue-300 border-blue-500/10",
    red: "from-red-500/15 via-red-500/5 to-transparent text-red-300 border-red-500/10",
  };

  return (
    <Card className={`bg-gradient-to-br ${colorMap[color]} border p-5 flex flex-col justify-between h-32`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
          <p className="mt-2 text-3xl font-black text-foreground">{value}</p>
        </div>
        <div className="rounded-lg bg-white/[0.03] border border-white/[0.05] p-2">
          <Icon size={16} className="opacity-70" />
        </div>
      </div>
      {percentage !== undefined && (
        <div className="flex items-center gap-1.5 mt-2">
          <div className="w-full bg-white/[0.04] h-1.5 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full ${
                color === "gold" ? "bg-gold-500" :
                color === "green" ? "bg-emerald-500" :
                color === "blue" ? "bg-blue-500" : "bg-red-500"
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
          <span className="text-[10px] font-mono text-muted-foreground w-8 text-right">{percentage}%</span>
        </div>
      )}
    </Card>
  );
}

// ─── Skeleton Loader ─────────────────────────────────────────────────────────
function Skeleton({ className = "" }) {
  return <div className={`animate-pulse rounded bg-white/[0.04] ${className}`} />;
}

// ─── AnalyticsPage ────────────────────────────────────────────────────────────
export function AnalyticsPage() {
  const [data, setData] = useState({
    total: 0,
    approved: 0,
    submitted: 0,
    rejected: 0,
    downloads: 0,
    categories: {},
    topModules: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAnalytics = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/api/modules?limit=100");
      const allModules = res?.modules || [];

      // Metrics calculation
      const total = allModules.length;
      const approved = allModules.filter(m => m.status === "approved").length;
      const submitted = allModules.filter(m => m.status === "submitted" || m.status === "pending").length;
      const rejected = allModules.filter(m => m.status === "rejected").length;
      const downloads = allModules.reduce((sum, m) => sum + (m.downloadCount || 0), 0);

      // Categories distribution
      const categories = {};
      allModules.forEach(m => {
        categories[m.category] = (categories[m.category] || 0) + 1;
      });

      // Top 5 downloaded modules
      const topModules = [...allModules]
        .sort((a, b) => (b.downloadCount || 0) - (a.downloadCount || 0))
        .slice(0, 5);

      setData({ total, approved, submitted, rejected, downloads, categories, topModules });
    } catch (err) {
      setError(err.message || "Failed to load platform analytics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  // Compute percentages safely
  const getPct = (val) => (data.total > 0 ? Math.round((val / data.total) * 100) : 0);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Analytics</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Real-time insights and usage metrics across the registry.
          </p>
        </div>
        <button
          onClick={fetchAnalytics}
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
          <AlertTriangle size={15} className="flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Overview Cards */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <AnalyticsStatCard icon={Package} label="Total Modules" value={data.total} color="gold" />
          <AnalyticsStatCard icon={CheckCircle} label="Approved Modules" value={data.approved} color="green" percentage={getPct(data.approved)} />
          <AnalyticsStatCard icon={Clock} label="Pending Review" value={data.submitted} color="blue" percentage={getPct(data.submitted)} />
          <AnalyticsStatCard icon={Download} label="Total Downloads" value={data.downloads} color="gold" />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Category Breakdown */}
        <Card className="border-white/[0.06] p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-white/[0.04] pb-3">
            <PieChart size={16} className="text-gold-400" />
            <h2 className="text-sm font-semibold text-foreground">Category Distribution</h2>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
            </div>
          ) : Object.keys(data.categories).length === 0 ? (
            <p className="text-xs text-muted-foreground py-8 text-center">No category data available.</p>
          ) : (
            <div className="space-y-4">
              {Object.entries(data.categories).map(([cat, count]) => {
                const percentage = getPct(count);
                return (
                  <div key={cat} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-foreground">{cat}</span>
                      <span className="text-muted-foreground">{count} module{count !== 1 ? "s" : ""} ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-white/[0.03] h-2 rounded-full overflow-hidden border border-white/[0.05]">
                      <div className="bg-gold-500 h-full rounded-full" style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Top Downloaded Modules */}
        <Card className="border-white/[0.06] p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-white/[0.04] pb-3">
            <BarChart3 size={16} className="text-gold-400" />
            <h2 className="text-sm font-semibold text-foreground">Top Downloaded Modules</h2>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : data.topModules.length === 0 ? (
            <p className="text-xs text-muted-foreground py-8 text-center">No downloads registered yet.</p>
          ) : (
            <div className="space-y-3">
              {data.topModules.map((mod, index) => {
                const maxDownloads = data.topModules[0]?.downloadCount || 1;
                const pctOfMax = Math.round(((mod.downloadCount || 0) / maxDownloads) * 100);
                return (
                  <div key={mod._id} className="flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-semibold text-foreground truncate">{mod.title}</span>
                        <span className="font-mono text-muted-foreground text-[10px] flex items-center gap-1">
                          <Download size={10} /> {mod.downloadCount || 0}
                        </span>
                      </div>
                      <div className="w-full bg-white/[0.03] h-1.5 rounded-full overflow-hidden">
                        <div className="bg-gold-400 h-full rounded-full" style={{ width: `${pctOfMax}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
