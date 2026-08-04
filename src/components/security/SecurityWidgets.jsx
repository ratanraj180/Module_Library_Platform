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
  Layers,
  ArrowRight,
  Eye,
  Settings
} from "lucide-react";
import { cn } from "../../lib/utils";

// ─── 1. RiskBadge ─────────────────────────────────────────────────────────────
export function RiskBadge({ level }) {
  const normalized = (level || 'safe').toLowerCase();
  
  const styles = {
    safe:     "bg-emerald-500/10 text-emerald-400 border-emerald-500/25 shadow-[0_0_15px_rgba(16,185,129,0.1)]",
    low:      "bg-emerald-500/10 text-emerald-400 border-emerald-500/25 shadow-[0_0_15px_rgba(16,185,129,0.1)]",
    medium:   "bg-yellow-500/10 text-yellow-400 border-yellow-500/25 shadow-[0_0_15px_rgba(234,179,8,0.1)]",
    high:     "bg-orange-500/10 text-orange-400 border-orange-500/25 shadow-[0_0_15px_rgba(249,115,22,0.1)]",
    critical: "bg-red-500/10 text-red-400 border-red-500/25 animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.2)]",
  };

  const label = {
    safe:     "SAFE",
    low:      "SAFE",
    medium:   "MEDIUM RISK",
    high:     "HIGH RISK",
    critical: "CRITICAL RISK",
  };

  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold font-mono tracking-wider border transition-all duration-300",
      styles[normalized] || styles.safe
    )}>
      <span className="h-1.5 w-1.5 rounded-full bg-current animate-ping" />
      {label[normalized] || "SAFE"}
    </span>
  );
}

// ─── 2. SecurityScoreCard ──────────────────────────────────────────────────────
export function SecurityScoreCard({ score, level }) {
  const normLevel = (level || 'safe').toLowerCase();
  const hue = Math.max(0, Math.min(100, score)) * 1.2; // 0 = red, 120 = green
  
  const colorMap = {
    safe:     "text-emerald-400 border-emerald-500/20",
    low:      "text-emerald-400 border-emerald-500/20",
    medium:   "text-yellow-400 border-yellow-500/20",
    high:     "text-orange-400 border-orange-500/20",
    critical: "text-red-400 border-red-500/20",
  };

  return (
    <div className="relative rounded-2xl border border-white/[0.06] bg-card/40 backdrop-blur-md p-6 overflow-hidden flex flex-col items-center text-center">
      {/* Background radial glow */}
      <div 
        className="absolute -top-12 -right-12 w-32 h-32 rounded-full filter blur-[40px] opacity-20 transition-all duration-500"
        style={{ backgroundColor: `hsl(${hue}, 90%, 50%)` }}
      />
      
      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Security Score</span>
      
      {/* Dial Gauge */}
      <div className="relative flex items-center justify-center my-5 w-32 h-32">
        <svg className="w-full h-full transform -rotate-90">
          {/* Track */}
          <circle cx="64" cy="64" r="54" className="stroke-white/[0.04] fill-none" strokeWidth="6" />
          {/* Progress */}
          <circle 
            cx="64" cy="64" r="54" 
            className="fill-none transition-all duration-1000 ease-out" 
            strokeWidth="8" 
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 54}
            strokeDashoffset={2 * Math.PI * 54 * (1 - score / 100)}
            stroke={`hsl(${hue}, 85%, 45%)`}
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center">
          <span className="text-4xl font-black font-mono tracking-tighter text-foreground leading-none">{score}</span>
          <span className="text-[10px] text-muted-foreground mt-0.5">out of 100</span>
        </div>
      </div>

      <RiskBadge level={normLevel} />
      
      <p className="text-[11px] text-muted-foreground/60 leading-relaxed mt-4">
        {score === 100 
          ? "No vulnerabilities, credentials, or malicious patterns were identified."
          : `Module has security flags. Remediate to improve safety score.`
        }
      </p>
    </div>
  );
}

