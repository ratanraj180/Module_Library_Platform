import { useState, useEffect, useRef } from "react";

import { Link } from "react-router-dom";
import {
  Package,
  Download,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Plus,
  FileSearch,
  BookOpen,
  Layers,
  Users,
  GitBranch,
  Shield,
  Rocket,
  TrendingUp,
  Activity,
  AlertTriangle,
  Server,
  Cpu,
  HardDrive,
  Eye,
  ExternalLink,
  ChevronRight,
  CheckSquare,
  User,
  BarChart3,
} from "lucide-react";
import { Badge } from "../../components/ui/index";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../components/ui/tabs";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../../components/ui/table";
import { Progress } from "../../components/ui/progress";
import { Skeleton, SkeletonCard, SkeletonTable } from "../../components/ui/skeleton";
import { useAuth } from "../../hooks/useAuth";
import { cn } from "../../lib/utils";
import {
  dashboardStats,
  recentActivity,
  pendingApprovals,
  recentlyPublished,
  teamContributions,
  moduleGrowthData,
  technologyDistribution,
  securityAlerts,
  platformHealth,
} from "../../data/dashboardData";

// ─── Icon map ────────────────────────────────────────────────────────────────
const iconMap = {
  Package, Download, CheckCircle2, Clock, Rocket, Users, GitBranch, Shield, AlertTriangle,
};

// ─── Activity type styling ──────────────────────────────────────────────────
const activityStyles = {
  published: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" },
  approved:  { bg: "bg-blue-500/10",    text: "text-blue-400",    border: "border-blue-500/20" },
  updated:   { bg: "bg-amber-500/10",   text: "text-amber-400",   border: "border-amber-500/20" },
  team:      { bg: "bg-purple-500/10",  text: "text-purple-400",  border: "border-purple-500/20" },
  security:  { bg: "bg-red-500/10",     text: "text-red-400",     border: "border-red-500/20" },
};

const priorityStyles = {
  high:   "bg-red-500/10 text-red-400 ring-red-500/20",
  medium: "bg-amber-500/10 text-amber-400 ring-amber-500/20",
  low:    "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20",
};

