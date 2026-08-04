import { useState, useEffect } from "react";
import {
  Play,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  GitBranch,
  Terminal,
  Activity,
  Server,
  Zap,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { Card, Badge, Button } from "../../components/ui/index";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../../components/ui/table";
import { cn } from "../../lib/utils";

// Initial mock pipeline data
const initialPipelines = [
  {
    id: 1,
    name: "Validate Core Auth Middleware",
    module: "@org/auth-core",
    branch: "main",
    commit: "8a4c102",
    status: "Success",
    lastRun: "10m ago",
    duration: "1m 14s",
  },
  {
    id: 2,
    name: "Design Tokens Asset Compilation",
    module: "@org/ui-components",
    branch: "release-v1.0",
    commit: "3f9b2d4",
    status: "Success",
    lastRun: "45m ago",
    duration: "2m 05s",
  },
  {
    id: 3,
    name: "Telemetry Index Parse Logs",
    module: "@org/logger-pro",
    branch: "patch-1.1",
    commit: "e1a9c8d",
    status: "Failed",
    lastRun: "2h ago",
    duration: "45s",
  },
  {
    id: 4,
    name: "Payload Encryption Signature",
    module: "@org/payment-gateway",
    branch: "main",
    commit: "d5f3e2a",
    status: "Success",
    lastRun: "1d ago",
    duration: "1m 40s",
  },
];

const activityFeed = [
  { time: "2m ago", type: "success", text: "Production deployment for @org/auth-core v1.2.0 finished successfully.", trigger: "Algo Helper" },
  { time: "10m ago", type: "info", text: "Test suite passed: 14 assertions successful in @org/ui-components.", trigger: "David Vance" },
  { time: "45m ago", type: "failed", text: "Pipeline build failed for @org/logger-pro. Error: Linting validation errors.", trigger: "Marcus Aurelius" },
  { time: "2h ago", type: "info", text: "Webpack assets chunked and cached for registry edge locations.", trigger: "System" },
];

export function PipelinesPage() {
  const [pipelines, setPipelines] = useState(initialPipelines);
  const [activities, setActivities] = useState(activityFeed);
  const [runningSim, setRunningSim] = useState(false);
  const [simProgress, setSimProgress] = useState(0);
  const [simName, setSimName] = useState("");

  const runSimulation = () => {
    if (runningSim) return;
    setRunningSim(true);
    setSimProgress(0);
    setSimName("Deploying @org/cache-sync");

    // Add a new pipeline entry in running state
    const newPipe = {
      id: Date.now(),
      name: "Deploying @org/cache-sync",
      module: "@org/cache-sync",
      branch: "main",
      commit: "a3f292c",
      status: "Running",
      lastRun: "Just now",
      duration: "0s",
    };
    
    setPipelines((prev) => [newPipe, ...prev]);

    // Update activity feed
    const newActivity = {
      time: "Just now",
      type: "info",
      text: "Pipeline trigger requested for @org/cache-sync. Resolving metadata...",
      trigger: "Dev User",
    };
    setActivities((prev) => [newActivity, ...prev]);
  };

  useEffect(() => {
    if (!runningSim) return;

    const interval = setInterval(() => {
      setSimProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setRunningSim(false);
          // Set pipeline state to Success
          setPipelines((prevList) =>
            prevList.map((p) =>
              p.name === "Deploying @org/cache-sync"
                ? { ...p, status: "Success", duration: "18s" }
                : p
            )
          );
          // Append success activity
          const successActivity = {
            time: "Just now",
            type: "success",
            text: "Build finished and deployment verified for @org/cache-sync v1.0.0.",
            trigger: "System",
          };
          setActivities((prevAct) => [successActivity, ...prevAct]);
          return 100;
        }
        return prev + 25;
      });
    }, 1200);

    return () => clearInterval(interval);
  }, [runningSim]);

  const getStatusBadge = (status) => {
    switch (status) {
      case "Success":
        return (
          <Badge variant="stable" className="gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 size={11} />
            Success
          </Badge>
        );
      case "Failed":
        return (
          <Badge variant="deprecated" className="gap-1 bg-red-500/10 text-red-400 border border-red-500/20">
            <XCircle size={11} />
            Failed
          </Badge>
        );
      case "Running":
        return (
          <Badge variant="beta" className="gap-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">
            <RefreshCw size={11} className="animate-spin" />
            Running
          </Badge>
        );
      default:
        return (
          <Badge variant="default" className="gap-1 bg-white/[0.04] text-muted-foreground border border-white/[0.06]">
            <Clock size={11} />
            Queued
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-white pb-10 max-w-[1400px]">
      
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/[0.06] pb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">CI/CD Pipelines</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Monitor compilation runtimes, artifact bundling, and staging registry deployments.
          </p>
        </div>

        {/* Action Button */}
        <Button
          onClick={runSimulation}
          disabled={runningSim}
          variant="primary"
          size="sm"
          className="gap-1.5 h-9 px-4 text-xs font-bold shadow-[0_2px_10px_rgba(212,166,79,0.15)] align-self-start"
        >
          <Play size={13} fill="currentColor" />
          Trigger Pipeline Run
        </Button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Active Pipelines", value: "3", sub: "3 running currently", icon: Activity, color: "border-white/[0.06]" },
          { label: "Successful Builds", value: "7 Builds", sub: "completed this week", icon: CheckCircle2, color: "text-emerald-400 border-emerald-500/15 bg-emerald-500/[0.01]" },
          { label: "Failed Builds", value: "1 Build", sub: "0 blockers unresolved", icon: XCircle, color: "text-red-400 border-red-500/15 bg-red-500/[0.01]" },
          { label: "Success Rate", value: "95%", sub: "deployment success rate", icon: Clock, color: "border-white/[0.06]" },
        ].map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className={cn("rounded-lg border bg-white/[0.015] p-4 flex items-center justify-between", card.color)}>
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">{card.label}</span>
                <div className="text-2xl font-black text-foreground font-mono leading-none pt-1">{card.value}</div>
                <span className="block text-[10px] text-muted-foreground/45 mt-1">{card.sub}</span>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background/50 border border-white/[0.04] text-gold-300">
                <Icon size={16} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Live progress box if running */}
      {runningSim && (
        <Card className="p-4 border-amber-500/20 bg-amber-500/[0.02] flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-amber-300 flex items-center gap-1.5">
              <RefreshCw size={12} className="animate-spin" />
              Executing: {simName}
            </span>
            <span className="font-mono text-amber-300">{simProgress}%</span>
          </div>
          <div className="h-1.5 w-full bg-white/[0.06] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-gold-500 to-amber-500 transition-all duration-500"
              style={{ width: `${simProgress}%` }}
            />
          </div>
        </Card>
      )}

      {/* Main Table + Logs Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        
        {/* Pipelines Table */}
        <Card className="lg:col-span-2 p-5 bg-card/30 border-white/[0.06]">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/[0.04]">
            <div className="flex items-center gap-2">
              <Terminal size={14} className="text-gold-300" />
              <h3 className="text-sm font-semibold text-foreground">Build Execution History</h3>
            </div>
            <span className="text-[10px] text-muted-foreground/40 font-mono">Actions / GitLab CI</span>
          </div>

          <Table>
            <TableHeader>
              <TableRow className="border-b border-white/[0.04] hover:bg-transparent">
                <TableHead>Pipeline Job</TableHead>
                <TableHead>Target Branch</TableHead>
                <TableHead>Commit SHA</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right pr-4">Duration</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pipelines.map((pipe) => (
                <TableRow key={pipe.id} className="border-b border-white/[0.02]">
                  <TableCell>
                    <div>
                      <div className="text-xs font-semibold text-foreground">{pipe.name}</div>
                      <span className="text-[10px] text-muted-foreground/40 font-mono">{pipe.module}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <GitBranch size={11} className="text-gold-300/60" />
                      <span className="font-mono">{pipe.branch}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground/60">
                    {pipe.commit}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(pipe.status)}
                  </TableCell>
                  <TableCell className="text-right pr-4 font-mono text-xs text-muted-foreground/75">
                    {pipe.duration}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        {/* Pipelines Activity Log Feed */}
        <Card className="p-5 bg-card/30 border-white/[0.06]">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/[0.04]">
            <div className="flex items-center gap-2">
              <Server size={14} className="text-gold-300" />
              <h3 className="text-sm font-semibold text-foreground">Recent Pipeline Activity</h3>
            </div>
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground/30 font-bold">Staged Edge</span>
          </div>

          <div className="space-y-4">
            {activities.map((act, i) => (
              <div key={i} className="text-xs flex gap-2.5 items-start">
                <span className={cn(
                  "mt-1.5 h-1.5 w-1.5 rounded-full flex-shrink-0",
                  act.type === "success" ? "bg-emerald-400" :
                  act.type === "failed" ? "bg-red-400" : "bg-gold-300"
                )} />
                <div className="space-y-0.5 min-w-0 flex-1">
                  <p className="text-foreground/80 leading-relaxed text-[11px]">{act.text}</p>
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/40 font-mono">
                    <span>By {act.trigger}</span>
                    <span>·</span>
                    <span>{act.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

    </div>
  );
}
