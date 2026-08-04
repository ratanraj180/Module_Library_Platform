import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  SlidersHorizontal,
  Download,
  ExternalLink,
  Package,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Users,
  RefreshCw,
  Clock,
  ArrowUpRight,
  Plus,
} from "lucide-react";
import { Button, Input, Badge, Card, Separator } from "../../components/ui/index";

// ─── Sample Module Data ───────────────────────────────────────────────────────
const sampleModules = [
  {
    id: "org-auth-core",
    name: "@org/auth-core",
    description: "Robust authentication and authorization library supporting OAuth2, JWT, and session management.",
    category: "Authentication",
    technology: "React / Node.js",
    version: "1.2.0",
    status: "stable",
    team: "Backend Team",
    downloads: "32",
    updatedAt: "4 hours ago",
    tags: ["security", "oauth", "jwt"],
  },
  {
    id: "org-ui-components",
    name: "@org/ui-components",
    description: "Accessible and customizable Radix-based UI components matching the enterprise style guide.",
    category: "UI Components",
    technology: "React / Tailwind",
    version: "1.0.4",
    status: "stable",
    team: "Frontend Team",
    downloads: "22",
    updatedAt: "1 day ago",
    tags: ["ui", "radix", "accessibility"],
  },
  {
    id: "org-logger-pro",
    name: "@org/logger-pro",
    description: "High-performance structured logger with automated log-level management and multi-stream outputs.",
    category: "Utilities",
    technology: "Node.js / TypeScript",
    version: "1.1.0",
    status: "stable",
    team: "DevOps Team",
    downloads: "18",
    updatedAt: "3 days ago",
    tags: ["logging", "observability", "json"],
  },
  {
    id: "org-notification-service",
    name: "@org/notification-service",
    description: "Unified notification pipeline supporting push notifications, SMS, emails, and Webhooks.",
    category: "Utilities",
    technology: "React / Node.js",
    version: "1.0.1",
    status: "stable",
    team: "Platform Team",
    downloads: "15",
    updatedAt: "4 days ago",
    tags: ["notifications", "email", "sms"],
  },
  {
    id: "org-analytics-engine",
    name: "@org/analytics-engine",
    description: "Lightweight client-side telemetry engine for product analytics and runtime performance tracking.",
    category: "Analytics",
    technology: "TypeScript",
    version: "1.1.2",
    status: "beta",
    team: "Platform Team",
    downloads: "12",
    updatedAt: "5 days ago",
    tags: ["telemetry", "analytics", "performance"],
  },
  {
    id: "org-payment-gateway",
    name: "@org/payment-gateway",
    description: "Secure and PCI-compliant wrapper for multi-provider checkout integrations including Stripe and PayPal.",
    category: "Security",
    technology: "Node.js",
    version: "1.0.0",
    status: "beta",
    team: "Backend Team",
    downloads: "10",
    updatedAt: "6 days ago",
    tags: ["payments", "stripe", "pci"],
  },
  {
    id: "org-sec-audit-tool",
    name: "@org/sec-audit-tool",
    description: "Automated static analysis scanner checking dependency vulnerabilities and credential leaks during local builds.",
    category: "Security",
    technology: "Node.js / CLI",
    version: "1.1.4",
    status: "beta",
    team: "DevOps Team",
    downloads: "11",
    updatedAt: "6 days ago",
    tags: ["security", "audit", "compliance"],
  },
  {
    id: "org-devops-pipeline",
    name: "@org/devops-pipeline",
    description: "Pre-configured GitLab CI/CD pipeline template with built-in security scans, linting, and Docker packaging.",
    category: "DevOps",
    technology: "YAML / Bash",
    version: "1.0.2",
    status: "stable",
    team: "DevOps Team",
    downloads: "10",
    updatedAt: "7 days ago",
    tags: ["devops", "ci-cd", "docker"],
  },
  {
    id: "org-config-sync",
    name: "@org/config-sync",
    description: "Distributed config manager supporting dynamic environment hot-swapping and central vaults integrations.",
    category: "Utilities",
    technology: "TypeScript",
    version: "1.1.1",
    status: "stable",
    team: "Platform Team",
    downloads: "8",
    updatedAt: "1 week ago",
    tags: ["config", "vault", "consul"],
  },
  {
    id: "org-date-utils",
    name: "@org/date-utils",
    description: "Lightweight helper utilities to parse, validate, manipulate, and format ISO dates in JavaScript.",
    category: "Utilities",
    technology: "TypeScript",
    version: "1.2.1",
    status: "stable",
    team: "Frontend Team",
    downloads: "8",
    updatedAt: "1 week ago",
    tags: ["date", "formatting", "timezone"],
  },
  {
    id: "org-form-validator",
    name: "@org/form-validator",
    description: "High-performance reactive form validation utility supporting custom async schemas.",
    category: "Utilities",
    technology: "JavaScript",
    version: "1.0.0",
    status: "deprecated",
    team: "Frontend Team",
    downloads: "8",
    updatedAt: "1 week ago",
    tags: ["forms", "validation", "async"],
  },
  {
    id: "org-theme-provider",
    name: "@org/theme-provider",
    description: "Dynamic theme switching library optimized for server-side rendering and client dark/light theme hydration.",
    category: "UI Components",
    technology: "React",
    version: "1.0.1",
    status: "stable",
    team: "Frontend Team",
    downloads: "8",
    updatedAt: "1 week ago",
    tags: ["theme", "dark-mode", "hydration"],
  },
  {
    id: "org-icon-pack",
    name: "@org/icon-pack",
    description: "Optimized SVG icon library for platform visual accents.",
    category: "UI Components",
    technology: "React",
    version: "1.0.0",
    status: "stable",
    team: "Frontend Team",
    downloads: "8",
    updatedAt: "1 week ago",
    tags: ["icons", "svg", "ui"],
  },
  {
    id: "org-db-connector",
    name: "@org/db-connector",
    description: "Connection pooling wrapper for PostgreSQL and Redis setups.",
    category: "Utilities",
    technology: "Node.js",
    version: "1.0.0",
    status: "stable",
    team: "Backend Team",
    downloads: "8",
    updatedAt: "1 week ago",
    tags: ["database", "postgres", "redis"],
  },
  {
    id: "org-email-sender",
    name: "@org/email-sender",
    description: "SMTP email connector wrapper supporting MJML rendering templates.",
    category: "Utilities",
    technology: "TypeScript",
    version: "1.0.3",
    status: "stable",
    team: "Platform Team",
    downloads: "8",
    updatedAt: "1 week ago",
    tags: ["email", "smtp", "mjml"],
  },
  {
    id: "org-pdf-generator",
    name: "@org/pdf-generator",
    description: "Serverless PDF export wrapper for receipts and logs summaries.",
    category: "Utilities",
    technology: "TypeScript",
    version: "1.0.0",
    status: "stable",
    team: "Platform Team",
    downloads: "8",
    updatedAt: "1 week ago",
    tags: ["pdf", "export", "serverless"],
  },
];

