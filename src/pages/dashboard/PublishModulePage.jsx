import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Upload,
  CheckCircle2,
  Terminal,
  Settings,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Layers,
  ChevronRight,
  RefreshCw,
  FolderPlus,
  ArrowRight,
  BookOpen,
  GitBranch,
  AlertTriangle,
  X,
  Loader2
} from "lucide-react";
import { Card, Button, Input } from "../../components/ui/index";
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

const CATEGORIES = [
  "Frontend",
  "Backend",
  "Database",
  "Authentication",
  "Security",
  "Integration",
  "DevOps",
  "Monitoring",
  "Analytics",
  "AI / ML",
  "Streaming",
  "Payments",
  "Messaging",
  "Notifications",
  "File Management",
  "Search",
  "API Gateway",
  "Utility",
  "Infrastructure",
  "Testing",
  "Other"
];

const TECHNOLOGIES = [
  // Frontend
  "React",
  "Next.js",
  "Vue.js",
  "Angular",
  "Tailwind CSS",
  // Backend
  "Node.js",
  "Express.js",
  "Spring Boot",
  "Django",
  "Flask",
  "FastAPI",
  "Laravel",
  // Databases
  "MongoDB",
  "PostgreSQL",
  "MySQL",
  "Redis",
  "Elasticsearch",
  // Languages
  "JavaScript",
  "TypeScript",
  "Python",
  "Java",
  "Go",
  "Rust",
  "C++",
  "C#",
  // DevOps
  "Docker",
  "Kubernetes",
  "Jenkins",
  "Nginx",
  // Cloud
  "AWS",
  "Azure",
  "GCP",
  // Realtime
  "WebSocket",
  "Socket.io",
  "Kafka",
  "RabbitMQ",
  // Authentication
  "JWT",
  "OAuth",
  "Firebase Auth"
];

