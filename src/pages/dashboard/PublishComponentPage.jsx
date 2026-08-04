import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Tag,
  X,
  AlertTriangle,
  CheckCircle2,
  Code2,
  Terminal,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  RefreshCw
} from "lucide-react";
import { api } from "../../lib/api";
import { Card, Button } from "../../components/ui/index";
import { useAuth } from "../../hooks/useAuth";
import { cn } from "../../lib/utils";
import {
  SecurityProgress,
  SecurityTimeline,
  SecurityScoreCard,
  FindingCard,
  RecommendationCard,
  SecuritySummary
} from "../../components/security/SecurityWidgets";

const CATEGORIES = ["UI Components", "Backend Components"];

function FieldError({ message }) {
  if (!message) return null;
  return <p className="text-xs text-red-400 mt-1">{message}</p>;
}

function Label({ htmlFor, children, required }) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-xs font-semibold text-muted-foreground mb-1.5"
    >
      {children}
      {required && <span className="ml-0.5 text-red-400">*</span>}
    </label>
  );
}

export function PublishComponentPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    frontendCode: "",
    backendCode: "",
    dependencies: "",
    installation: "",
    documentation: "",
    currentVersion: "1.0.0",
  });

  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState([]);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [actionType, setActionType] = useState(""); // "draft" or "submit"

  const [createdComponentId, setCreatedComponentId] = useState("");
  const [securityScan, setSecurityScan] = useState(null);
  const [scanPercent, setScanPercent] = useState(0);
  const [scanText, setScanText] = useState("");
  const [currentStep, setCurrentStep] = useState("scanning");
  const [scanReport, setScanReport] = useState(null);
  const [scanDuration, setScanDuration] = useState(null);

  const stepsList = [
    { label: "scanning", pct: 20, text: "Extracting component source code..." },
    { label: "malware", pct: 40, text: "Running ClamAV malware signatures check..." },
    { label: "static", pct: 60, text: "Executing Semgrep AST pattern matching..." },
    { label: "deps", pct: 75, text: "Resolving packages dependency vulnerabilities..." },
    { label: "secrets", pct: 90, text: "Auditing source lines for credentials..." },
    { label: "ai", pct: 98, text: "Generating Gemini AI security overview..." },
    { label: "finished", pct: 100, text: "Pipeline run finished." }
  ];

  useEffect(() => {
    if (!submitted || !createdComponentId || actionType === "draft") return;

    let intervalId;
    let progressInterval = setInterval(() => {
      setScanPercent(prev => {
        if (prev >= 98) return 98;
        return prev + 1;
      });
    }, 450);

    const checkStatus = async () => {
      try {
        const res = await api.get(`/api/security/report/component/${createdComponentId}`);
        if (res && res.report) {
          const report = res.report;
          setScanReport(report);

          if (report.scanStatus === "completed") {
            setSecurityScan(report);
            setCurrentStep("finished");
            setScanPercent(100);
            setScanText("Pipeline completed successfully.");
            setScanDuration(report.durationMs);
            clearInterval(intervalId);
            clearInterval(progressInterval);
          } else if (report.scanStatus === "failed") {
            setSecurityScan(report);
            setCurrentStep("finished");
            setScanPercent(100);
            setScanText("Pipeline execution failed: " + (report.pipelineError || "unknown"));
            clearInterval(intervalId);
            clearInterval(progressInterval);
          } else if (report.scanStatus === "running") {
            if (report.secretScan?.scannerMeta?.engine) {
              setCurrentStep("ai");
              setScanText(stepsList.find(s => s.label === "ai").text);
            } else if (report.dependencyScan?.scannerMeta?.engine) {
              setCurrentStep("secrets");
              setScanText(stepsList.find(s => s.label === "secrets").text);
            } else if (report.staticAnalysis?.scannerMeta?.engine) {
              setCurrentStep("deps");
              setScanText(stepsList.find(s => s.label === "deps").text);
            } else if (report.malwareResult?.scannerMeta?.engine) {
              setCurrentStep("static");
              setScanText(stepsList.find(s => s.label === "static").text);
            } else {
              setCurrentStep("malware");
              setScanText(stepsList.find(s => s.label === "malware").text);
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
  }, [submitted, createdComponentId, actionType]);

  const set = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t) && tags.length < 8) {
      setTags((prev) => [...prev, t]);
    }
    setTagInput("");
  };

  const removeTag = (tag) => setTags((prev) => prev.filter((t) => t !== tag));

  const handleTagKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
    if (e.key === "Backspace" && !tagInput && tags.length > 0) {
      setTags((prev) => prev.slice(0, -1));
    }
  };

  const validate = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = "Component Name is required.";
    if (!form.description.trim()) errs.description = "Description is required.";
    if (!form.category) errs.category = "Please select a category.";
    return errs;
  };  const handlePublish = async (type) => {
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    setErrors({});
    setApiError("");
    setLoading(true);
    setActionType(type);

    try {
      // 1. Create the component (always created in 'pending' status as draft)
      const res = await api.post("/api/components", { ...form, tags });
      const newComponent = res.data || res;

      if (newComponent?._id) {
        setCreatedComponentId(newComponent._id);
        if (newComponent.securityScan) {
          setSecurityScan(newComponent.securityScan);
        }

        if (type === "submit") {
          // 2. Submit for review if user didn't choose 'Save Draft'
          await api.patch(`/api/components/${newComponent._id}/submit`);
          
          if (user?.role === "admin") {
            await api.patch(`/api/components/${newComponent._id}/approve`, {
              comment: "Automatically approved upon creation by Admin.",
              overrideThreshold: true
            });
          }
        }
      }
      setSubmitted(true);
    } catch (err) {
      setApiError(err.message || "Failed to publish component. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handlePublish(actionType || "submit");
  };
  if (submitted) {
    if (actionType === "draft") {
      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 py-16 animate-scale-in text-white text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <CheckCircle2 size={32} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Draft Saved Successfully!</h2>
            <p className="mt-2 text-xs text-muted-foreground">Your component draft is indexed in your workspace queue.</p>
          </div>
          <Button onClick={() => navigate("/dashboard/components")} variant="primary" size="sm" className="mt-4">
            Go to My Components
          </Button>
        </div>
      );
    }

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
            <h2 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">Component Published!</h2>
            <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
              Your snippet component has been successfully registered. The background security scanning pipeline is executing the security check now.
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
                  <div className={cn("transition-opacity duration-300", currentStep === "scanning" ? "text-gold-300 font-bold" : "text-muted-foreground/60")}>
                    &gt; [FileSystem] Component source code extracted and prepared.
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
                          No malware signatures, syntax vulnerabilities, or plain-text secrets were detected in this component.
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
            onClick={() => navigate(`/components/${createdComponentId}`)}
            variant="primary"
            size="sm"
            className="w-full sm:w-48 text-xs font-bold h-10 shadow-[0_2px_10px_rgba(212,166,79,0.15)]"
          >
            Go to Component Details
            <ArrowRight size={13} className="ml-1.5" />
          </Button>
          <Button
            onClick={() => {
              setSubmitted(false);
              setForm({
                title: "",
                description: "",
                category: "",
                frontendCode: "",
                backendCode: "",
                dependencies: "",
                installation: "",
                documentation: "",
                currentVersion: "1.0.0",
              });
              setTags([]);
            }}
            variant="secondary"
            size="sm"
            className="w-full sm:w-48 text-xs h-10 border-white/[0.06]"
          >
            Publish Another Component
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-foreground">Publish Component</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Create and document a reusable component snippet for the marketplace.
        </p>
      </div>

      {apiError && (
        <div className="flex items-start gap-2.5 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          <AlertTriangle size={15} className="flex-shrink-0 mt-0.5" />
          <span>{apiError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <Card className="border-white/[0.06] divide-y divide-white/[0.04]">
          {/* Basic Info */}
          <div className="p-5 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/50">
              Basic Information
            </p>

            <div>
              <Label htmlFor="pub-title" required>Component Name</Label>
              <input
                id="pub-title"
                type="text"
                placeholder="e.g. Button Component"
                value={form.title}
                onChange={set("title")}
                className={`input-field w-full ${errors.title ? "border-red-500/25 focus:ring-red-500/10" : ""}`}
              />
              <FieldError message={errors.title} />
            </div>

            <div>
              <Label htmlFor="pub-desc" required>Description</Label>
              <textarea
                id="pub-desc"
                rows={3}
                placeholder="What is this component, its key properties and use-cases..."
                value={form.description}
                onChange={set("description")}
                className={`input-field w-full resize-none ${errors.description ? "border-red-500/25 focus:ring-red-500/10" : ""}`}
              />
              <FieldError message={errors.description} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="pub-category" required>Category</Label>
                <select
                  id="pub-category"
                  value={form.category}
                  onChange={set("category")}
                  className={`input-field w-full appearance-none ${errors.category ? "border-red-500/25 focus:ring-red-500/10" : ""}`}
                >
                  <option value="">Select category…</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <FieldError message={errors.category} />
              </div>

              <div>
                <Label htmlFor="pub-version">Version</Label>
                <input
                  id="pub-version"
                  type="text"
                  placeholder="1.0.0"
                  value={form.currentVersion}
                  onChange={set("currentVersion")}
                  className="input-field w-full font-mono text-xs"
                />
              </div>
            </div>
          </div>

          {/* Source Code */}
          <div className="p-5 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/50 flex items-center gap-1.5">
              <Code2 size={13} className="text-gold-400" />
              Source Code Snippets
            </p>

            <div>
              <Label htmlFor="pub-front-code">Frontend Code (React)</Label>
              <textarea
                id="pub-front-code"
                rows={6}
                placeholder="export function Button({ ... }) { ... }"
                value={form.frontendCode}
                onChange={set("frontendCode")}
                className="input-field w-full font-mono text-[11px] resize-y"
              />
            </div>

            <div>
              <Label htmlFor="pub-back-code">Backend Code (Node.js/Express)</Label>
              <textarea
                id="pub-back-code"
                rows={6}
                placeholder="router.post('/api/endpoint', (req, res) => { ... })"
                value={form.backendCode}
                onChange={set("backendCode")}
                className="input-field w-full font-mono text-[11px] resize-y"
              />
            </div>
          </div>

          {/* Integration Specs */}
          <div className="p-5 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/50 flex items-center gap-1.5">
              <Terminal size={13} className="text-gold-400" />
              Installation & Integration
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="pub-install">Local Installation Command</Label>
                <input
                  id="pub-install"
                  type="text"
                  placeholder="e.g. npm install lucide-react"
                  value={form.installation}
                  onChange={set("installation")}
                  className="input-field w-full text-xs font-mono"
                />
              </div>

              <div>
                <Label htmlFor="pub-deps">Package Dependencies</Label>
                <input
                  id="pub-deps"
                  type="text"
                  placeholder="e.g. lucide-react, clsx"
                  value={form.dependencies}
                  onChange={set("dependencies")}
                  className="input-field w-full text-xs font-mono"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="pub-usage">Usage Example</Label>
              <textarea
                id="pub-usage"
                rows={4}
                placeholder="import { Button } from './components/Button';"
                value={form.usage}
                onChange={set("usage")}
                className="input-field w-full font-mono text-[11px] resize-y"
              />
            </div>

            <div>
              <Label htmlFor="pub-docs">Detailed Documentation</Label>
              <textarea
                id="pub-docs"
                rows={3}
                placeholder="Describe API parameters, prop types, and custom configuration..."
                value={form.documentation}
                onChange={set("documentation")}
                className="input-field w-full text-xs resize-none"
              />
            </div>
          </div>

          {/* Tags */}
          <div className="p-5 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/50">
              Tags <span className="normal-case font-normal tracking-normal">(optional · max 8)</span>
            </p>

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 rounded-full bg-gold-500/10 px-2.5 py-0.5 text-xs text-gold-300 border border-gold-500/20"
                  >
                    <Tag size={10} />
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-0.5 hover:text-red-400 transition-colors"
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <input
                id="pub-tag-input"
                type="text"
                placeholder="Type tag and press Enter…"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                disabled={tags.length >= 8}
                className="input-field flex-1 text-xs disabled:opacity-40"
              />
              <button
                type="button"
                onClick={addTag}
                disabled={!tagInput.trim() || tags.length >= 8}
                className="px-4 py-2 text-xs rounded-lg border border-white/[0.08] text-muted-foreground hover:text-foreground hover:border-gold-500/30 disabled:opacity-40 transition-all"
              >
                Add
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="p-5 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/[0.01]">
            <p className="text-xs text-muted-foreground">
              Submitted components undergo design review before they appear in the public catalog.
            </p>
            <div className="flex gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => handlePublish("draft")}
                disabled={loading}
                className="flex-1 sm:flex-initial px-5 py-2.5 text-xs font-semibold rounded-lg border border-white/[0.08] hover:bg-white/[0.02] text-white transition-all text-center"
              >
                Save Draft
              </button>
              <button
                type="button"
                onClick={() => handlePublish("submit")}
                disabled={loading}
                className="flex-1 sm:flex-initial btn-primary flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-bold text-black"
              >
                {loading && actionType === "submit" ? (
                  "Submitting…"
                ) : (
                  <>
                    Submit Component <ArrowRight size={14} />
                  </>
                )}
              </button>
            </div>
          </div>
        </Card>
      </form>
    </div>
  );
}
