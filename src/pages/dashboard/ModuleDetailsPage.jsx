import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  Share2,
  FileText,
  ChevronRight,
  Activity,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  Calendar,
  Layers,
  Users,
  Terminal,
  Clock,
  Copy,
  Check,
  BookOpen,
  Info,
} from "lucide-react";
import { Button, Card, Badge, Separator, Avatar } from "../../components/ui/index";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../components/ui/tabs";

export function ModuleDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [shareSuccess, setShareSuccess] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // Normalize id: remove any org- prefix or @org/ namespace prefix
  const normalizedId = (id || "ui-components")
    .replace(/^org-/, "")
    .replace(/^@org\//, "");

  const modulesLookup = {
    "ui-components": {
      id: "org-ui-components",
      name: "@org/ui-components",
      version: "v1.0.4",
      status: "Stable",
      description: "Accessible and customizable Radix-based UI components matching the enterprise style guide, built for high performance and compatibility.",
      category: "UI Components",
      techStack: "React / Radix UI / Tailwind CSS",
      ownerTeam: "Frontend Team",
      createdDate: "July 20, 2025",
      lastUpdatedDate: "June 10, 2026",
      downloads: "22",
      weeklyDownloads: "4",
      activeTeams: "1 Team",
      adoptionRate: "25%",
      tags: ["react", "ui", "design-system", "radix", "tailwind"],
      dependencies: ["React", "Tailwind CSS", "Radix UI", "Node.js"],
      versionHistory: [
        { version: "v1.0.4", date: "June 11, 2026", notes: "Bug fixes and accessibility improvements" },
        { version: "v1.0.3", date: "May 20, 2026", notes: "Added theme support" },
        { version: "v1.0.2", date: "April 12, 2026", notes: "Initial release" },
      ],
      documentation: {
        overview: "@org/ui-components is the foundational component library for the ModuleLib Platform. It provides accessible, themeable UI blocks modeled on top of Radix UI primitives and styled with utility classes.",
        install: "npm install @org/ui-components",
        usage: `import { Button } from '@org/ui-components'\n\nfunction App() {\n  return (\n    <Button variant="primary">\n      Click Me\n    </Button>\n  )\n}`,
        apiNotes: "All components accept standard Tailwind classNames. Radix slot features are supported via the 'asChild' prop for flexible element rendering."
      }
    },
    "auth-core": {
      id: "org-auth-core",
      name: "@org/auth-core",
      version: "v1.2.0",
      status: "Stable",
      description: "Core authentication and authorization library supporting OpenID Connect, OAuth2 client integration, JSON Web Token (JWT) signatures, and session validation protocols.",
      category: "Authentication",
      techStack: "React / Node.js / TypeScript",
      ownerTeam: "Backend Team",
      createdDate: "May 12, 2025",
      lastUpdatedDate: "June 11, 2026",
      downloads: "32",
      weeklyDownloads: "6",
      activeTeams: "2 Teams",
      adoptionRate: "45%",
      tags: ["authentication", "security", "react", "api", "oauth"],
      dependencies: ["React", "jsonwebtoken", "bcrypt", "Node.js"],
      versionHistory: [
        { version: "v1.2.0", date: "June 11, 2026", notes: "Fixed token expiry race condition and validation leaks." },
        { version: "v1.1.0", date: "May 02, 2026", notes: "Added OpenID Connect discovery endpoint mapping." },
        { version: "v1.0.0", date: "March 15, 2026", notes: "Initial stable release." },
      ],
      documentation: {
        overview: "@org/auth-core provides client and middleware helpers to validate OAuth2 identities, sign JWT tokens, and check route permissions.",
        install: "npm install @org/auth-core",
        usage: `import { AuthProvider } from '@org/auth-core'\n\nfunction SecureApp() {\n  return (\n    <AuthProvider clientSecret={env.SECRET}>\n      <Dashboard />\n    </AuthProvider>\n  );\n}`,
        apiNotes: "Configure environment variables for client key mappings. Middleware requires Express v4+ compatibility."
      }
    },
    "logger-pro": {
      id: "org-logger-pro",
      name: "@org/logger-pro",
      version: "v1.1.0",
      status: "Stable",
      description: "High-performance structured logger with automated log-level management and multi-stream JSON outputs.",
      category: "Utilities",
      techStack: "Node.js / Winston / TypeScript",
      ownerTeam: "DevOps Team",
      createdDate: "October 03, 2025",
      lastUpdatedDate: "June 04, 2026",
      downloads: "18",
      weeklyDownloads: "3",
      activeTeams: "1 Team",
      adoptionRate: "20%",
      tags: ["logging", "observability", "json", "monitoring"],
      dependencies: ["Winston", "Chalk", "Dotenv", "Node.js"],
      versionHistory: [
        { version: "v1.1.0", date: "June 04, 2026", notes: "Added syslog format parsing and trace correlation context." },
        { version: "v1.0.0", date: "February 18, 2026", notes: "Rewritten entirely in TypeScript. Upgraded Winston base." },
      ],
      documentation: {
        overview: "@org/logger-pro aggregates stdout streams and logs structured JSON telemetry directly to third-party monitoring platforms.",
        install: "npm install @org/logger-pro",
        usage: `import { logger } from '@org/logger-pro'\n\nlogger.info('System initiated', { env: 'production' });`,
        apiNotes: "Configure Winston transport adapters inside logger.config.js."
      }
    },
    "analytics-engine": {
      id: "org-analytics-engine",
      name: "@org/analytics-engine",
      version: "v1.1.2",
      status: "Beta",
      description: "Embeddable analytics client dashboard library mapping real-time user metrics, conversion streams, events trackers, and visual charts directly onto DOM canvases.",
      category: "Analytics",
      techStack: "React / Chart.js / Node.js",
      ownerTeam: "Platform Team",
      createdDate: "February 15, 2026",
      lastUpdatedDate: "June 08, 2026",
      downloads: "12",
      weeklyDownloads: "2",
      activeTeams: "1 Team",
      adoptionRate: "15%",
      tags: ["analytics", "react", "charts", "api", "metrics"],
      dependencies: ["React", "Chart.js", "Lodash-es", "Node.js"],
      versionHistory: [
        { version: "v1.1.2", date: "June 08, 2026", notes: "Added dynamic window resizing render cache." },
        { version: "v1.0.0", date: "April 10, 2026", notes: "Added custom metrics pipelines support." },
      ],
      documentation: {
        overview: "@org/analytics-engine embeds reactive chart canvases tracking real-time click streams, page view records, and user session metrics.",
        install: "npm install @org/analytics-engine",
        usage: `import { AnalyticsProvider } from '@org/analytics-engine'\n\n<AnalyticsProvider writeKey="key">...</AnalyticsProvider>`,
        apiNotes: "Telemetric logs are compressed and batched into client-side request queues."
      }
    },
    "config-sync": {
      id: "org-config-sync",
      name: "@org/config-sync",
      version: "v1.1.1",
      status: "Stable",
      description: "A robust data fetching library wrapper supporting automated retries, circuit breaker patterns, request pooling, and custom cache-control mappings.",
      category: "Utilities",
      techStack: "Axios / RxJS / TypeScript",
      ownerTeam: "Platform Team",
      createdDate: "December 15, 2025",
      lastUpdatedDate: "June 07, 2026",
      downloads: "8",
      weeklyDownloads: "1",
      activeTeams: "1 Team",
      adoptionRate: "10%",
      tags: ["config", "api", "axios", "caching", "utilities"],
      dependencies: ["Axios", "RxJS", "LRU-Cache", "Node.js"],
      versionHistory: [
        { version: "v1.1.1", date: "June 07, 2026", notes: "Beta release containing fetch retries and fallback pipelines." },
      ],
      documentation: {
        overview: "@org/config-sync encapsulates standard axios queries inside RxJS streams adding automatic retries, fallbacks, and local memory caches.",
        install: "npm install @org/config-sync",
        usage: `import { createFetcher } from '@org/config-sync'\nconst client = createFetcher({ baseURL: 'https://api.com' });`,
        apiNotes: "Configure custom caching headers to override memory TTL configurations."
      }
    },
    "form-validator": {
      id: "org-form-validator",
      name: "@org/form-validator",
      version: "v1.0.0",
      status: "Deprecated",
      description: "Legacy form validation middleware and hook helpers. Recommended to upgrade to schema-based validator packages like zod.",
      category: "Utilities",
      techStack: "JavaScript / RegExp",
      ownerTeam: "Frontend Team",
      createdDate: "January 11, 2025",
      lastUpdatedDate: "June 04, 2026",
      downloads: "8",
      weeklyDownloads: "1",
      activeTeams: "1 Team",
      adoptionRate: "8%",
      tags: ["validation", "forms", "legacy", "regexp"],
      dependencies: ["Validator", "Lodash", "Node.js"],
      versionHistory: [
        { version: "v1.0.0", date: "June 04, 2026", notes: "Marked as deprecated. Standard security updates." },
      ],
      documentation: {
        overview: "@org/form-validator validates simple string shapes and form inputs using RegEx constraints.",
        install: "npm install @org/form-validator",
        usage: `import { validateForm } from '@org/form-validator'\nconst errors = validateForm({ name: '' }, { name: 'required' });`,
        apiNotes: "This is a legacy dependency. It is recommended to migrate validation layers to Zod schema libraries."
      }
    }
  };

  const moduleData = modulesLookup[normalizedId];
  const isDashboardView = window.location.pathname.startsWith("/dashboard");

  // Scroll to top when dynamic ID route shifts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [normalizedId]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setShareSuccess(true);
    setTimeout(() => setShareSuccess(false), 2000);
  };

  const handleCopyInstall = () => {
    if (!moduleData) return;
    navigator.clipboard.writeText(moduleData.documentation.install);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  // Status Badge styles mapping
  const getStatusBadge = (status) => {
    const map = {
      Stable: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      Beta: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      Deprecated: "bg-red-500/10 text-red-400 border-red-500/20",
    };
    return (
      <span className={`rounded-md border px-2.5 py-0.5 text-xs font-semibold ${map[status] || "bg-secondary text-muted-foreground border-border"}`}>
        {status}
      </span>
    );
  };

  // Professional "Module Not Found" Page boundary if requested ID is invalid
  if (!moduleData) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-card/15 border border-border/40 rounded-xl space-y-4 text-center max-w-xl mx-auto my-12 animate-fade-in text-white">
        <div className="h-14 w-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
          <AlertTriangle size={28} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">Module Not Found</h2>
          <p className="text-xs text-muted-foreground mt-2 px-6 leading-relaxed">
            The requested module namespace <code className="text-gold-200 bg-secondary px-1.5 py-0.5 rounded font-mono">@{normalizedId}</code> (or ID <code className="text-gold-200 bg-secondary px-1.5 py-0.5 rounded font-mono">{id}</code>) could not be resolved in the ModuleLib registry catalog.
          </p>
        </div>
        <Button
          onClick={() => navigate(isDashboardView ? "/dashboard/modules" : "/modules")}
          variant="primary"
          size="sm"
          className="text-xs gap-1.5 font-bold shadow-[0_2px_10px_rgba(212,166,79,0.15)]"
        >
          <ArrowLeft size={13} />
          Back to Modules Registry
        </Button>
      </div>
    );
  }

  // Related modules catalog mapping (Show 3 related modules, excluding current one)
  const relatedModulesList = Object.values(modulesLookup)
    .filter((mod) => mod.id !== moduleData.id)
    .slice(0, 3);

  return (
    <div className="space-y-6 animate-fade-in text-white pb-10">
      
      {/* Top Breadcrumb & Back buttons toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {isDashboardView ? (
            <>
              <Link to="/dashboard" className="hover:text-gold-200 transition-colors">Dashboard</Link>
              <ChevronRight size={11} />
              <Link to="/dashboard/modules" className="hover:text-gold-200 transition-colors">Modules</Link>
            </>
          ) : (
            <>
              <Link to="/" className="hover:text-gold-200 transition-colors">Home</Link>
              <ChevronRight size={11} />
              <Link to="/modules" className="hover:text-gold-200 transition-colors">Registry</Link>
            </>
          )}
          <ChevronRight size={11} />
          <span className="text-gold-300 font-mono">{normalizedId}</span>
        </nav>

        {/* Back to Modules button */}
        <Button
          onClick={() => navigate(isDashboardView ? "/dashboard/modules" : "/modules")}
          variant="secondary"
          size="sm"
          className="h-8 px-3 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={13} />
          Back to Modules
        </Button>
      </div>

      {/* 1. Header Section */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between border-b border-border/60 pb-6">
        <div className="space-y-2 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-bold font-mono sm:text-3xl text-foreground">
              {moduleData.name}
            </h1>
            <span className="rounded-md border border-border bg-secondary/80 px-2 py-0.5 text-xs text-gold-300 font-mono">
              {moduleData.version}
            </span>
            {getStatusBadge(moduleData.status)}
            <Badge variant="primary" className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs">
              Approved
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground/90 leading-relaxed max-w-3xl">
            {moduleData.description}
          </p>
        </div>

        {/* Header Action buttons */}
        <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0">
          <Button variant="primary" size="sm" className="gap-1.5 h-9 px-4.5 text-xs font-bold shadow-[0_2px_10px_rgba(212,166,79,0.15)]">
            <Download size={14} />
            Download Module
          </Button>

          <Button onClick={() => alert(`Edit configuration flow for: ${moduleData.name}`)} variant="secondary" size="sm" className="gap-1.5 h-9 px-3.5 text-xs">
            Edit Module
          </Button>

          <Button onClick={handleCopyInstall} variant="secondary" size="sm" className="gap-1.5 h-9 px-3.5 text-xs">
            {copySuccess ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
            {copySuccess ? "Copied!" : "Copy Install"}
          </Button>

          <Button onClick={handleShare} variant="secondary" size="sm" className="gap-1.5 h-9 px-3 text-xs">
            {shareSuccess ? <Check size={13} className="text-emerald-400" /> : <Share2 size={13} />}
            {shareSuccess ? "Link Copied!" : "Share"}
          </Button>
        </div>
      </div>

      {/* 7. Analytics Section (Dashboard Stats cards) */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Total Downloads", value: moduleData.downloads, icon: Download, color: "text-gold-300 bg-gold-500/10 border-gold-500/10" },
          { label: "Weekly Downloads", value: moduleData.weeklyDownloads, icon: Activity, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/10" },
          { label: "Active Teams Using Module", value: moduleData.activeTeams, icon: Users, color: "text-amber-400 bg-amber-500/10 border-amber-500/10" },
          { label: "Latest Version Adoption %", value: moduleData.adoptionRate, icon: Layers, color: "text-gold-200 bg-gold-200/10 border-gold-200/10" },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className={`card border flex items-center justify-between p-4 bg-card/60 ${stat.color}`}>
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{stat.label}</span>
                <div className="text-xl font-black text-foreground font-mono">{stat.value}</div>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-background/50 border border-border/40 text-gold-300">
                <Icon size={16} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Two-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Details Panel (Left Column) - Tabs based */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="w-full justify-start border-b border-white/[0.06] bg-transparent">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="documentation">Documentation</TabsTrigger>
              <TabsTrigger value="versions">Versions</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            {/* OVERVIEW TAB */}
            <TabsContent value="overview" className="space-y-6">
              <Card className="p-6 bg-card/40 border border-border space-y-4">
                <h3 className="text-sm font-bold text-foreground">Overview & Description</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {moduleData.description}
                </p>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/[0.04] text-xs">
                  <div>
                    <span className="text-muted-foreground/60 block">Category:</span>
                    <span className="font-semibold text-foreground">{moduleData.category}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground/60 block">Adoption Rate:</span>
                    <span className="font-semibold text-foreground">{moduleData.adoptionRate}</span>
                  </div>
                </div>
              </Card>

              {/* Install CLI instruction card */}
              <Card className="p-6 bg-card/45 border border-border space-y-3">
                <h3 className="text-xs font-bold text-foreground">Quick Installation</h3>
                <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background p-4 font-mono text-xs text-gold-300">
                  <span>{moduleData.documentation.install}</span>
                  <button onClick={handleCopyInstall} className="p-1.5 rounded border border-border/80 hover:bg-card hover:text-foreground text-muted-foreground transition-all">
                    {copySuccess ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  </button>
                </div>
              </Card>
            </TabsContent>

            {/* DOCUMENTATION TAB */}
            <TabsContent value="documentation" className="space-y-6">
              <Card className="p-6 bg-card/40 border border-border space-y-6">
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-foreground">Usage Example</h3>
                  <pre className="rounded-lg border border-border bg-background p-4 font-mono text-xs text-foreground overflow-x-auto leading-relaxed">
                    <code>{moduleData.documentation.usage}</code>
                  </pre>
                </div>
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-foreground">API Integration Notes</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {moduleData.documentation.apiNotes}
                  </p>
                </div>
              </Card>
            </TabsContent>

            {/* VERSIONS TAB */}
            <TabsContent value="versions" className="space-y-6">
              <Card className="p-6 bg-card/40 border border-border">
                <div className="relative border-l border-border/60 pl-5 space-y-6">
                  {moduleData.versionHistory.map((ver, idx) => (
                    <div key={idx} className="relative">
                      <span className="absolute -left-[26px] top-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-card border border-gold-500/60">
                        <span className="h-1.5 w-1.5 rounded-full bg-gold-300" />
                      </span>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-gold-200">
                            {ver.version}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            ({ver.date})
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">{ver.notes}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>

            {/* SECURITY TAB */}
            <TabsContent value="security" className="space-y-6">
              <Card className="p-6 bg-card/40 border border-border space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.04]">
                  <h3 className="text-sm font-semibold text-foreground">Security & Vulnerability Analysis</h3>
                  <Badge variant="stable">Passed</Badge>
                </div>
                <div className="text-xs text-muted-foreground leading-relaxed space-y-2.5">
                  <p>✓ Automated scanner verified package codebase signature.</p>
                  <p>✓ 0 critical vulnerabilities resolved in dependencies graph.</p>
                  <p>✓ License compliance: 100% MIT/Apache compliant. Staged for internal distribution.</p>
                </div>
              </Card>
            </TabsContent>

            {/* ACTIVITY TAB */}
            <TabsContent value="activity" className="space-y-6">
              <Card className="p-6 bg-card/40 border border-border space-y-4">
                <h3 className="text-sm font-semibold text-foreground">Module Changelog & Events</h3>
                <div className="space-y-4">
                  <div className="text-xs flex gap-2.5 items-start">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                    <div>
                      <p className="text-foreground font-semibold">Version {moduleData.version} Approved</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Approved by Identity Security Auditor · 1 day ago</p>
                    </div>
                  </div>
                  <div className="text-xs flex gap-2.5 items-start">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-gold-400 flex-shrink-0" />
                    <div>
                      <p className="text-foreground font-semibold">Package Uploaded</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Uploaded via CLI runner by {moduleData.ownerTeam} · 2 days ago</p>
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar Panel (Right Column) */}
        <div className="space-y-6">
          
          {/* 2. Module Information Card */}
          <Card className="p-6 bg-card/40 border border-border space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-[#D4A64F] flex items-center gap-2">
              <Info size={14} />
              Module Information
            </h2>
            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between border-b border-border/20 pb-2">
                <span className="text-muted-foreground">Module Name</span>
                <span className="font-semibold text-foreground font-mono">{moduleData.name}</span>
              </div>
              <div className="flex justify-between border-b border-border/20 pb-2">
                <span className="text-muted-foreground">Category</span>
                <span className="font-semibold text-foreground">{moduleData.category}</span>
              </div>
              <div className="flex justify-between border-b border-border/20 pb-2">
                <span className="text-muted-foreground">Technology Stack</span>
                <span className="font-semibold text-foreground">{moduleData.techStack}</span>
              </div>
              <div className="flex justify-between border-b border-border/20 pb-2">
                <span className="text-muted-foreground">Owner Team</span>
                <span className="font-semibold text-foreground">{moduleData.ownerTeam}</span>
              </div>
              <div className="flex justify-between border-b border-border/20 pb-2">
                <span className="text-muted-foreground">Created Date</span>
                <span className="font-semibold text-foreground font-mono">{moduleData.createdDate}</span>
              </div>
              <div className="flex justify-between border-b border-border/20 pb-2">
                <span className="text-muted-foreground">Last Updated Date</span>
                <span className="font-semibold text-foreground font-mono">{moduleData.lastUpdatedDate}</span>
              </div>
              <div className="flex justify-between border-b border-border/20 pb-2">
                <span className="text-muted-foreground">Total Downloads</span>
                <span className="font-bold text-gold-300 font-mono">{moduleData.downloads}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current Version</span>
                <span className="font-semibold text-foreground font-mono">{moduleData.version}</span>
              </div>
            </div>
          </Card>

          {/* 3. Tags Section */}
          <Card className="p-6 bg-card/40 border border-border">
            <h2 className="text-sm font-bold uppercase tracking-widest text-[#D4A64F] mb-4 flex items-center gap-2">
              <Layers size={14} />
              Tags
            </h2>
            <div className="flex flex-wrap gap-2">
              {moduleData.tags.map((tag) => (
                <span key={tag} className="rounded-md border border-border/60 bg-secondary/40 px-2 py-0.5 text-xs text-gold-300 font-mono">
                  #{tag}
                </span>
              ))}
            </div>
          </Card>

          {/* 5. Dependencies Section */}
          <Card className="p-6 bg-card/40 border border-border">
            <h2 className="text-sm font-bold uppercase tracking-widest text-[#D4A64F] mb-4 flex items-center gap-2">
              <ShieldCheck size={14} />
              Dependencies
            </h2>
            <div className="flex flex-wrap gap-2">
              {moduleData.dependencies.map((dep) => (
                <div key={dep} className="rounded-md border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm hover:border-gold-500/25 transition-all">
                  {dep}
                </div>
              ))}
            </div>
          </Card>

        </div>

      </div>

      {/* 8. Related Modules Section */}
      <div className="pt-6 border-t border-border/50">
        <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">
          Related Modules
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {relatedModulesList.map((relMod) => (
            <Card key={relMod.id} className="p-4 bg-card/30 border border-border hover:border-gold-500/25 hover:bg-card/45 transition-all flex flex-col justify-between h-32">
              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h4 className="text-xs font-mono font-bold text-foreground truncate">{relMod.name}</h4>
                  <span className="text-[10px] text-muted-foreground/80 font-mono">{relMod.version}</span>
                </div>
                <p className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed">
                  {relMod.description}
                </p>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-border/20 mt-2">
                {getStatusBadge(relMod.status)}
                {/* Clicking Details button re-routes to details view */}
                <Link to={isDashboardView ? `/dashboard/modules/${relMod.id}` : `/modules/${relMod.id}`}>
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-[10px] text-gold-300 hover:text-gold-200 flex items-center gap-0.5">
                    Details
                    <ArrowUpRight size={10} />
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </div>

    </div>
  );
}