function StatCard({ stat, index }) {
  const Icon = typeof stat.icon === "string" ? (iconMap[stat.icon] || Package) : (stat.icon || Package);

  return (
    <div className="relative overflow-hidden rounded-lg border border-zinc-200 bg-white p-4 shadow-sm hover:scale-[1.02] transition-transform duration-200">
      {/* Top row */}
      <div className="flex items-center justify-between mb-3">
        <div className={cn(
          "flex h-8 w-8 items-center justify-center rounded-md",
          stat.trend === "up" ? "bg-emerald-50 text-emerald-600" :
          stat.trend === "neutral" ? "bg-amber-50 text-[#D4A017]" :
          "bg-gray-50 text-gray-400"
        )}>
          <Icon size={15} strokeWidth={1.8} />
        </div>
        {stat.sparkline && (
          <svg viewBox="0 0 80 24" className="h-6 w-20 text-[#D4A017]/40" fill="none">
            <polyline
              points={stat.sparkline.map((v, i) => `${(i / (stat.sparkline.length - 1)) * 80},${24 - (v / Math.max(...stat.sparkline)) * 20}`).join(" ")}
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>

      {/* Value */}
      <div className="text-2xl font-semibold text-[#111827] tabular-nums tracking-tight leading-none">
        {stat.value}
      </div>

      {/* Label + trend */}
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-gray-500">{stat.label}</span>
        <span className={cn(
          "inline-flex items-center gap-0.5 text-[11px] font-medium tabular-nums",
          stat.trend === "up" ? "text-emerald-600" :
          stat.trend === "neutral" ? "text-[#D4A017]" : "text-gray-500"
        )}>
          {stat.trend === "up" && <TrendingUp size={10} />}
          {stat.change}
        </span>
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ACTIVITY ITEM — timeline style
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function ActivityItem({ item, isLast }) {
  const style = activityStyles[item.type] || activityStyles.published;
  const Icon = iconMap[item.icon] || Activity;

  return (
    <div className="relative flex gap-3 pb-5 last:pb-0">
      {!isLast && (
        <div className="absolute left-[13px] top-8 bottom-0 w-px bg-white/[0.04]" />
      )}
      <div className={cn(
        "relative z-10 mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border",
        style.bg, style.border
      )}>
        <Icon size={12} className={style.text} />
      </div>
      <div className="flex-1 min-w-0 pt-0.5">
        <p className="text-[13px] text-foreground/90 leading-snug">{item.title}</p>
        <p className="text-[11px] text-muted-foreground/50 mt-0.5 truncate">{item.description}</p>
        <div className="flex items-center gap-1.5 mt-1">
          <span className="text-[10px] text-muted-foreground/40">{item.time}</span>
          <span className="text-[10px] text-muted-foreground/20">·</span>
          <span className="text-[10px] text-muted-foreground/40">{item.user}</span>
        </div>
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// BAR CHART — enhanced with gradient
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function BarChart({ data, height = 140 }) {
  const max = Math.max(...data.map((d) => d.count));
  return (
    <div className="flex items-end gap-[3px]" style={{ height }}>
      {data.map((d, i) => {
        const h = (d.count / max) * 100;
        const isLast = i === data.length - 1;
        return (
          <div key={d.month} className="flex flex-1 flex-col items-center gap-1.5">
            <div className="w-full relative group cursor-default">
              <div
                className={cn(
                  "w-full rounded-[3px] transition-all duration-200",
                  isLast ? "bg-gold-500/50" : "bg-white/[0.06] group-hover:bg-white/[0.10]"
                )}
                style={{ height: `${(h / 100) * height * 0.85}px`, minHeight: 3 }}
              />
              <div className="absolute -top-7 left-1/2 -translate-x-1/2 hidden group-hover:flex items-center bg-popover border border-white/[0.08] rounded px-1.5 py-0.5 text-[10px] text-foreground whitespace-nowrap z-10 shadow-xl">
                {d.count}
              </div>
            </div>
            <span className="text-[9px] text-muted-foreground/40 tabular-nums font-medium">
              {d.month.slice(0, 3)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TECH DISTRIBUTION — donut + bars
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function TechDistribution({ data }) {
  // Build a CSS conic-gradient for the donut
  let cumulative = 0;
  const gradientStops = data.map((t) => {
    const start = cumulative;
    cumulative += t.percentage;
    return `${t.color} ${start}% ${cumulative}%`;
  }).join(", ");

  return (
    <div className="flex gap-6 items-start">
      {/* Donut */}
      <div className="flex-shrink-0 relative w-[90px] h-[90px]">
        <div
          className="w-full h-full rounded-full"
          style={{
            background: `conic-gradient(${gradientStops})`,
            mask: "radial-gradient(farthest-side, transparent 60%, black 61%)",
            WebkitMask: "radial-gradient(farthest-side, transparent 60%, black 61%)",
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-semibold text-foreground tabular-nums">7</span>
        </div>
      </div>
      {/* Legend */}
      <div className="flex-1 space-y-1.5 min-w-0">
        {data.slice(0, 5).map((tech) => (
          <div key={tech.name} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: tech.color }} />
              <span className="text-[11px] text-muted-foreground truncate">{tech.name}</span>
            </div>
            <span className="text-[11px] text-muted-foreground/50 tabular-nums flex-shrink-0">{tech.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SECTION CARD WRAPPER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function SectionCard({ children, className }) {
  return (
    <div className={cn("rounded-lg border border-white/[0.06] bg-white/[0.015] overflow-hidden", className)}>
      {children}
    </div>
  );
}

function SectionHeader({ icon: Icon, title, count, actionLabel, actionHref, extra }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.04]">
      <div className="flex items-center gap-2">
        {Icon && <Icon size={14} className="text-muted-foreground/60" strokeWidth={1.8} />}
        <h3 className="text-[13px] font-medium text-foreground/90">{title}</h3>
        {count !== undefined && (
          <span className="rounded-full bg-white/[0.04] px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground/60 tabular-nums">
            {count}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        {extra}
        {actionHref && (
          <Link
            to={actionHref}
            className="flex items-center gap-1 text-[11px] text-muted-foreground/50 hover:text-muted-foreground transition-colors"
          >
            {actionLabel || "View all"}
            <ArrowUpRight size={10} />
          </Link>
        )}
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PLATFORM HEALTH WIDGET
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function PlatformHealthWidget({ data }) {
  const healthIcons = { "Registry API": Server, "Build Pipeline": Cpu, "CDN Storage": HardDrive, "Auth Service": Shield };

  return (
    <div className="space-y-2.5 px-4 py-3">
      {data.map((svc) => {
        const SvcIcon = healthIcons[svc.name] || Server;
        return (
          <div key={svc.name} className="flex items-center gap-3">
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-white/[0.03]">
              <SvcIcon size={13} className="text-muted-foreground/60" strokeWidth={1.8} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-foreground/80">{svc.name}</span>
                <span className={cn(
                  "text-[10px] font-medium tabular-nums",
                  svc.uptime >= 99.9 ? "text-emerald-400" : svc.uptime >= 99 ? "text-amber-400" : "text-red-400"
                )}>
                  {svc.uptime}%
                </span>
              </div>
              <div className="h-1 w-full rounded-full bg-white/[0.04] overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    svc.uptime >= 99.9 ? "bg-emerald-500/50" : svc.uptime >= 99 ? "bg-amber-500/50" : "bg-red-500/50"
                  )}
                  style={{ width: `${svc.uptime}%` }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SECURITY ALERTS WIDGET
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function SecurityAlertsWidget({ alerts }) {
  return (
    <div className="px-4 py-3 space-y-2">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className={cn(
            "flex items-start gap-2.5 rounded-md border px-3 py-2",
            alert.severity === "critical" ? "border-red-500/15 bg-red-500/[0.03]" :
            alert.severity === "warning" ? "border-amber-500/15 bg-amber-500/[0.03]" :
            "border-white/[0.04] bg-white/[0.01]"
          )}
        >
          <AlertTriangle size={13} className={cn(
            "mt-0.5 flex-shrink-0",
            alert.severity === "critical" ? "text-red-400" :
            alert.severity === "warning" ? "text-amber-400" : "text-blue-400"
          )} />
          <div className="min-w-0 flex-1">
            <p className="text-xs text-foreground/80 leading-snug">{alert.title}</p>
            <p className="text-[10px] text-muted-foreground/40 mt-0.5">{alert.module} · {alert.time}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MAIN DASHBOARD COMPONENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export function DashboardHome() {
  const { user } = useAuth();
  const isAdmin = user?.role === "Administrator";
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  // ── Loading skeleton ──
  if (loading) {
    return (
      <div className="space-y-5 animate-fade-in max-w-[1400px]">
        <div>
          <Skeleton className="h-6 w-48 rounded" />
          <Skeleton className="h-3.5 w-72 rounded mt-2" />
        </div>
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-5">
          <div className="lg:col-span-3 rounded-lg border border-white/[0.06] bg-white/[0.02]">
            <SkeletonTable rows={4} cols={4} />
          </div>
          <div className="lg:col-span-2 rounded-lg border border-white/[0.06] bg-white/[0.02] p-4 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-7 w-7 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-full rounded" />
                  <Skeleton className="h-2.5 w-2/3 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-5 animate-fade-in max-w-[1400px]">

      {/* ═══════════════════════════════════════════════════════════════════
         HEADER
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground tracking-tight sm:text-xl">
            {greeting}, {user?.name?.split(" ")[0] || "Developer"}
          </h1>
          <p className="text-[13px] text-muted-foreground/60 mt-0.5">
            Here's what's happening across the platform today.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-md border border-white/[0.06] bg-white/[0.02] px-2.5 py-1 text-[11px] text-muted-foreground/60">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </span>
            All systems operational
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
         STATS ROW
      ═══════════════════════════════════════════════════════════════════ */}
      {isAdmin ? (
        /* Admin Grid (5 Columns) */
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
          {[
            { label: "Pending Reviews", value: "4", icon: Clock, trend: "neutral", change: "2 urgent", sparkline: [2, 3, 1, 4, 2, 3, 4, 4, 3, 2, 4, 4] },
            { label: "Approved Modules", value: "18", icon: CheckCircle2, trend: "up", change: "+2 this week", sparkline: [8, 10, 12, 14, 15, 16, 16, 17, 18, 18, 18, 18] },
            { label: "Rejected Modules", value: "2", icon: AlertTriangle, trend: "neutral", change: "0 this month", sparkline: [0, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2] },
            { label: "Active Teams", value: "4 Teams", icon: Users, trend: "neutral", change: "0 new teams", sparkline: [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4] },
            { label: "Security Warnings", value: "1 Warning", icon: Shield, trend: "neutral", change: "0 critical", sparkline: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1] },
          ].map((stat, i) => (
            <StatCard key={stat.label} stat={stat} index={i} />
          ))}
        </div>
      ) : (
        /* Developer Grid (4 Columns) */
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {[
            { label: "Total Modules", value: "24", icon: Package, trend: "up", change: "+4 since launch", sparkline: [10, 12, 14, 16, 18, 20, 21, 22, 24, 24, 24, 24] },
            { label: "Downloads This Month", value: "186", icon: Download, trend: "up", change: "+12% growth", sparkline: [25, 48, 72, 95, 128, 150, 162, 170, 186, 186, 186, 186] },
            { label: "Active Contributors", value: "12", icon: Users, trend: "up", change: "+2 this week", sparkline: [6, 7, 8, 9, 10, 10, 11, 11, 12, 12, 12, 12] },
            { label: "Issues Resolved / SLA", value: "92%", icon: CheckCircle2, trend: "up", change: "+0.5%", sparkline: [88, 89, 89.5, 90, 90.5, 91, 91.2, 91.5, 92, 92, 92, 92] },
          ].map((stat, i) => (
            <StatCard key={stat.label} stat={stat} index={i} />
          ))}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
         QUICK ACTIONS
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-wrap gap-1.5">
        {isAdmin ? (
          /* Admin Actions */
          [
            { icon: CheckSquare, label: "Review Queue", href: "/dashboard/reviews" },
            { icon: Users, label: "User Management", href: "#", onClick: () => alert("User Management console simulation") },
            { icon: Users, label: "Team Management", href: "/dashboard/teams" },
            { icon: Shield, label: "Security Center", href: "/dashboard/security" },
            { icon: BarChart3, label: "Analytics Center", href: "/dashboard/analytics" },
            { icon: GitBranch, label: "Pipeline Monitoring", href: "/dashboard/pipelines" },
          ].map((action) => (
            action.onClick ? (
              <button
                key={action.label}
                onClick={action.onClick}
                className="inline-flex items-center gap-1.5 rounded-md border border-white/[0.06] bg-white/[0.02] px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground/70 transition-all hover:text-foreground/80 hover:bg-white/[0.04] hover:border-white/[0.10]"
              >
                <action.icon size={12} strokeWidth={1.8} />
                {action.label}
              </button>
            ) : (
              <Link
                key={action.label}
                to={action.href}
                className="inline-flex items-center gap-1.5 rounded-md border border-white/[0.06] bg-white/[0.02] px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground/70 transition-all hover:text-foreground/80 hover:bg-white/[0.04] hover:border-white/[0.10]"
              >
                <action.icon size={12} strokeWidth={1.8} />
                {action.label}
              </Link>
            )
          ))
        ) : (
          /* Developer Actions */
          [
            { icon: Package, label: "Browse Modules", href: "/dashboard/modules" },
            { icon: Plus, label: "Publish Module", href: "/dashboard/publish" },
            { icon: BookOpen, label: "Documentation", href: "/documentation" },
            { icon: User, label: "User Profile", href: "/dashboard/profile" },
          ].map((action) => (
            <Link
              key={action.label}
              to={action.href}
              className="inline-flex items-center gap-1.5 rounded-md border border-white/[0.06] bg-white/[0.02] px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground/70 transition-all hover:text-foreground/80 hover:bg-white/[0.04] hover:border-white/[0.10]"
            >
              <action.icon size={12} strokeWidth={1.8} />
              {action.label}
            </Link>
          ))
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
         ROW 1: Pending Reviews (3/5) + Activity Feed (2/5)
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-5">
        {/* Pending Reviews */}
        <SectionCard className="lg:col-span-3">
          <SectionHeader
            icon={Clock}
            title="Pending Reviews"
            count={pendingApprovals.length}
            actionLabel="Review all"
            actionHref={isAdmin ? "/dashboard/reviews" : "/dashboard/modules"}
          />
          <Table>
            <TableHeader>
              <TableRow className="border-b border-white/[0.04] hover:bg-transparent">
                <TableHead>Module</TableHead>
                <TableHead className="hidden sm:table-cell">Team</TableHead>
                <TableHead className="hidden md:table-cell">Submitted</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead className="text-right pr-4">Progress</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingApprovals.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded bg-white/[0.04]">
                        <Package size={11} className="text-muted-foreground/50" strokeWidth={1.8} />
                      </div>
                      <div className="min-w-0">
                        <Link
                          to={`/dashboard/modules/${item.name.replace("@org/", "")}`}
                          className="text-[12px] font-medium text-foreground/80 hover:text-gold-300 transition-colors font-mono"
                        >
                          {item.name}
                        </Link>
                        <p className="text-[10px] text-muted-foreground/40">v{item.version}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <span className="text-[11px] text-muted-foreground/60">{item.team}</span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className="text-[11px] text-muted-foreground/40">{item.submittedAt}</span>
                  </TableCell>
                  <TableCell>
                    <span className={cn(
                      "inline-flex items-center rounded-full px-1.5 py-[1px] text-[10px] font-medium ring-1 ring-inset",
                      priorityStyles[item.priority]
                    )}>
                      {item.priority}
                    </span>
                  </TableCell>
                  <TableCell className="text-right pr-4">
                    <div className="inline-flex items-center gap-1.5">
                      <div className="h-1 w-8 rounded-full bg-white/[0.04] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gold-500/40"
                          style={{ width: `${(item.reviewers / 2) * 100}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground/40 tabular-nums">{item.reviewers}/2</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </SectionCard>

        {/* Activity Feed */}
        <SectionCard className="lg:col-span-2">
          <SectionHeader icon={Activity} title="Recent Activity" />
          <div className="p-4">
            {recentActivity.slice(0, 5).map((item, i) => (
              <ActivityItem key={item.id} item={item} isLast={i === 4} />
            ))}
          </div>
        </SectionCard>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
         ROW 2: Recently Published Modules
      ═══════════════════════════════════════════════════════════════════ */}
      <SectionCard>
        <SectionHeader
          icon={Layers}
          title="Recently Published"
          count={recentlyPublished.length}
          actionLabel="All modules"
          actionHref="/dashboard/modules"
        />
        <Table>
          <TableHeader>
            <TableRow className="border-b border-white/[0.04] hover:bg-transparent">
              <TableHead>Module</TableHead>
              <TableHead className="hidden sm:table-cell">Technology</TableHead>
              <TableHead className="hidden md:table-cell">Team</TableHead>
              <TableHead>Version</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden lg:table-cell text-right pr-4">Downloads</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentlyPublished.map((mod) => (
              <TableRow key={mod.id}>
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded bg-white/[0.04]">
                      <Package size={11} className="text-muted-foreground/50" strokeWidth={1.8} />
                    </div>
                    <div>
                      <Link
                        to={`/dashboard/modules/${mod.name}`}
                        className="text-[12px] font-medium text-foreground/80 hover:text-gold-300 transition-colors font-mono"
                      >
                        {mod.name}
                      </Link>
                      <p className="text-[10px] text-muted-foreground/40 sm:hidden">{mod.technology}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <span className="inline-flex items-center rounded bg-white/[0.04] px-1.5 py-[1px] text-[10px] text-muted-foreground/60 font-mono">
                    {mod.technology}
                  </span>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <span className="text-[11px] text-muted-foreground/60">{mod.team}</span>
                </TableCell>
                <TableCell>
                  <code className="text-[11px] text-muted-foreground/50 font-mono">v{mod.version}</code>
                </TableCell>
                <TableCell>
                  <Badge variant={mod.status === "stable" ? "stable" : mod.status === "beta" ? "beta" : "deprecated"}>
                    {mod.status}
                  </Badge>
                </TableCell>
                <TableCell className="hidden lg:table-cell text-right pr-4">
                  <span className="text-[11px] text-muted-foreground/50 tabular-nums">{mod.downloads}</span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SectionCard>

      {/* ═══════════════════════════════════════════════════════════════════
         ROW 3: Team Contributions (1/2) + Analytics (1/2)
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {/* Team Contributions */}
        <SectionCard>
          <SectionHeader
            icon={Users}
            title="Team Contributions"
            actionLabel="Manage"
            actionHref="/dashboard/teams"
          />
          <div className="p-4 space-y-3.5">
            {teamContributions.map((team) => (
              <div key={team.id} className="flex items-center gap-3">
                <div className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-md text-[10px] font-bold text-white bg-gradient-to-br flex-shrink-0",
                  team.color
                )}>
                  {team.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[13px] font-medium text-foreground/80">{team.name}</span>
                    <span className="text-[11px] text-muted-foreground/50 tabular-nums">{team.modulesOwned} modules</span>
                  </div>
                  <div className="h-1 w-full rounded-full bg-white/[0.04] overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all duration-700")}
                      style={{
                        width: `${(team.modulesOwned / 24) * 100}%`,
                        background: `linear-gradient(90deg, ${
                          team.id === 1 ? "#3b82f6, #60a5fa" :
                          team.id === 2 ? "#10b981, #34d399" :
                          team.id === 3 ? "#f59e0b, #fbbf24" :
                          "#8b5cf6, #a78bfa"
                        })`
                      }}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground/30 mt-1 truncate">
                    {team.activeMembers} members · {team.lead}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Analytics */}
        <SectionCard>
          <Tabs defaultValue="growth">
            <SectionHeader
              icon={Activity}
              title="Analytics"
              extra={
                <TabsList className="border-0 gap-0">
                  <TabsTrigger value="growth" className="text-[11px] px-2 py-1">Growth</TabsTrigger>
                  <TabsTrigger value="tech" className="text-[11px] px-2 py-1">Stack</TabsTrigger>
                </TabsList>
              }
            />

            <TabsContent value="growth" className="mt-0 p-4">
              <div className="flex items-baseline justify-between mb-4">
                <div>
                  <p className="text-[11px] text-muted-foreground/50 uppercase tracking-wider font-medium">Modules Published</p>
                  <p className="text-xl font-semibold text-foreground tabular-nums mt-0.5">
                    24
                    <span className="text-[11px] font-normal text-emerald-400 ml-1.5">+12%</span>
                  </p>
                </div>
                <span className="text-[10px] text-muted-foreground/30">12 months</span>
              </div>
              <BarChart data={moduleGrowthData} height={130} />
            </TabsContent>

            <TabsContent value="tech" className="mt-0 p-4">
              <div className="mb-4">
                <p className="text-[11px] text-muted-foreground/50 uppercase tracking-wider font-medium">Technology Distribution</p>
                <p className="text-xl font-semibold text-foreground tabular-nums mt-0.5">
                  24
                  <span className="text-[11px] font-normal text-muted-foreground/50 ml-1.5">total modules</span>
                </p>
              </div>
              <TechDistribution data={technologyDistribution} />
            </TabsContent>
          </Tabs>
        </SectionCard>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
         ROW 4: Platform Health + Security Alerts
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <SectionCard>
          <SectionHeader icon={Server} title="Platform Health" />
          <PlatformHealthWidget data={platformHealth} />
        </SectionCard>

        <SectionCard>
          <SectionHeader
            icon={Shield}
            title="Security Alerts"
            count={securityAlerts.length}
            actionLabel="Security center"
            actionHref="/dashboard/security"
          />
          <SecurityAlertsWidget alerts={securityAlerts} />
        </SectionCard>
      </div>
    </div>
  );
}