// ─── Stats Card Component ─────────────────────────────────────────────────────
function StatsCards({ modules }) {
  const stats = useMemo(() => {
    const total = 24; // startup-scale total modules count
    const approved = 18; // startup-scale approved count
    const pending = 4; // startup-scale pending reviews count
    const totalDownloads = "186"; // startup-scale total downloads

    return [
      { label: "Total Modules", value: total, icon: Package, color: "text-gold-300 bg-gold-500/10" },
      { label: "Approved Modules", value: approved, icon: CheckCircle2, color: "text-emerald-400 bg-emerald-500/10" },
      { label: "Pending Review", value: pending, icon: AlertTriangle, color: "text-amber-400 bg-amber-500/10" },
      { label: "Total Downloads", value: totalDownloads, icon: Download, color: "text-gold-200 bg-gold-200/10" },
    ];
  }, [modules]);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <div key={i} className="card-hover flex items-center justify-between gap-4 p-5">
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{stat.label}</span>
              <div className="text-2xl font-black text-foreground tabular-nums">{stat.value}</div>
            </div>
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${stat.color}`}>
              <Icon size={20} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Search Bar Component ─────────────────────────────────────────────────────
function SearchBar({ query, setQuery }) {
  return (
    <div className="relative flex-1">
      <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search modules by name, technology, team, or tags..."
        className="pl-10"
      />
    </div>
  );
}

// ─── Filter Panel Component ───────────────────────────────────────────────────
function FilterPanel({
  categories,
  selectedCategory,
  setSelectedCategory,
  technologies,
  selectedTech,
  setSelectedTech,
  teams,
  selectedTeam,
  setSelectedTeam,
  statuses,
  selectedStatus,
  setSelectedStatus,
  sortBy,
  setSortBy,
  onReset,
}) {
  return (
    <div className="grid grid-cols-1 gap-4 rounded-xl border border-border bg-card/40 p-5 md:grid-cols-5">
      {/* Category filter */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Category</label>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full rounded-lg border border-input bg-input px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
        >
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Tech filter */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Technology</label>
        <select
          value={selectedTech}
          onChange={(e) => setSelectedTech(e.target.value)}
          className="w-full rounded-lg border border-input bg-input px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
        >
          <option value="all">All Technologies</option>
          {technologies.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {/* Team filter */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Team</label>
        <select
          value={selectedTeam}
          onChange={(e) => setSelectedTeam(e.target.value)}
          className="w-full rounded-lg border border-input bg-input px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
        >
          <option value="all">All Teams</option>
          {teams.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {/* Status filter */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</label>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="w-full rounded-lg border border-input bg-input px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
        >
          <option value="all">All Statuses</option>
          {statuses.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Sort dropdown */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sort By</label>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="w-full rounded-lg border border-input bg-input px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
        >
          <option value="downloads">Downloads (High to Low)</option>
          <option value="name">Name (A to Z)</option>
          <option value="updated">Recently Updated</option>
        </select>
      </div>
    </div>
  );
}

// ─── Module Card Component ────────────────────────────────────────────────────
function ModuleCard({ item }) {
  const statusBadgeVariant = {
    stable: "stable",
    beta: "beta",
    deprecated: "deprecated",
  };

  return (
    <div className="card-hover flex flex-col justify-between p-6">
      <div>
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-500/10 text-gold-300">
              <Package size={15} />
            </div>
            <div>
              <h3 className="font-mono text-sm font-semibold text-foreground">{item.name}</h3>
              <span className="text-[10px] text-muted-foreground">v{item.version}</span>
            </div>
          </div>
          <Badge variant={statusBadgeVariant[item.status] || "default"}>
            {item.status}
          </Badge>
        </div>

        {/* Description */}
        <p className="mt-4 text-[13px] leading-relaxed text-muted-foreground/90">
          {item.description}
        </p>

        {/* Tags */}
        <div className="mt-4 flex flex-wrap gap-1.5">
          {item.tags.map((tag) => (
            <span key={tag} className="rounded bg-secondary/50 px-1.5 py-0.5 font-mono text-[10px] text-gold-200">
              #{tag}
            </span>
          ))}
        </div>

        {/* Metadata info list */}
        <div className="mt-6 space-y-2 border-t border-border/50 pt-4 text-xs text-muted-foreground">
          <div className="flex justify-between">
            <span>Category</span>
            <span className="font-medium text-foreground">{item.category}</span>
          </div>
          <div className="flex justify-between">
            <span>Technology</span>
            <span className="font-medium text-foreground">{item.technology}</span>
          </div>
          <div className="flex justify-between">
            <span>Owner / Team</span>
            <span className="font-medium text-foreground">{item.team}</span>
          </div>
        </div>
      </div>

      {/* Footer / Actions */}
      <div className="mt-6 border-t border-border/50 pt-4 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
          <Download size={12} className="text-gold-300" />
          <span>{item.downloads} downloads</span>
        </div>
        <div className="flex items-center gap-2">
          <Link to={window.location.pathname.startsWith("/dashboard") ? `/dashboard/modules/${item.id}` : `/modules/${item.id}`}>
            <Button variant="secondary" size="sm" className="h-8 px-3 text-xs gap-1">
              Details
              <ArrowUpRight size={12} />
            </Button>
          </Link>
          <Button variant="primary" size="sm" className="h-8 px-3 text-xs gap-1">
            Download
            <Download size={12} />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page Component ──────────────────────────────────────────────────────
export function ModuleListingPage() {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedTech, setSelectedTech] = useState("all");
  const [selectedTeam, setSelectedTeam] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [sortBy, setSortBy] = useState("downloads");

  // Get distinct filter option values from sample data
  const categories = useMemo(() => Array.from(new Set(sampleModules.map((m) => m.category))), []);
  const technologies = useMemo(() => Array.from(new Set(sampleModules.map((m) => m.technology))), []);
  const teams = useMemo(() => Array.from(new Set(sampleModules.map((m) => m.team))), []);
  const statuses = useMemo(() => Array.from(new Set(sampleModules.map((m) => m.status))), []);

  // Filter modules
  const filteredModules = useMemo(() => {
    return sampleModules
      .filter((m) => {
        const matchesQuery =
          m.name.toLowerCase().includes(query.toLowerCase()) ||
          m.description.toLowerCase().includes(query.toLowerCase()) ||
          m.technology.toLowerCase().includes(query.toLowerCase()) ||
          m.team.toLowerCase().includes(query.toLowerCase()) ||
          m.tags.some((t) => t.toLowerCase().includes(query.toLowerCase()));

        const matchesCategory = selectedCategory === "all" || m.category === selectedCategory;
        const matchesTech = selectedTech === "all" || m.technology === selectedTech;
        const matchesTeam = selectedTeam === "all" || m.team === selectedTeam;
        const matchesStatus = selectedStatus === "all" || m.status === selectedStatus;

        return matchesQuery && matchesCategory && matchesTech && matchesTeam && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === "name") {
          return a.name.localeCompare(b.name);
        }
        if (sortBy === "updated") {
          return a.updatedAt.includes("day") ? -1 : 1;
        }
        // default/downloads
        const parseDownloads = (val) => parseFloat(val.replace("K", "")) * (val.includes("K") ? 1000 : 1);
        return parseDownloads(b.downloads) - parseDownloads(a.downloads);
      });
  }, [query, selectedCategory, selectedTech, selectedTeam, selectedStatus, sortBy]);

  const handleResetFilters = () => {
    setQuery("");
    setSelectedCategory("all");
    setSelectedTech("all");
    setSelectedTeam("all");
    setSelectedStatus("all");
    setSortBy("downloads");
  };

  return (
    <div className="space-y-8 animate-fade-in text-white">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Module Library</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Browse, manage, and consume verified enterprise code modules.
          </p>
        </div>
        <div>
          <Button variant="primary" size="md" className="gap-2">
            <Plus size={16} />
            Publish Module
          </Button>
        </div>
      </div>

      {/* Top statistics row */}
      <StatsCards modules={sampleModules} />

      {/* Search and Filters container */}
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <SearchBar query={query} setQuery={setQuery} />
          {(query || selectedCategory !== "all" || selectedTech !== "all" || selectedTeam !== "all" || selectedStatus !== "all") && (
            <Button variant="secondary" size="md" onClick={handleResetFilters}>
              Reset Filters
            </Button>
          )}
        </div>

        <FilterPanel
          categories={categories}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          technologies={technologies}
          selectedTech={selectedTech}
          setSelectedTech={setSelectedTech}
          teams={teams}
          selectedTeam={selectedTeam}
          setSelectedTeam={setSelectedTeam}
          statuses={statuses}
          selectedStatus={selectedStatus}
          setSelectedStatus={setSelectedStatus}
          sortBy={sortBy}
          setSortBy={setSortBy}
        />
      </div>

      {/* Cards Grid */}
      {filteredModules.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredModules.map((item) => (
            <ModuleCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center gap-4 py-20 text-center rounded-2xl border border-dashed border-border bg-card/10">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-900 border border-neutral-800 text-gold-300">
            <Package size={28} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">No modules matched your search</h3>
            <p className="mt-1 text-sm text-muted-foreground max-w-sm">
              Adjust your search keywords or clear filters to see all active software registry modules.
            </p>
          </div>
          <Button variant="secondary" size="md" onClick={handleResetFilters} className="mt-2">
            Clear Search & Filters
          </Button>
        </div>
      )}
    </div>
  );
}