// ─── 3. SecurityProgress ──────────────────────────────────────────────────────
export function SecurityProgress({ progress, text }) {
  return (
    <div className="space-y-2 w-full animate-fade-in">
      <div className="flex items-center justify-between text-xs font-mono">
        <span className="font-semibold text-gold-300 flex items-center gap-2">
          <RefreshCw size={12} className="animate-spin text-gold-300" />
          {text || "Running security tests..."}
        </span>
        <span className="text-gold-300 font-bold">{progress}%</span>
      </div>
      <div className="h-2 w-full bg-white/[0.06] rounded-full overflow-hidden border border-white/[0.04]">
        <div
          className="h-full bg-gradient-to-r from-gold-600 to-gold-400 transition-all duration-500 ease-out shadow-[0_0_10px_rgba(212,166,79,0.3)]"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

// ─── 4. SecurityTimeline ──────────────────────────────────────────────────────
export function SecurityTimeline({ currentStep, duration }) {
  const steps = [
    { id: 'uploading', label: 'Uploading file package' },
    { id: 'scanning',  label: 'Triggering pipeline' },
    { id: 'malware',   label: 'Malware detection scan' },
    { id: 'static',    label: 'Static code audit (Semgrep)' },
    { id: 'deps',      label: 'Dependency vulnerabilities (Audit)' },
    { id: 'secrets',   label: 'Credential leak scanner' },
    { id: 'ai',        label: 'AI Summary Generation' },
    { id: 'finished',  label: 'Scan finished' },
  ];

  const getStepIndex = (id) => steps.findIndex(s => s.id === id);
  const activeIdx = getStepIndex(currentStep);

  return (
    <div className="w-full bg-card/30 border border-white/[0.06] rounded-2xl p-5 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4 border-b border-white/[0.04] pb-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60">Execution Timeline</h3>
        {duration && (
          <div className="flex items-center gap-1.5 text-xs text-gold-300/80 font-mono">
            <Clock size={12} />
            <span>Duration: {duration}ms</span>
          </div>
        )}
      </div>

      <div className="relative pl-6 space-y-4">
        {/* Timeline bar */}
        <div className="absolute left-[7px] top-1.5 bottom-1.5 w-0.5 bg-white/[0.04] rounded" />
        
        {steps.map((st, idx) => {
          const isCompleted = idx < activeIdx;
          const isActive = idx === activeIdx;
          
          return (
            <div key={st.id} className="relative flex items-start gap-4 text-xs transition-opacity duration-300">
              {/* Timeline indicator node */}
              <div className={cn(
                "absolute -left-[24px] top-1 h-3.5 w-3.5 rounded-full border flex items-center justify-center transition-all duration-300",
                isCompleted 
                  ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]" 
                  : isActive
                  ? "bg-gold-500/20 border-gold-500 text-gold-300 animate-pulse shadow-[0_0_10px_rgba(212,166,79,0.3)]"
                  : "bg-background border-white/[0.06] text-muted-foreground/30"
              )}>
                {isCompleted && <CheckCircle2 size={8} className="text-emerald-400" />}
              </div>

              <div className="flex flex-col">
                <span className={cn(
                  "font-medium",
                  isCompleted ? "text-muted-foreground/60 line-through" :
                  isActive ? "text-foreground font-semibold" : "text-muted-foreground/30"
                )}>
                  {st.label}
                </span>
                {isActive && (
                  <span className="text-[10px] text-gold-300 font-mono mt-0.5 animate-pulse">Scanning context...</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── 5. FindingCard ───────────────────────────────────────────────────────────
export function FindingCard({ finding, category }) {
  const sevColors = {
    critical: "text-red-400 border-red-500/20 bg-red-500/[0.02]",
    high:     "text-orange-400 border-orange-500/20 bg-orange-500/[0.02]",
    medium:   "text-yellow-400 border-yellow-500/20 bg-yellow-500/[0.02]",
    low:      "text-emerald-400 border-emerald-500/20 bg-emerald-500/[0.02]",
    info:     "text-blue-400 border-blue-500/20 bg-blue-500/[0.02]"
  };

  return (
    <div className={cn(
      "rounded-xl border p-4 flex flex-col gap-3 transition-all duration-300 hover:border-white/[0.12]",
      sevColors[finding.severity] || "border-white/[0.06] bg-card/20"
    )}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-bold text-foreground">{finding.title}</span>
          <span className="text-[10px] text-muted-foreground/50 font-mono flex items-center gap-1">
            <Terminal size={10} />
            {finding.location || "unknown"}
          </span>
        </div>
        <span className={cn(
          "text-[9px] font-bold font-mono px-2 py-0.5 rounded border uppercase tracking-wider",
          finding.severity === "critical" ? "bg-red-500/10" :
          finding.severity === "high" ? "bg-orange-500/10" :
          finding.severity === "medium" ? "bg-yellow-500/10" :
          "bg-white/[0.04]"
        )}>
          {finding.severity}
        </span>
      </div>

      <p className="text-[11px] text-muted-foreground leading-relaxed">
        {finding.description}
      </p>

      {/* Code Snippet / Masked Secret */}
      {finding.metadata && (finding.metadata.code || finding.metadata.maskedValue) && (
        <div className="bg-background/80 rounded-lg p-2.5 border border-white/[0.04] font-mono text-[10px] text-muted-foreground/80 overflow-x-auto whitespace-pre">
          {finding.metadata.code || `Secret: ${finding.metadata.maskedValue}`}
        </div>
      )}

      {/* Dependency fixedVersion info */}
      {finding.metadata && finding.metadata.fixedIn && (
        <div className="flex items-center justify-between text-[10px] font-mono mt-1 pt-2 border-t border-white/[0.04]">
          <span className="text-muted-foreground/50">Installed: {finding.metadata.installedVersions || "unknown"}</span>
          <span className="text-emerald-400 font-bold">Fix: {finding.metadata.fixedIn}</span>
        </div>
      )}
    </div>
  );
}

// ─── 6. RecommendationCard ────────────────────────────────────────────────────
export function RecommendationCard({ recommendation }) {
  if (!recommendation) return null;

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-card/30 p-5 backdrop-blur-sm flex flex-col gap-4">
      <div className="flex items-center gap-2 border-b border-white/[0.04] pb-3">
        <Zap size={14} className="text-gold-300" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60">Remediation Steps</h3>
      </div>
      
      <div className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line space-y-2">
        {recommendation}
      </div>
    </div>
  );
}

// ─── 7. SecuritySummary ────────────────────────────────────────────────────────
export function SecuritySummary({ summary }) {
  if (!summary) return null;

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-card/30 p-5 backdrop-blur-sm flex flex-col gap-3">
      <div className="flex items-center gap-2 border-b border-white/[0.04] pb-3">
        <FileText size={14} className="text-gold-300" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60">AI Executive Summary</h3>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed font-medium">
        {summary}
      </p>
    </div>
  );
}