export function PublishModulePage() {
  const navigate = useNavigate();
  
  // Custom states
  const [importMode, setImportMode] = useState(false);
  const [githubUrl, setGithubUrl] = useState("");
  const [createdModuleId, setCreatedModuleId] = useState("");
  const [securityScan, setSecurityScan] = useState(null); // Security scan result from API

  // Live polling states for Developer Security Center
  const [currentStep, setCurrentStep] = useState("uploading");
  const [scanReport, setScanReport] = useState(null);
  const [scanDuration, setScanDuration] = useState(null);
  const [scanPercent, setScanPercent] = useState(10);
  const [scanText, setScanText] = useState("Preparing archive for upload...");

  const [form, setForm] = useState({
    name: "",
    description: "",
    categories: [],
    technologies: [],
    version: "1.0.0",
    tags: "",
    repoUrl: "",
  });

  const [errors, setErrors] = useState({});
  const [publishing, setPublishing] = useState(false);
  const [step, setStep] = useState(0);
  const [success, setSuccess] = useState(false);

  const stepsList = [
    { label: "Parsing repository details", icon: Settings },
    { label: "Fetching GitHub API metadata", icon: Shield },
    { label: "Extracting package dependencies", icon: Layers },
    { label: "Saving documentation and modules", icon: Upload },
    { label: "Running security scan", icon: Shield },
  ];

  // Dynamic status & percentage updates for the stepper
  useEffect(() => {
    if (!success || !createdModuleId) return;

    let intervalId;
    let fallbackTimer;
    let localPercent = 15;
    
    // Smooth percentage indicator animation helper
    const progressInterval = setInterval(() => {
      setScanPercent(prev => {
        if (prev >= 98) return 98; // Hold at 98% until server finishes
        return prev + 1;
      });
    }, 450);

    const checkReport = async () => {
      try {
        const res = await api.get(`/api/security/report/${createdModuleId}`);
        if (res && res.report) {
          const rep = res.report;
          setScanReport(rep);
          
          if (rep.scanStatus === 'completed') {
            setCurrentStep('finished');
            setScanPercent(100);
            setScanText("Pipeline finished. Security audit report generated.");
            setScanDuration(rep.durationMs);
            clearInterval(intervalId);
            clearInterval(progressInterval);
          } else if (rep.scanStatus === 'failed') {
            setCurrentStep('finished');
            setScanPercent(100);
            setScanText("Pipeline failed with scan errors.");
            clearInterval(intervalId);
            clearInterval(progressInterval);
          } else if (rep.scanStatus === 'running') {
            // Check scan contents to estimate stepper progress
            if (rep.secretScan?.scannerMeta?.engine) {
              setCurrentStep('ai');
              setScanText("Generating AI vulnerability risk analysis summary...");
            } else if (rep.dependencyScan?.scannerMeta?.engine) {
              setCurrentStep('secrets');
              setScanText("Scanning repository files for hardcoded secrets & credentials...");
            } else if (rep.staticAnalysis?.scannerMeta?.engine) {
              setCurrentStep('deps');
              setScanText("Running package manifest dependency vulnerability scans...");
            } else if (rep.malwareResult?.scannerMeta?.engine) {
              setCurrentStep('static');
              setScanText("Running Semgrep static code analysis patterns...");
            } else {
              setCurrentStep('malware');
              setScanText("Executing ClamAV antivirus definition matching...");
            }
          }
        }
      } catch (err) {
        console.error('Error polling security report:', err);
      }
    };

    // Begin check
    checkReport();
    intervalId = setInterval(checkReport, 1500);

    return () => {
      clearInterval(intervalId);
      clearInterval(progressInterval);
    };
  }, [success, createdModuleId]);

  const handleToggleCategory = (cat) => {
    if (!cat) return;
    setForm(f => {
      const alreadyHas = f.categories.includes(cat);
      const nextCats = alreadyHas ? f.categories.filter(c => c !== cat) : [...f.categories, cat];
      return { ...f, categories: nextCats };
    });
  };

  const handleToggleTechnology = (tech) => {
    if (!tech) return;
    setForm(f => {
      const alreadyHas = f.technologies.includes(tech);
      const nextTechs = alreadyHas ? f.technologies.filter(t => t !== tech) : [...f.technologies, tech];
      return { ...f, technologies: nextTechs };
    });
  };

  const validate = () => {
    const errs = {};
    
    if (importMode) {
      if (!githubUrl) {
        errs.githubUrl = "GitHub repository URL is required";
      } else if (!/^https:\/\/github\.com\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+(\/)?$/.test(githubUrl.trim())) {
        errs.githubUrl = "Enter a valid public GitHub URL (e.g., https://github.com/user/repo)";
      }
    } else {
      if (!form.name) errs.name = "Module name is required";
      else if (!form.name.startsWith("@org/")) errs.name = "Name must start with @org/ (e.g. @org/auth-core)";
      
      if (!form.description) errs.description = "Description is required";
      
      if (!form.categories || form.categories.length === 0) {
        errs.categories = "At least one category must be selected";
      }

      if (!form.technologies || form.technologies.length === 0) {
        errs.technologies = "At least one technology must be selected";
      }

      if (!form.version) errs.version = "Version is required";
      else if (!/^\d+\.\d+\.\d+(-[a-zA-z0-9.]+)?$/.test(form.version)) {
        errs.version = "Enter a valid semantic version (e.g. 1.0.0, 2.3.1-beta.1)";
      }
      
      if (!form.repoUrl) errs.repoUrl = "Repository URL is required";
      else if (!/^(https?:\/\/)?(www\.)?(github|gitlab|bitbucket)\.com\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+(\/)?$/.test(form.repoUrl)) {
        errs.repoUrl = "Enter a valid Git repository URL (e.g. https://github.com/org/repo)";
      }
    }

    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setPublishing(true);
    setStep(0);

    try {
      let payload = {};
      if (importMode) {
        payload = {
          repositoryUrl: githubUrl.trim(),
          importedFromGithub: true,
        };
      } else {
        payload = {
          title: form.name,
          description: form.description,
          category: form.categories[0] || "Other", // For DB schema single compatibility
          technology: form.technologies[0] || "JavaScript", // For DB schema single compatibility
          categories: form.categories,
          technologies: form.technologies,
          tags: form.tags,
          repositoryUrl: form.repoUrl,
          currentVersion: form.version,
          importedFromGithub: false,
        };
      }

      // Execute API call
      const res = await api.post("/api/modules", payload);
      
      // Keep loader visual progress steps matching
      setStep(1);
      await new Promise(r => setTimeout(r, 600));
      setStep(2);
      await new Promise(r => setTimeout(r, 600));
      setStep(3);
      await new Promise(r => setTimeout(r, 600));

      setCreatedModuleId(res._id);
      // Capture security scan result if a file was uploaded and scanned
      if (res.securityScan) {
        setSecurityScan(res.securityScan);
      }
      setSuccess(true);
    } catch (err) {
      setErrors({ apiError: err.message || "Failed to publish module." });
    } finally {
      setPublishing(false);
    }
  };

  const handleReset = () => {
    setForm({
      name: "",
      description: "",
      categories: [],
      technologies: [],
      version: "1.0.0",
      tags: "",
      repoUrl: "",
    });
    setGithubUrl("");
    setSuccess(false);
    setErrors({});
  };

  if (success) {
    // Compile all findings from static analysis, dependency audits, and secret scanning
    const allFindings = [];
    if (scanReport) {
      if (scanReport.malwareResult?.findings) allFindings.push(...scanReport.malwareResult.findings);
      if (scanReport.staticAnalysis?.findings) allFindings.push(...scanReport.staticAnalysis.findings);
      if (scanReport.dependencyScan?.findings) allFindings.push(...scanReport.dependencyScan.findings);
      if (scanReport.secretScan?.findings) allFindings.push(...scanReport.secretScan.findings);
    }

    return (
      <div className="space-y-8 animate-fade-in text-white pb-12 max-w-[1200px] mx-auto">
        {/* Success Splash Header */}
        <div className="flex flex-col items-center justify-center text-center gap-3 py-4 max-w-xl mx-auto">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)] animate-bounce">
            <CheckCircle2 size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">Module Uploaded & Published!</h2>
            <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
              Your repository module has been successfully registered. The background security scanning pipeline is executing the security check now.
            </p>
          </div>
        </div>

        {/* Live Developer Security Console */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column: Progress Dial & Executive Details */}
          <div className="md:col-span-1 space-y-6">
            {currentStep !== "finished" ? (
              <div className="space-y-6">
                <Card className="p-5 border-white/[0.06] bg-card/20 flex flex-col gap-4 backdrop-blur-md">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Live Progress</span>
                  <SecurityProgress progress={scanPercent} text={scanText} />
                </Card>
                <SecurityTimeline currentStep={currentStep} duration={scanDuration} />
              </div>
            ) : (
              <div className="space-y-6 animate-scale-in">
                <SecurityScoreCard 
                  score={scanReport?.riskScore ?? 100} 
                  level={scanReport?.riskLevel ?? "safe"} 
                />
                <SecuritySummary summary={scanReport?.aiSummary} />
                <RecommendationCard recommendation={scanReport?.recommendation} />
              </div>
            )}
          </div>

          {/* Right Column: Detailed Security Findings / Live Logs */}
          <div className="md:col-span-2">
            <Card className="h-full p-5 bg-card/30 border-white/[0.06] flex flex-col min-h-[420px] backdrop-blur-sm">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.04] mb-4">
                <div className="flex items-center gap-2">
                  <Shield size={14} className="text-gold-300 animate-pulse" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
                    {currentStep !== "finished" ? "Scan System Terminal" : "Detailed Audit Findings"}
                  </h3>
                </div>
                <span className="text-[9px] font-mono text-muted-foreground/40">Developer Console</span>
              </div>

              {currentStep !== "finished" ? (
                /* Interactive Terminal Output Simulator */
                <div className="flex-1 rounded-xl bg-background/90 border border-white/[0.04] p-4 font-mono text-[10px] text-muted-foreground/80 space-y-2 overflow-y-auto leading-relaxed shadow-inner">
                  <div className="text-emerald-400/80">&gt; Starting security audit pipeline...</div>
                  <div className="text-muted-foreground/40">&gt; Initializing scanner engine dependencies...</div>
                  <div className={cn("transition-opacity duration-300", currentStep === "uploading" ? "text-gold-300 font-bold" : "text-muted-foreground/60")}>
                    &gt; [FileSystem] Uploaded zip package extracted. File size verification checked.
                  </div>
                  {["malware", "static", "deps", "secrets", "ai"].map((phase, i) => {
                    const phaseLabels = ["ClamAV Malware scanner", "Semgrep Static Code analyzer", "npm audit CVE DB resolution", "Gitleaks secret scanner", "Google Gemini AI summarizer"];
                    const isStarted = stepsList.findIndex(s => s.label === currentStep) >= i || currentStep === "finished";
                    const isCurrent = currentStep === phase;

                    if (!isStarted) return null;
                    return (
                      <div key={phase} className={cn(
                        "transition-all duration-300",
                        isCurrent ? "text-gold-300 font-bold animate-pulse" : "text-emerald-400/70"
                      )}>
                        &gt; [{phase.toUpperCase()}] Running {phaseLabels[i]}... {isCurrent ? "LOADING" : "DONE"}
                      </div>
                    );
                  })}
                  <div className="animate-pulse text-gold-300/60">&gt; Polling backend reports...</div>
                </div>
              ) : (
                /* Scan Finished: Show findings list */
                <div className="flex-1 flex flex-col gap-4">
                  {allFindings.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 p-8 border border-dashed border-white/[0.06] rounded-xl bg-white/[0.01]">
                      <div className="h-10 w-10 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                        <ShieldCheck size={20} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-foreground">Clean Bill of Health!</h4>
                        <p className="text-[10px] text-muted-foreground/60 max-w-sm mt-1">
                          No malware signatures, syntax vulnerabilities, or plain-text secrets were detected in this module.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 overflow-y-auto max-h-[500px] pr-1">
                      {allFindings.map((finding, idx) => (
                        <FindingCard finding={finding} key={idx} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* Console Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 border-t border-white/[0.04]">
          <Button
            onClick={() => navigate(`/dashboard/modules/${createdModuleId}`)}
            variant="primary"
            size="sm"
            className="w-full sm:w-48 text-xs font-bold h-10 shadow-[0_2px_10px_rgba(212,166,79,0.15)]"
          >
            Go to Module Details
            <ArrowRight size={13} className="ml-1.5" />
          </Button>
          <Button
            onClick={handleReset}
            variant="secondary"
            size="sm"
            className="w-full sm:w-48 text-xs h-10 border-white/[0.06]"
          >
            Publish Another Module
          </Button>
        </div>
      </div>
    );
  }

  if (publishing) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-20 animate-fade-in text-white max-w-md mx-auto">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-gold-500/20 bg-gold-500/10 text-gold-300">
          <RefreshCw size={24} className="animate-spin" />
        </div>
        <div className="text-center">
          <h3 className="text-lg font-bold text-foreground">Publishing Registry Module</h3>
          <p className="text-xs text-muted-foreground/60 mt-1">Please do not refresh or close the tab</p>
        </div>

        <div className="w-full space-y-3 bg-background/40 p-5 rounded-xl border border-white/[0.04]">
          {stepsList.map((st, idx) => {
            const PipeIcon = st.icon;
            const isCompleted = idx < step;
            const isCurrent = idx === step;
            return (
              <div key={idx} className="flex items-center justify-between text-xs transition-opacity duration-300">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "flex h-6 w-6 items-center justify-center rounded",
                    isCompleted ? "bg-emerald-500/10 text-emerald-400" :
                    isCurrent ? "bg-gold-500/10 text-gold-300" : "bg-white/[0.02] text-muted-foreground/40"
                  )}>
                    <PipeIcon size={12} className={isCurrent ? "animate-pulse" : ""} />
                  </div>
                  <span className={cn(
                    isCompleted ? "text-muted-foreground/60 line-through" :
                    isCurrent ? "text-foreground font-semibold" : "text-muted-foreground/40"
                  )}>
                    {st.label}
                  </span>
                </div>
                {isCompleted ? (
                  <CheckCircle2 size={12} className="text-emerald-400" />
                ) : isCurrent ? (
                  <span className="text-[10px] text-gold-300 font-mono">Running...</span>
                ) : (
                  <span className="text-[10px] text-muted-foreground/20 font-mono">Waiting</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in text-white pb-10 max-w-2xl mx-auto">
      
      {/* Header */}
      <div className="border-b border-white/[0.06] pb-5">
        <h1 className="text-2xl font-bold text-foreground">Publish Registry Module</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Register a new reusable internal package to the internal platform index.
        </p>
      </div>

      {errors.apiError && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-400 flex items-center gap-2">
          <AlertTriangle size={14} className="flex-shrink-0" />
          <span>{errors.apiError}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-white/[0.06] gap-4 text-xs font-semibold">
        <button
          onClick={() => { setImportMode(false); setErrors({}); }}
          className={cn("pb-2 border-b-2 transition-all", !importMode ? "border-gold-500 text-foreground font-bold" : "border-transparent text-muted-foreground hover:text-foreground")}
        >
          Manual Entry
        </button>
        <button
          onClick={() => { setImportMode(true); setErrors({}); }}
          className={cn("pb-2 border-b-2 transition-all flex items-center gap-1.5", importMode ? "border-gold-500 text-foreground font-bold" : "border-transparent text-muted-foreground hover:text-foreground")}
        >
          <GitBranch size={13} /> Import from GitHub Repository
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 bg-card/30 border border-white/[0.06] p-6 rounded-xl">
        
        {importMode ? (
          <div className="flex flex-col gap-1.5 animate-fade-in">
            <label className="text-xs font-semibold text-foreground">GitHub Repository URL</label>
            <input
              type="text"
              placeholder="https://github.com/user/repository"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              className={cn("input-field font-mono", errors.githubUrl && "border-red-500 focus:ring-red-500/20")}
            />
            <p className="text-[10px] text-muted-foreground/45">
              Enter the full HTTPS URL of a public repository to pull details automatically.
            </p>
            {errors.githubUrl && <p className="text-[11px] text-red-400 mt-0.5">{errors.githubUrl}</p>}
          </div>
        ) : (
          <div className="space-y-5 animate-fade-in">
            {/* Module Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-foreground">Module Name</label>
              <input
                type="text"
                placeholder="@org/module-name"
                value={form.name}
                onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                className={cn("input-field font-mono", errors.name && "border-red-500 focus:ring-red-500/20")}
              />
              <p className="text-[10px] text-muted-foreground/45">Must start with @org/ namespace indicator.</p>
              {errors.name && <p className="text-[11px] text-red-400 mt-0.5">{errors.name}</p>}
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-foreground">Description</label>
              <textarea
                placeholder="Describe the purpose, interface, and capabilities of this module."
                value={form.description}
                onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                className={cn("input-field min-h-20 py-2 resize-none", errors.description && "border-red-500 focus:ring-red-500/20")}
              />
              {errors.description && <p className="text-[11px] text-red-400 mt-0.5">{errors.description}</p>}
            </div>

            {/* Category & Tech Stack */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Categories Selector */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-foreground">Categories (Select multiple)</label>
                <select
                  value=""
                  onChange={(e) => {
                    handleToggleCategory(e.target.value);
                    e.target.value = "";
                  }}
                  className="input-field py-2 bg-card text-xs text-foreground border border-white/[0.06] rounded-lg"
                >
                  <option value="" disabled>Choose categories...</option>
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat} disabled={form.categories.includes(cat)}>
                      {cat} {form.categories.includes(cat) ? "✓" : ""}
                    </option>
                  ))}
                </select>
                {/* Removable chips container */}
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {form.categories.map(cat => (
                    <span
                      key={cat}
                      className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-gold-500/10 text-gold-300 border border-gold-500/20 font-medium"
                    >
                      {cat}
                      <button
                        type="button"
                        onClick={() => handleToggleCategory(cat)}
                        className="hover:text-red-400 focus:outline-none"
                      >
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                </div>
                {errors.categories && <p className="text-[11px] text-red-400 mt-0.5">{errors.categories}</p>}
              </div>

              {/* Technologies Selector */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-foreground">Technologies (Select multiple)</label>
                <select
                  value=""
                  onChange={(e) => {
                    handleToggleTechnology(e.target.value);
                    e.target.value = "";
                  }}
                  className="input-field py-2 bg-card text-xs text-foreground border border-white/[0.06] rounded-lg"
                >
                  <option value="" disabled>Choose technologies...</option>
                  {TECHNOLOGIES.map(tech => (
                    <option key={tech} value={tech} disabled={form.technologies.includes(tech)}>
                      {tech} {form.technologies.includes(tech) ? "✓" : ""}
                    </option>
                  ))}
                </select>
                {/* Removable chips container */}
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {form.technologies.map(tech => (
                    <span
                      key={tech}
                      className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20 font-medium"
                    >
                      {tech}
                      <button
                        type="button"
                        onClick={() => handleToggleTechnology(tech)}
                        className="hover:text-red-400 focus:outline-none"
                      >
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                </div>
                {errors.technologies && <p className="text-[11px] text-red-400 mt-0.5">{errors.technologies}</p>}
              </div>
            </div>

            {/* Version & Tags */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-foreground">Version</label>
                <input
                  type="text"
                  placeholder="1.0.0"
                  value={form.version}
                  onChange={(e) => setForm(f => ({ ...f, version: e.target.value }))}
                  className={cn("input-field font-mono", errors.version && "border-red-500 focus:ring-red-500/20")}
                />
                {errors.version && <p className="text-[11px] text-red-400 mt-0.5">{errors.version}</p>}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-foreground">Tags (comma-separated)</label>
                <input
                  type="text"
                  placeholder="react, security, auth"
                  value={form.tags}
                  onChange={(e) => setForm(f => ({ ...f, tags: e.target.value }))}
                  className="input-field"
                />
              </div>
            </div>

            {/* Repository URL */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-foreground">Repository URL</label>
              <input
                type="text"
                placeholder="https://github.com/org/repo-name"
                value={form.repoUrl}
                onChange={(e) => setForm(f => ({ ...f, repoUrl: e.target.value }))}
                className={cn("input-field font-mono", errors.repoUrl && "border-red-500 focus:ring-red-500/20")}
              />
              {errors.repoUrl && <p className="text-[11px] text-red-400 mt-0.5">{errors.repoUrl}</p>}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-white/[0.04]">
          <Button
            type="button"
            onClick={() => navigate("/dashboard")}
            variant="secondary"
            size="sm"
            className="text-xs font-bold"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            className="text-xs font-bold shadow-[0_2px_10px_rgba(212,166,79,0.15)]"
          >
            Publish Module
          </Button>
        </div>

      </form>
    </div>
  );
}

