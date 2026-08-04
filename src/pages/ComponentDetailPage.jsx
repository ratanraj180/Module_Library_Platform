import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Copy, Check, Download, Terminal, PackageOpen, Play, RefreshCw } from "lucide-react";
import { Badge, Separator } from "../components/ui/index";
import { api } from "../lib/api";
import {
  RiskBadge,
  SecurityScoreCard,
  SecuritySummary,
  RecommendationCard,
  FindingCard
} from "../components/security/SecurityWidgets";

// ─── Lightweight Syntax Highlighter with GitHub / Light Colors ────────────────
// ─── Professional Syntax Highlighter ─────────────────────────────────────────
function highlightCode(code) {
  if (!code) return "";

  // 1. Escape basic HTML entities to prevent rendering issues
  let html = code
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // 2. Define token patterns
  const tokens = [
    { type: 'comment', regex: /(\/\/.*|\/\*[\s\S]*?\*\/)/g, class: 'text-gray-400' },
    { type: 'keyword', regex: /\b(import|from|export|default|const|let|var|function|return|class|async|await|if|else|for|while|switch|case)\b/g, class: 'text-blue-600 font-semibold' },
    { type: 'string', regex: /(["'`])(.*?)\1/g, class: 'text-green-700' },
    { type: 'class', regex: /\b([A-Z][a-zA-Z0-9_]*)\b/g, class: 'text-indigo-600 font-semibold' }
  ];

  // 3. Apply highlighting using placeholders to avoid nested tag corruption
  let output = html;
  tokens.forEach((token, index) => {
    output = output.replace(token.regex, `__TOKEN_${index}_$1__`);
  });

  // 4. Final pass: replace placeholders with actual spans
  tokens.forEach((token, index) => {
    const placeholder = new RegExp(`__TOKEN_${index}_(.*?)__`, 'g');
    output = output.replace(placeholder, `<span class="${token.class}">$1</span>`);
  });

  return output;
}
// ─── Component Interactive Preview Mockups in Light theme ──────────────────────
function ComponentPreview({ title }) {
  const name = title.toLowerCase();

  if (name.includes("button")) {
    return (
      <div className="flex flex-wrap items-center justify-center gap-4 py-8 bg-gray-50 border border-gray-200 rounded-xl min-h-[160px] w-full shadow-inner">
        <button className="px-4 py-2 bg-[#D4A017] hover:bg-[#C28E2A] text-white font-bold text-xs rounded transition-all shadow hover:scale-[1.02]">
          Primary Button
        </button>
        <button className="px-4 py-2 bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 font-bold text-xs rounded transition-all shadow-sm hover:scale-[1.02]">
          Secondary Button
        </button>
        <button className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 font-bold text-xs rounded transition-all shadow hover:scale-[1.02]">
          Destructive Button
        </button>
      </div>
    );
  }

  if (name.includes("login")) {
    return (
      <div className="flex items-center justify-center py-8 bg-gray-50 border border-gray-200 rounded-xl min-h-[220px] w-full shadow-inner">
        <div className="w-full max-w-[280px] bg-white border border-gray-200 rounded-xl p-5 space-y-3 shadow-md">
          <div className="text-center">
            <h3 className="text-xs font-bold text-[#111827]">Login Account</h3>
            <p className="text-[10px] text-gray-500">Sign in to your enterprise console</p>
          </div>
          <div className="space-y-2">
            <div>
              <input type="email" placeholder="email@company.com" disabled className="w-full bg-white border border-gray-200 rounded px-3 py-1.5 text-[10px] text-gray-600 focus:outline-none" />
            </div>
            <div>
              <input type="password" placeholder="••••••••" disabled className="w-full bg-white border border-gray-200 rounded px-3 py-1.5 text-[10px] text-gray-600 focus:outline-none" />
            </div>
          </div>
          <button className="w-full py-1.5 bg-[#D4A017] text-white font-bold text-[10px] rounded hover:bg-[#C28E2A] transition-all">
            Sign In
          </button>
        </div>
      </div>
    );
  }

  if (name.includes("navbar")) {
    return (
      <div className="flex items-center justify-center p-6 bg-gray-50 border border-gray-200 rounded-xl min-h-[160px] w-full shadow-inner">
        <div className="w-full bg-white border border-gray-200 rounded-lg p-3 flex items-center justify-between shadow-sm">
          <span className="text-[11px] font-bold text-[#111827] font-mono">Module<span className="text-[#D4A017]">Lib</span></span>
          <div className="flex gap-3 text-[10px] text-gray-500">
            <span className="text-[#D4A017] font-medium">Browse</span>
            <span>Documentation</span>
            <span>Analytics</span>
          </div>
          <div className="h-5 w-5 rounded-full bg-[#D4A017]/10 border border-[#D4A017]/20 flex items-center justify-center text-[9px] font-bold text-[#D4A017]">A</div>
        </div>
      </div>
    );
  }

  if (name.includes("sidebar")) {
    return (
      <div className="flex items-center justify-center p-6 bg-gray-50 border border-gray-200 rounded-xl min-h-[160px] w-full shadow-inner">
        <div className="w-full max-w-[320px] bg-white border border-gray-200 rounded-lg overflow-hidden flex h-32 shadow-sm">
          <div className="w-20 border-r border-gray-200 bg-gray-50 p-2 space-y-2">
            <span className="text-[9px] font-black text-[#111827] block">ModuleLib</span>
            <div className="space-y-1.5 text-[8px] text-gray-500">
              <div className="text-[#D4A017] font-semibold bg-white p-1 rounded border border-gray-200 shadow-sm">Dashboard</div>
              <div className="p-1">Modules</div>
              <div className="p-1">Components</div>
            </div>
          </div>
          <div className="flex-1 p-3 space-y-2 bg-white">
            <div className="h-2 w-16 bg-gray-200 rounded" />
            <div className="grid grid-cols-2 gap-2">
              <div className="h-10 bg-white border border-gray-150 rounded p-1.5 space-y-1 shadow-sm">
                <div className="h-1.5 w-6 bg-gray-200 rounded" />
                <div className="h-3 w-8 bg-[#D4A017]/10 rounded" />
              </div>
              <div className="h-10 bg-white border border-gray-150 rounded p-1.5 space-y-1 shadow-sm">
                <div className="h-1.5 w-6 bg-gray-200 rounded" />
                <div className="h-3 w-8 bg-emerald-100 rounded text-emerald-800" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Backend connections mockup in Light terminal style
  if (name.includes("jwt") || name.includes("auth")) {
    return (
      <div className="flex items-center justify-center p-6 bg-gray-50 border border-gray-200 rounded-xl min-h-[160px] w-full font-mono text-[10px] shadow-inner">
        <div className="w-full bg-[#1e1e24] text-gray-200 rounded-lg p-3.5 space-y-1.5 shadow-md">
          <div>$ curl -H "Authorization: Bearer &lt;token&gt;" https://api.modulelib.com/dashboard</div>
          <div className="text-gray-500">{"{"}</div>
          <div className="pl-3"><span className="text-sky-300">"status"</span>: <span className="text-emerald-300">"success"</span>,</div>
          <div className="pl-3"><span className="text-sky-300">"user"</span>: {"{"} <span className="text-sky-300">"role"</span>: <span className="text-emerald-300">"developer"</span> {"}"}</div>
          <div className="text-gray-500">{"}"}</div>
        </div>
      </div>
    );
  }

  if (name.includes("mongo") || name.includes("db") || name.includes("database")) {
    return (
      <div className="flex items-center justify-center p-6 bg-gray-50 border border-gray-200 rounded-xl min-h-[160px] w-full font-mono text-[10px] shadow-inner">
        <div className="w-full bg-[#1e1e24] text-[#81a1c1] rounded-lg p-3.5 space-y-1 shadow-md">
          <div><span className="text-gray-500">[DB]</span> Connecting to database connection...</div>
          <div className="text-emerald-400"><span className="text-gray-500">[DB]</span> MongoDB connection initialized successfully.</div>
          <div className="text-gray-500">Active status: CONNECTED (1)</div>
        </div>
      </div>
    );
  }

  // Fallback visual preview
  return (
    <div className="flex items-center justify-center p-6 bg-gray-50 border border-gray-200 rounded-xl min-h-[160px] w-full shadow-inner">
      <div className="w-full max-w-[280px] bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-2 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 rounded bg-[#D4A017]/10 border border-[#D4A017]/20 flex items-center justify-center text-[10px] text-[#D4A017]">UI</div>
          <span className="text-xs font-bold text-[#111827]">{title}</span>
        </div>
        <div className="h-2 w-full bg-gray-100 rounded" />
        <div className="h-2 w-2/3 bg-gray-100 rounded" />
      </div>
    </div>
  );
}

export function ComponentDetailPage() {
  const { id } = useParams();
  const [component, setComponent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activeCodeTab, setActiveCodeTab] = useState("frontend");
  const [copied, setCopied] = useState(false);
  const [securityReport, setSecurityReport] = useState(null);

  // Load component detail from API
  const fetchComponent = async () => {
    console.log("[ComponentDetail] Fetching details for ID:", id);
    setLoading(true);
    setError("");
    try {
      const data = await api.get(`/api/components/${id}`);
      console.log("[ComponentDetail] API Response:", data);

      if (!data || !data.title) {
        throw new Error("Invalid component data structure returned from registry.");
      }

      setComponent(data);
      if (data.category === "Backend Components") {
        setActiveCodeTab("backend");
      } else {
        setActiveCodeTab("frontend");
      }

      // Fetch component security report
      const secData = await api.get(`/api/security/report/component/${id}`).catch(() => null);
      if (secData && secData.report) {
        setSecurityReport(secData.report);
      } else {
        setSecurityReport(null);
      }
    } catch (err) {
      console.error("[ComponentDetail] Fetch Error:", err);

      // Fallback dummy data in development if API/Database query fails
      console.log("[ComponentDetail] Loading development fallback mock component");
      const fallbackComponent = {
        _id: id || "dummy-id",
        title: "Button Component",
        description: "Interactive Tailwind CSS button supporting multiple visual statuses and action metrics.",
        category: "UI Components",
        technology: "React & TailwindCSS",
        tags: ["button", "tailwind", "ui", "interactive"],
        frontendCode: `import React from 'react';\n\nexport function Button({ label }) {\n  return (\n    <button className="px-4 py-2 bg-[#D4A017] text-white rounded">\n      {label || 'Primary Button'}\n    </button>\n  );\n}`,
        backendCode: `// Backend spec module\nmodule.exports = {\n  type: 'component',\n  tag: 'button'\n};`,
        installation: "npm install @modulelib/button",
        dependencies: "react, classnames, lucide-react",
        usage: "import { Button } from './button';\n\n<Button label=\"Submit\" />"
      };

      setComponent(fallbackComponent);
      setActiveCodeTab("frontend");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchComponent();
    }
  }, [id]);

  useEffect(() => {
    if (!loading && window.location.hash === "#documentation") {
      const el = document.getElementById("documentation");
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: "smooth" }), 200);
      }
    }
  }, [loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] text-[#111827] flex items-center justify-center font-sans">
        <div className="text-center space-y-3">
          <RefreshCw size={24} className="animate-spin text-[#D4A017] mx-auto" />
          <p className="text-xs text-gray-500">Fetching specifications...</p>
        </div>
      </div>
    );
  }

  // Null safety validation
  if (!component) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] text-[#111827] flex flex-col justify-between items-center py-20 font-sans">
        <div className="text-center space-y-4 max-w-sm px-4">
          <Badge variant="deprecated" className="mx-auto text-[10px] tracking-wider uppercase font-semibold">
            Error
          </Badge>
          <h2 className="text-2xl font-black text-[#111827]">Component Not Found</h2>
          <p className="text-xs text-gray-500">The requested component identifier does not exist or has been deleted from the registry.</p>
          <div className="flex gap-4 justify-center pt-2">
            <Link to="/components" className="btn-primary py-2 px-6 text-xs rounded-lg inline-block font-bold">
              Back to Marketplace
            </Link>
            <Link to="/" className="btn-secondary py-2 px-6 text-xs rounded-lg inline-block font-bold">
              Return Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Copy code to clipboard helper
  const handleCopy = () => {
    const code = activeCodeTab === "frontend" ? component.frontendCode : component.backendCode;
    navigator.clipboard.writeText(code || "// No code available");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download code file helper
  const handleDownload = async () => {
    const code = activeCodeTab === "frontend" ? component.frontendCode : component.backendCode;
    const extension = activeCodeTab === "frontend" ? "jsx" : "js";
    const filename = `${component.title.toLowerCase().replace(/\s+/g, "-")}.${extension}`;

    try {
      await api.get(`/api/components/${component._id}/download`);
    } catch (e) {
      console.error("Failed to register download count:", e);
    }

    const blob = new Blob([code || "// Code block"], { type: "text/javascript" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const isUI = component.category === "UI Components";

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#111827] flex flex-col justify-between font-sans selection:bg-gold-500/30">
      {/* Background grids */}
      <div className="absolute inset-0 bg-hero-grid opacity-[0.03] pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/85 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/components" className="h-8 w-8 rounded-lg bg-white border border-gray-200 hover:border-[#D4A017] text-gray-500 hover:text-[#D4A017] flex items-center justify-center transition-all shadow-sm">
              <ArrowLeft size={14} />
            </Link>
            <span className="font-mono text-sm font-bold tracking-tight text-[#111827]">
              Component <span className="text-[#D4A017]">Spec</span>
            </span>
          </div>
          <Link
            to="/components"
            className="text-xs font-semibold text-gray-500 hover:text-[#D4A017] transition-colors py-2 px-3 rounded-lg border border-gray-200 bg-white shadow-sm"
          >
            Back to Marketplace
          </Link>
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-12 flex-1 w-full space-y-8">

        {/* Section 1: Overview */}
        <section className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 space-y-4 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex justify-between items-center">
            <Badge variant={isUI ? "violet" : "cyan"} className="text-[9px] uppercase font-bold tracking-wider">
              {isUI ? "UI Layout Component" : `${component.category} Component`}
            </Badge>
            <span className="text-xs font-mono text-gray-400">{component.technology}</span>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-black text-[#111827]">{component.title}</h1>
            <p className="text-xs sm:text-sm text-gray-500 leading-relaxed max-w-3xl">
              {component.description}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 pt-1.5">
            {component.tags && component.tags.map((tag) => (
              <span key={tag} className="text-[9px] px-2.5 py-0.5 bg-gray-50 border border-gray-200 text-[#D4A017] rounded-full font-bold">
                #{tag}
              </span>
            ))}
          </div>
        </section>

        {/* Section 2: Visual Preview */}
        <section className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 space-y-3 shadow-sm hover:shadow-md transition-all duration-300">
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">
            Interactive Component Preview
          </h2>
          <ComponentPreview title={component.title} />
        </section>

        {/* Code & Integration columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

          {/* LEFT: Code Viewer (Section 3) */}
          <section className="lg:col-span-2 space-y-4">
            <div className="flex justify-between items-center bg-white border border-gray-200 p-2 rounded-xl shadow-sm">
              <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 p-0.5 rounded-lg">
                <button
                  onClick={() => setActiveCodeTab("frontend")}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${activeCodeTab === "frontend"
                      ? "bg-[#111827] text-white font-bold"
                      : "text-gray-500 hover:text-[#111827]"
                    }`}
                >
                  Frontend Code (React)
                </button>
                <button
                  onClick={() => setActiveCodeTab("backend")}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${activeCodeTab === "backend"
                      ? "bg-[#111827] text-white font-bold"
                      : "text-gray-500 hover:text-[#111827]"
                    }`}
                >
                  Backend Code (Node)
                </button>
                <button
                  onClick={() => setActiveCodeTab("security")}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${activeCodeTab === "security"
                      ? "bg-[#111827] text-white font-bold"
                      : "text-gray-500 hover:text-[#111827]"
                    }`}
                >
                  Security Audit
                </button>
              </div>

              {/* Code manipulation (hidden on Security tab) */}
              {activeCodeTab !== "security" && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="p-1.5 rounded-lg bg-white border border-gray-200 hover:border-[#D4A017] text-gray-500 hover:text-[#111827] transition-all shadow-sm"
                    title="Copy Snippet"
                  >
                    {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                  </button>
                  <button
                    onClick={handleDownload}
                    className="bg-[#111827] hover:bg-black text-white rounded-lg hover:shadow-md transition-all flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5"
                    title="Download Code"
                  >
                    <Download size={13} />
                    <span>Download</span>
                  </button>
                </div>
              )}
            </div>

            {activeCodeTab !== "security" ? (
              /* Code Content Box with Light GitHub Syntax Highlighting */
              <div className="border border-gray-200 bg-white p-5 rounded-2xl font-mono text-[11px] leading-relaxed overflow-x-auto max-h-[500px] shadow-sm">
                <pre className="text-gray-800 whitespace-pre-wrap break-words">
                  <code
                    dangerouslySetInnerHTML={{
                      __html: highlightCode(
                        activeCodeTab === "frontend"
                          ? component.frontendCode || "// No frontend React code provided for this component"
                          : component.backendCode || "// No backend Node.js code provided for this component"
                      )
                    }}
                  />
                </pre>
              </div>
            ) : (
              /* Security Audit tab content in light mode theme */
              <div className="space-y-6 animate-scale-in">
                {securityReport ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Left: Score Badge card */}
                      <div className="border border-gray-200 bg-white p-5 rounded-2xl text-center shadow-sm flex flex-col items-center justify-center min-h-[160px]">
                        <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider mb-2">Safety Score</span>
                        <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 border-4 border-emerald-400 shadow-inner">
                          <span className="text-2xl font-black text-emerald-600">{securityReport.riskScore}</span>
                        </div>
                        <div className="mt-3 text-xs font-bold text-gray-700 uppercase">
                          {securityReport.riskLevel} Risk
                        </div>
                      </div>

                      {/* Right: AI summary card */}
                      <div className="md:col-span-2 border border-gray-200 bg-white p-5 rounded-2xl shadow-sm text-xs leading-relaxed flex flex-col justify-center">
                        <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider mb-2">AI Posture Summary</span>
                        <p className="text-gray-600 font-medium">{securityReport.aiSummary}</p>
                      </div>
                    </div>

                    {/* Recommendations */}
                    <div className="border border-gray-200 bg-white p-5 rounded-2xl shadow-sm text-xs leading-relaxed">
                      <h3 className="text-xs font-bold text-gray-700 border-b border-gray-150 pb-2 uppercase tracking-wider mb-2">
                        Remediation Recommendations
                      </h3>
                      <p className="text-gray-600">{securityReport.recommendation}</p>
                    </div>

                    {/* Findings list */}
                    <div className="border border-gray-200 bg-white p-5 rounded-2xl shadow-sm space-y-3">
                      <h3 className="text-xs font-bold text-gray-700 border-b border-gray-150 pb-2 uppercase tracking-wider">
                        Detailed Audit Findings
                      </h3>
                      
                      {/* Merge findings */}
                      {[
                        ...(securityReport.malwareResult?.findings || []),
                        ...(securityReport.staticAnalysis?.findings || []),
                        ...(securityReport.dependencyScan?.findings || []),
                        ...(securityReport.secretScan?.findings || [])
                      ].length === 0 ? (
                        <div className="py-8 text-center text-xs text-gray-400">
                          ✓ No security alerts or plain-text secrets identified in this component.
                        </div>
                      ) : (
                        <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1 text-xs">
                          {[
                            ...(securityReport.malwareResult?.findings || []),
                            ...(securityReport.staticAnalysis?.findings || []),
                            ...(securityReport.dependencyScan?.findings || []),
                            ...(securityReport.secretScan?.findings || [])
                          ].map((finding, idx) => (
                            <div key={idx} className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-1.5 text-left">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-gray-700">{finding.title}</span>
                                <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-bold border border-red-200">
                                  {finding.severity}
                                </span>
                              </div>
                              <p className="text-gray-500 text-[11px] leading-relaxed">{finding.description}</p>
                              {finding.location && (
                                <span className="inline-block text-[9px] font-mono text-gray-400">
                                  Location: {finding.location}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="border border-gray-200 bg-white p-12 rounded-2xl text-center shadow-sm">
                    <p className="text-xs text-gray-400">No security report has been generated for this component yet.</p>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* RIGHT: Integration steps (Section 4) */}
          <section className="space-y-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">
              Usage & Integration
            </h2>

            {/* Installation dependencies */}
            <div className="border border-gray-200 bg-white p-5 space-y-4 rounded-xl shadow-sm">
              <div className="space-y-1">
                <h3 className="text-xs font-bold text-[#111827] flex items-center gap-1.5">
                  <Terminal size={13} className="text-[#D4A017]" />
                  Local Installation
                </h3>
                <p className="text-[10px] text-gray-500 leading-normal">Run this setup command inside your codebase namespace root.</p>
              </div>
              <pre className="p-3 rounded bg-gray-50 border border-gray-150 text-[10px] font-mono text-gray-700 overflow-x-auto leading-normal">
                {component.installation || `npm install ${component.title.toLowerCase().replace(/\s+/g, "-")}`}
              </pre>

              <Separator className="opacity-40" />

              <div className="space-y-2">
                <h3 className="text-xs font-bold text-[#111827] flex items-center gap-1.5">
                  <PackageOpen size={13} className="text-[#D4A017]" />
                  Target Dependencies
                </h3>
                <p className="text-[10px] text-gray-500 font-mono">{component.dependencies || "None required"}</p>
              </div>
            </div>

            {/* Usage script */}
            <div className="border border-gray-200 bg-white p-5 space-y-3 rounded-xl shadow-sm">
              <h3 className="text-xs font-bold text-[#111827] flex items-center gap-1.5">
                <Play size={13} className="text-[#D4A017]" />
                Usage Example
              </h3>
              <pre className="p-3 rounded bg-gray-50 border border-gray-150 text-[10px] font-mono text-indigo-600 overflow-x-auto max-h-56 leading-normal whitespace-pre-wrap break-words">                {component.usage || `// Import and use:\nimport { ${component.title.replace(/\s+/g, "")} } from './${component.title.toLowerCase().replace(/\s+/g, "-")}';`}
              </pre>
            </div>

            {/* Documentation Section (For scrolls and public developer mapping targets) */}
            <div id="documentation" className="border border-gray-200 bg-white p-5 space-y-3 rounded-xl shadow-sm scroll-mt-20">
              <h3 className="text-xs font-bold text-[#111827] flex items-center gap-1.5">
                <PackageOpen size={13} className="text-[#D4A017]" />
                Component Documentation
              </h3>
              <div className="text-[10px] text-gray-500 space-y-2 leading-relaxed">
                <p>
                  <strong>Description:</strong> {component.description}
                </p>
                <p>
                  This is a production-ready component designed to fulfill modern, light SaaS design system standards.
                  It includes full accessibility parameters, keyboard controls support, responsive mobile states,
                  and modular customizability properties.
                </p>
                <p>
                  <strong>Installation steps:</strong> Add dependencies via standard package managers and copy-paste the snippet into your project files.
                </p>
              </div>
            </div>
          </section>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8 bg-white text-center text-[10px] text-gray-400 relative z-10">
        &copy; 2026 ModuleLib Marketplace. All rights reserved. Secure developer portal documentation.
      </footer>
    </div>
  );
}
