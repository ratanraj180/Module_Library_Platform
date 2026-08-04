import { useState, useEffect } from "react";
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Zap,
  Activity,
  AlertTriangle,
  FileText,
  Clock,
  Terminal,
  RefreshCw,
  Search,
  CheckCircle2,
  Lock,
  ArrowRight,
  ChevronDown
} from "lucide-react";
import { Card, Badge, Button } from "../../components/ui/index";
import { api } from "../../lib/api";
import { cn } from "../../lib/utils";
import {
  RiskBadge,
  SecurityScoreCard,
  SecurityProgress,
  SecurityTimeline,
  FindingCard,
  RecommendationCard,
  SecuritySummary
} from "../../components/security/SecurityWidgets";

export function SecurityPage() {
  const [modules, setModules] = useState([]);
  const [selectedModuleId, setSelectedModuleId] = useState("");
  const [loadingModules, setLoadingModules] = useState(true);
  
  // Scan execution and report states
  const [report, setReport] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanPercent, setScanPercent] = useState(0);
  const [scanText, setScanText] = useState("");
  const [scanStep, setScanStep] = useState("uploading");
  const [scanDuration, setScanDuration] = useState(null);
  
  // Statistics/KPI counts across all modules
  const [stats, setStats] = useState({
    totalScans: 0,
    criticalCount: 0,
    highCount: 0,
    mediumCount: 0,
    safeCount: 0
  });

  // Fetch all registry modules for selection
  useEffect(() => {
    const fetchModules = async () => {
      setLoadingModules(true);
      try {
        const res = await api.get("/api/modules");
        const list = Array.isArray(res) ? res : (res.data || []);
        setModules(list);
        if (list.length > 0) {
          setSelectedModuleId(list[0]._id);
        }
      } catch (err) {
        console.error("Failed to load modules for Security Center:", err);
      } finally {
        setLoadingModules(false);
      }
    };
    fetchModules();
  }, []);

  // Poll security report during active scanning
  useEffect(() => {
    if (!scanning || !selectedModuleId) return;

    let intervalId;
    let progressInterval = setInterval(() => {
      setScanPercent(prev => {
        if (prev >= 98) return 98;
        return prev + 1;
      });
    }, 450);

    const checkStatus = async () => {
      try {
        const res = await api.get(`/api/security/report/${selectedModuleId}`);
        if (res && res.report) {
          const rep = res.report;
          setReport(rep);

          if (rep.scanStatus === "completed") {
            setScanning(false);
            setScanPercent(100);
            setScanText("Pipeline completed successfully.");
            setScanDuration(rep.durationMs);
            clearInterval(intervalId);
            clearInterval(progressInterval);
          } else if (rep.scanStatus === "failed") {
            setScanning(false);
            setScanPercent(100);
            setScanText("Scan failed: " + (rep.pipelineError || "Internal error"));
            clearInterval(intervalId);
            clearInterval(progressInterval);
          } else if (rep.scanStatus === "running") {
            if (rep.secretScan?.scannerMeta?.engine) {
              setScanStep("ai");
              setScanText("Generating AI vulnerability risk analysis summary...");
            } else if (rep.dependencyScan?.scannerMeta?.engine) {
              setScanStep("secrets");
              setScanText("Scanning repository files for hardcoded secrets & credentials...");
            } else if (rep.staticAnalysis?.scannerMeta?.engine) {
              setScanStep("deps");
              setScanText("Running package manifest dependency vulnerability scans...");
            } else if (rep.malwareResult?.scannerMeta?.engine) {
              setScanStep("static");
              setScanText("Running Semgrep static code analysis patterns...");
            } else {
              setScanStep("malware");
              setScanText("Executing ClamAV antivirus definition matching...");
            }
          }
        }
      } catch (err) {
        console.error("Failed status check:", err);
      }
    };

    checkStatus();
    intervalId = setInterval(checkStatus, 1500);

    return () => {
      clearInterval(intervalId);
      clearInterval(progressInterval);
    };
  }, [scanning, selectedModuleId]);

  // Fetch report when selected module changes
  useEffect(() => {
    if (!selectedModuleId || scanning) return;

    const fetchReport = async () => {
      setLoadingReport(true);
      setReport(null);
      setScanDuration(null);
      try {
        const res = await api.get(`/api/security/report/${selectedModuleId}`);
        if (res && res.report) {
          setReport(res.report);
          setScanDuration(res.report.durationMs);
        }
      } catch (err) {
        // 404 is normal when no scan has been executed yet
        if (err.status !== 404) {
          console.error("Error loading report:", err);
        }
      } finally {
        setLoadingReport(false);
      }
    };

    fetchReport();
  }, [selectedModuleId, scanning]);

  // Trigger manual rescan
  const triggerRescan = async () => {
    if (!selectedModuleId || scanning) return;

    setScanning(true);
    setScanPercent(15);
    setScanStep("scanning");
    setScanText("Triggering pipeline execution on backend...");

    try {
      await api.post(`/api/security/rescan/${selectedModuleId}`);
    } catch (err) {
      console.error("Failed to run rescan:", err);
      setScanning(false);
      setScanText("Failed to start scan: " + err.message);
    }
  };

  // Compile statistics from all loaded modules to fill KPI cards
  useEffect(() => {
    if (modules.length === 0) return;

    const fetchAllStats = async () => {
      try {
        let scans = 0, crit = 0, high = 0, med = 0, safe = 0;
        
        const reports = await Promise.all(
          modules.map(m => api.get(`/api/security/report/${m._id}`).catch(() => null))
        );

        reports.forEach(r => {
          if (r && r.report) {
            scans++;
            const lvl = (r.report.riskLevel || "safe").toLowerCase();
            if (lvl === "critical") crit++;
            else if (lvl === "high") high++;
            else if (lvl === "medium") med++;
            else safe++;
          }
        });

        setStats({
          totalScans: scans,
          criticalCount: crit,
          highCount: high,
          mediumCount: med,
          safeCount: safe
        });
      } catch (err) {
        console.error("Error aggregating stats:", err);
      }
    };
    fetchAllStats();
  }, [modules]);

  // Merge findings for display
  const allFindings = [];
  if (report) {
    if (report.malwareResult?.findings) allFindings.push(...report.malwareResult.findings);
    if (report.staticAnalysis?.findings) allFindings.push(...report.staticAnalysis.findings);
    if (report.dependencyScan?.findings) allFindings.push(...report.dependencyScan.findings);
    if (report.secretScan?.findings) allFindings.push(...report.secretScan.findings);
  }

  const selectedModule = modules.find(m => m._id === selectedModuleId);

  return (
    <div className="space-y-6 animate-fade-in text-white pb-10 max-w-[1400px]">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/[0.06] pb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Security Center</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Static analysis audits, dependency vulnerabilities, credential leak scanning, and risk rating summaries.
          </p>
        </div>

        {/* Module Selector Dropdown */}
        <div className="flex items-center gap-3">
          {loadingModules ? (
            <span className="text-xs text-muted-foreground animate-pulse">Loading modules...</span>
          ) : (
            <div className="relative">
              <select
                value={selectedModuleId}
                onChange={(e) => setSelectedModuleId(e.target.value)}
                className="appearance-none bg-card/40 border border-white/[0.06] rounded-xl px-4 py-2 pr-10 text-xs font-semibold text-foreground focus:outline-none focus:border-gold-500/50 cursor-pointer min-w-[220px] backdrop-blur-md"
              >
                {modules.map((m) => (
                  <option key={m._id} value={m._id} className="bg-[#121214] text-white">
                    {m.title}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 pointer-events-none" />
            </div>
          )}

          <Button
            onClick={triggerRescan}
            disabled={scanning || !selectedModuleId}
            variant="primary"
            size="sm"
            className="gap-1.5 h-9 px-4 text-xs font-bold shadow-[0_2px_10px_rgba(212,166,79,0.15)] border border-gold-500/20"
          >
            {scanning ? (
              <RefreshCw size={13} className="animate-spin" />
            ) : (
              <Search size={13} />
            )}
            Trigger Security Audit
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Scans Completed", value: stats.totalScans, sub: `${modules.length} registered modules`, icon: ShieldCheck, color: "text-gold-300 border-white/[0.06]" },
          { label: "Critical Modules", value: stats.criticalCount, sub: "Immediate fixes required", icon: ShieldAlert, color: stats.criticalCount > 0 ? "text-red-400 border-red-500/15 bg-red-500/[0.01]" : "text-emerald-400 border-emerald-500/15" },
          { label: "High Risk Modules", value: stats.highCount, sub: "Vulnerability triggers active", icon: AlertTriangle, color: stats.highCount > 0 ? "text-orange-400 border-orange-500/15 bg-orange-500/[0.01]" : "text-emerald-400 border-emerald-500/15" },
          { label: "Safe Modules", value: stats.safeCount, sub: "Passing all checks", icon: Shield, color: "text-emerald-400 border-emerald-500/15" },
        ].map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className={cn("rounded-xl border bg-white/[0.015] p-4 flex items-center justify-between backdrop-blur-sm", card.color)}>
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

      {/* Main Panel */}
      {scanning ? (
        /* Stepper & Progress View during Scan */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
          <div className="md:col-span-1 space-y-6">
            <Card className="p-5 border-white/[0.06] bg-card/20 flex flex-col gap-4 backdrop-blur-md">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Live Progress</span>
              <SecurityProgress progress={scanPercent} text={scanText} />
            </Card>
            <SecurityTimeline currentStep={scanStep} duration={null} />
          </div>
          <div className="md:col-span-2">
            <Card className="p-5 bg-card/30 border-white/[0.06] min-h-[350px] flex items-center justify-center text-center">
              <div className="space-y-3">
                <RefreshCw size={24} className="animate-spin text-gold-300 mx-auto" />
                <div>
                  <h4 className="text-xs font-bold text-foreground">Running Security Scan...</h4>
                  <p className="text-[10px] text-muted-foreground/60 max-w-xs mt-1 mx-auto">
                    The backend is auditing files for malware signatures, credential patterns, and syntax exploits.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      ) : loadingReport ? (
        /* Loading skeleton */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
          <div className="md:col-span-1 h-80 rounded-2xl bg-white/[0.02]" />
          <div className="md:col-span-2 h-80 rounded-2xl bg-white/[0.02]" />
        </div>
      ) : report ? (
        /* Completed Report Findings & scorecards */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 space-y-6">
            <SecurityScoreCard score={report.riskScore} level={report.riskLevel} />
            <SecuritySummary summary={report.aiSummary} />
            <RecommendationCard recommendation={report.recommendation} />
          </div>

          <div className="md:col-span-2 space-y-6">
            <Card className="p-5 bg-card/30 border-white/[0.06] backdrop-blur-sm">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.04] mb-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={14} className="text-gold-300" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Audit Findings</h3>
                </div>
                <span className="text-[9px] font-mono text-muted-foreground/40">Total: {allFindings.length} issue(s)</span>
              </div>

              {allFindings.length === 0 ? (
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
                <div className="space-y-4">
                  {allFindings.map((finding, idx) => (
                    <FindingCard finding={finding} key={idx} />
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      ) : (
        /* Empty State */
        <Card className="p-12 text-center border-white/[0.06] bg-card/20 backdrop-blur-sm">
          <div className="max-w-md mx-auto space-y-4">
            <div className="h-12 w-12 rounded-full bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-gold-300 mx-auto">
              <ShieldAlert size={24} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">No Security Report Found</h3>
              <p className="text-xs text-muted-foreground/60 mt-1">
                This module has not been scanned yet. Run the initial security scan to analyze package vulnerability scores.
              </p>
            </div>
            <Button
              onClick={triggerRescan}
              variant="primary"
              size="sm"
              className="text-xs font-bold"
            >
              Trigger Initial Scan
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
