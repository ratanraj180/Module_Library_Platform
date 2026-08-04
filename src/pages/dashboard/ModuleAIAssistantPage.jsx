import React, {
  useState, useEffect, useRef, useCallback, useMemo, memo
} from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Send, Sparkles, Loader2, Package, Code2, Copy, Check,
  ExternalLink, BookOpen, ChevronRight, Plus, Search, Trash2,
  ChevronDown, ChevronUp, Square, RotateCcw, ThumbsUp, ThumbsDown,
  Cpu, Zap, Database, Clock, Activity, PanelRightClose, PanelRight,
  MessageSquare, User, Settings, Menu, X, Bot, AlertCircle,
  TrendingUp, Globe, Shield, Hash
} from "lucide-react";
import { processQuery } from "../../lib/moduleAIService";
import { useAuth } from "../../hooks/useAuth";
import { api } from "../../lib/api";

// ─────────────────────────────────────────────────────────────────────────────
// MARKDOWN RENDERER — parses common markdown into safe HTML
// ─────────────────────────────────────────────────────────────────────────────
function renderMarkdown(text) {
  if (!text) return "";
  let html = text;

  // Escape HTML entities first
  html = html.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  // Code blocks with language
  html = html.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) => {
    return `<div class="ai-code-block"><div class="ai-code-lang">${lang || "code"}</div><pre><code>${code.trim()}</code></pre></div>`;
  });

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code class="ai-inline-code">$1</code>');

  // Headers
  html = html.replace(/^### (.+)$/gm, '<h3 class="ai-h3">$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2 class="ai-h2">$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1 class="ai-h1">$1</h1>');

  // Bold + Italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Unordered lists
  html = html.replace(/^[\*\-] (.+)$/gm, '<li class="ai-li">$1</li>');
  html = html.replace(/(<li class="ai-li">[\s\S]*?<\/li>)(\n(?!<li))/g, '<ul class="ai-ul">$1</ul>$2');

  // Numbered lists
  html = html.replace(/^\d+\. (.+)$/gm, '<li class="ai-li-num">$1</li>');

  // Horizontal rules
  html = html.replace(/^---+$/gm, '<hr class="ai-hr" />');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="ai-link" target="_blank" rel="noopener noreferrer">$1</a>');

  // Paragraphs — wrap consecutive non-tag lines
  html = html.replace(/\n{2,}/g, '</p><p class="ai-p">');
  html = `<p class="ai-p">${html}</p>`;

  // Clean up empty paragraphs
  html = html.replace(/<p class="ai-p"><\/p>/g, '');
  html = html.replace(/<p class="ai-p">(<h[123]|<ul|<div|<hr)/g, '$1');
  html = html.replace(/(<\/h[123]>|<\/ul>|<\/div>|<hr[^>]*\/>)<\/p>/g, '$1');

  return html;
}

// ─────────────────────────────────────────────────────────────────────────────
// ERROR BOUNDARY
// ─────────────────────────────────────────────────────────────────────────────
class CardErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) return (
      <div className="text-xs text-red-400 border border-red-900/40 bg-red-950/20 rounded-lg p-3">
        Failed to render this card.
      </div>
    );
    return this.props.children;
  }
}

const RecommendationCard = memo(({ rec, onCopy, copiedCmd }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  if (!rec || !rec.name) return null;

  const isModule = rec.type === "Module";
  const confidence = rec.confidence ?? 100;
  const confidenceColor = confidence >= 80 ? "text-emerald-400" : confidence >= 60 ? "text-yellow-400" : "text-orange-400";
  const matchQuality = rec.matchQuality || (confidence >= 70 ? "Excellent Match" : "Related Match");

  const path = rec.path || (isModule ? `/dashboard/modules/${rec.id}` : `/components/${rec.id}`);
  const docsPath = rec.docsPath || rec.documentationUrl || (isModule ? `/dashboard/modules/${rec.id}` : `/components/${rec.id}#documentation`);
  const installation = rec.installation || rec.installCommand || (isModule ? `npm install ${rec.name}` : `npm install @components/${rec.name.toLowerCase().replace(/\s+/g, '-')}`);

  const handleOpen = (e) => {
    e.preventDefault();
    if (isModule) {
      const token = localStorage.getItem("token");
      if (!token || !user) {
        sessionStorage.setItem("redirectAfterLogin", path);
        navigate("/login", { state: { from: path, message: "Please login to access enterprise modules." } });
        return;
      }
      const role = (user?.role || "").toLowerCase();
      if (role !== "developer" && role !== "admin" && role !== "administrator") {
        navigate("/access-denied");
        return;
      }
      navigate(path);
    } else {
      navigate(path || "/components");
    }
  };

  const handleDownload = async (e) => {
    e.preventDefault();
    try {
      const targetId = rec.id || path.split("/").pop();
      if (isModule) {
        await api.get(`/api/modules/${targetId}/download`);
        const url = `/api/modules/${targetId}/download`;
        const a = document.createElement("a");
        a.href = url;
        a.download = `${rec.name.toLowerCase().replace(/\s+/g, "-")}-pack.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        const component = await api.get(`/api/components/${targetId}`);
        await api.get(`/api/components/${targetId}/download`);

        const code = component.frontendCode || component.backendCode || "// Reusable UI component code block";
        const extension = component.frontendCode ? "jsx" : "js";
        const filename = `${rec.name.toLowerCase().replace(/\s+/g, "-")}.${extension}`;

        const blob = new Blob([code], { type: "text/javascript" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error("RAG component download error:", err.message);
      alert("Triggering package file download locally...");
      const defaultCode = `// Reusable ${rec.name}\nexport default function ${rec.name.replace(/\s+/g, "")}() {\n  return <div>${rec.name}</div>;\n}`;
      const blob = new Blob([defaultCode], { type: "text/javascript" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${rec.name.toLowerCase().replace(/\s+/g, "-")}.jsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="group border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-[#D4A017]/30 rounded-xl p-4 transition-all duration-200 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className={`h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0 ${isModule ? "bg-indigo-500/10 text-indigo-400" : "bg-blue-500/10 text-blue-400"}`}>
            {isModule ? <Package size={13} /> : <Code2 size={13} />}
          </div>
          <div>
            <div className="text-sm font-semibold text-white leading-tight">{rec.name}</div>
            <div className={`text-[10px] font-bold ${confidenceColor}`}>{matchQuality} ({confidence}%)</div>
          </div>
        </div>
        <span className={`text-[9px] font-black uppercase border px-2 py-0.5 rounded flex-shrink-0 ${isModule ? "border-indigo-500/30 text-indigo-400 bg-indigo-500/10" : "border-blue-500/30 text-blue-400 bg-blue-500/10"}`}>
          {rec.type || "Component"}
        </span>
      </div>

      <p className="text-xs text-white/60 leading-relaxed">{rec.description || "No description available."}</p>

      {/* Meta specifications */}
      <div className="grid grid-cols-2 gap-2 text-[10px] text-white/40 bg-black/10 rounded-lg p-2 border border-white/5">
        <div><span className="font-semibold text-white/20">Technology:</span> {rec.technology || "JavaScript"}</div>
        <div><span className="font-semibold text-white/20">Version:</span> v{rec.version || "1.0.0"}</div>
        <div><span className="font-semibold text-white/20">Status:</span> <span className="text-emerald-500 font-bold">Approved</span></div>
        <div><span className="font-semibold text-white/20">Downloads:</span> {rec.downloads || 0}</div>
      </div>

      {installation && (
        <div className="flex items-center gap-2 bg-black/30 border border-white/10 rounded-lg px-3 py-2">
          <code className="flex-1 text-[10px] font-mono text-white/70 truncate">{installation}</code>
          <button onClick={() => onCopy(installation)} className="flex-shrink-0 text-white/30 hover:text-[#D4A017] transition-colors">
            {copiedCmd === installation ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
          </button>
        </div>
      )}

      <div className="flex items-center gap-3 pt-1 border-t border-white/5 justify-between flex-wrap gap-y-2">
        <div className="flex items-center gap-3">
          <button onClick={handleOpen} className="flex items-center gap-1 text-[10px] font-semibold text-[#D4A017] hover:text-[#D4A017]/85 transition-colors">
            <ExternalLink size={9} /> Open {rec.type || "Component"}
          </button>
          <span className="text-white/10">|</span>
          <Link to={docsPath} className="flex items-center gap-1 text-[10px] font-semibold text-white/40 hover:text-white/70 transition-colors">
            <BookOpen size={9} /> Docs
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={handleDownload} 
            className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-white text-[10px] font-semibold transition-all"
          >
            Download
          </button>
          <button 
            onClick={() => onCopy(installation)} 
            className="px-2.5 py-1 rounded bg-[#D4A017]/10 hover:bg-[#D4A017]/20 border border-[#D4A017]/30 text-[#D4A017] text-[10px] font-bold transition-all"
          >
            Install
          </button>
        </div>
      </div>
    </div>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// TYPING INDICATOR
// ─────────────────────────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <div className="h-8 w-8 rounded-full bg-[#D4A017]/10 border border-[#D4A017]/20 flex items-center justify-center flex-shrink-0">
        <Bot size={14} className="text-[#D4A017]" />
      </div>
      <div className="bg-white/[0.04] border border-white/10 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-3">
        <Loader2 size={12} className="animate-spin text-[#D4A017] flex-shrink-0" />
        <div className="flex gap-1">
          {[0,1,2].map(i => (
            <div key={i} className="h-1.5 w-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
        <span className="text-xs text-white/50">Thinking...</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SOURCES PANEL — collapsible
// ─────────────────────────────────────────────────────────────────────────────
function SourcesPanel({ recommendations }) {
  const [open, setOpen] = useState(false);
  if (!recommendations || recommendations.length === 0) return null;
  return (
    <div className="mt-3 border border-white/10 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-white/[0.03] hover:bg-white/[0.06] transition-colors text-xs font-semibold text-white/60"
      >
        <div className="flex items-center gap-2">
          <Database size={11} className="text-[#D4A017]" />
          <span>{recommendations.length} source{recommendations.length !== 1 ? "s" : ""} retrieved</span>
        </div>
        {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>
      {open && (
        <div className="px-4 pb-3 pt-2 space-y-1.5 bg-black/20">
          {recommendations.map((r, i) => (
            <div key={i} className="flex items-center justify-between text-[10px]">
              <span className="text-white/50 truncate">{r.name}</span>
              <span className="text-[#D4A017] font-bold flex-shrink-0 ml-2">{r.confidence}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ASSISTANT MESSAGE — isolated so streaming only re-renders this
// ─────────────────────────────────────────────────────────────────────────────
const AssistantMessage = memo(function AssistantMessage({
  msg, msgIndex, totalMessages, loading, copiedCmd, onCopy, onLike, onDislike, onRegenerate, onFollowUp, selectedEngine
}) {
  const [copied, setCopied] = useState(false);
  const handleCopyText = () => {
    navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const htmlContent = useMemo(() => renderMarkdown(msg.content), [msg.content]);

  return (
    <div className="flex flex-col gap-2 group">
      {/* Avatar + bubble row */}
      <div className="flex items-start gap-3 px-4 py-3">
        <div className="h-8 w-8 rounded-full bg-[#D4A017]/10 border border-[#D4A017]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Bot size={14} className="text-[#D4A017]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-bold text-[#D4A017]/80 uppercase tracking-wider">Module AI</span>
            <span className="text-[9px] text-white/25">{selectedEngine === "gemini" ? "Gemini 2.5 Flash" : "Semantic Engine"}</span>
            {msg.isStreaming && (
              <span className="inline-flex items-center gap-1 text-[9px] text-emerald-400 font-semibold">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Generating...
              </span>
            )}
          </div>
          <div
            className="ai-prose text-sm text-white/85 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
          {msg.isStreaming && (
            <span className="inline-block h-4 w-0.5 bg-[#D4A017] animate-pulse ml-0.5 align-text-bottom" />
          )}
        </div>
      </div>

      {/* Action bar — visible on hover */}
      {msg.content && !msg.isStreaming && (
        <div className="flex items-center gap-2 pl-14 pr-4 pb-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={handleCopyText} title="Copy response"
            className="flex items-center gap-1.5 text-[10px] text-white/40 hover:text-white/80 transition-colors px-2 py-1 rounded-md hover:bg-white/5">
            {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
            {copied ? "Copied" : "Copy"}
          </button>
          <button onClick={onLike}
            className={`flex items-center gap-1.5 text-[10px] transition-colors px-2 py-1 rounded-md hover:bg-white/5 ${msg.feedback === "liked" ? "text-emerald-400" : "text-white/40 hover:text-white/80"}`}
            title="Good response">
            <ThumbsUp size={11} />
          </button>
          <button onClick={onDislike}
            className={`flex items-center gap-1.5 text-[10px] transition-colors px-2 py-1 rounded-md hover:bg-white/5 ${msg.feedback === "disliked" ? "text-red-400" : "text-white/40 hover:text-white/80"}`}
            title="Bad response">
            <ThumbsDown size={11} />
          </button>
          {msgIndex === totalMessages - 1 && (
            <button onClick={onRegenerate}
              className="flex items-center gap-1.5 text-[10px] text-white/40 hover:text-white/80 transition-colors px-2 py-1 rounded-md hover:bg-white/5"
              title="Regenerate response">
              <RotateCcw size={11} /> Regenerate
            </button>
          )}
          <span className="text-[9px] text-white/20 ml-auto">{msg.timestamp}</span>
        </div>
      )}

      {/* Module Library Results — shown AFTER AI explanation */}
      {msg.intent === "registry_search" && !msg.isStreaming && (
        <div className="pl-14 pr-4 pb-3 space-y-3">
          {(() => {
            const hasMatches = msg.recommendations && msg.recommendations.length > 0;
            const excellentMatches = hasMatches ? msg.recommendations.filter(r => r.confidence >= 65) : [];
            const relatedMatches = hasMatches ? msg.recommendations.filter(r => r.confidence >= 40 && r.confidence < 65) : [];

            if (excellentMatches.length > 0) {
              return (
                <>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-px bg-white/[0.06]" />
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#D4A017]/25 bg-[#D4A017]/5">
                      <span className="text-sm">📚</span>
                      <span className="text-[10px] font-bold text-[#D4A017]">Available in your Module Library</span>
                      <span className="text-[9px] font-black bg-[#D4A017]/20 text-[#D4A017] px-1.5 py-0.5 rounded-full">{excellentMatches.length}</span>
                    </div>
                    <div className="flex-1 h-px bg-white/[0.06]" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {excellentMatches.map(rec => (
                      <CardErrorBoundary key={rec.name}>
                        <RecommendationCard rec={rec} copiedCmd={copiedCmd} onCopy={onCopy} />
                      </CardErrorBoundary>
                    ))}
                  </div>
                  {relatedMatches.length > 0 && (
                    <>
                      <div className="text-[10px] font-bold text-white/40 pt-2">Related Components</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {relatedMatches.map(rec => (
                          <CardErrorBoundary key={rec.name}>
                            <RecommendationCard rec={rec} copiedCmd={copiedCmd} onCopy={onCopy} />
                          </CardErrorBoundary>
                        ))}
                      </div>
                    </>
                  )}
                  <SourcesPanel recommendations={msg.recommendations} />
                </>
              );
            }

            if (relatedMatches.length > 0) {
              return (
                <>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-px bg-white/[0.06]" />
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.02]">
                      <span className="text-sm">📚</span>
                      <span className="text-[10px] font-bold text-white/50">Related Components</span>
                      <span className="text-[9px] font-black bg-white/10 text-white/50 px-1.5 py-0.5 rounded-full">{relatedMatches.length}</span>
                    </div>
                    <div className="flex-1 h-px bg-white/[0.06]" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {relatedMatches.map(rec => (
                      <CardErrorBoundary key={rec.name}>
                        <RecommendationCard rec={rec} copiedCmd={copiedCmd} onCopy={onCopy} />
                      </CardErrorBoundary>
                    ))}
                  </div>
                  <div className="border border-white/10 bg-white/[0.01] rounded-xl p-3 text-center space-y-2">
                    <div className="text-[10px] text-white/45">I couldn't find an exact match in your Module Library. Would you like to request a dedicated module?</div>
                    <Link
                      to="/dashboard/modules"
                      state={{ openPublishModal: true }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#D4A017] hover:bg-[#D4A017]/90 text-black text-[10px] font-bold transition-all shadow-sm"
                    >
                      Create Feature Request
                    </Link>
                  </div>
                </>
              );
            }

            // No matches above 40%
            return (
              <>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-px bg-white/[0.06]" />
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.02]">
                    <span className="text-sm">📚</span>
                    <span className="text-[10px] font-bold text-white/50">Module Library</span>
                  </div>
                  <div className="flex-1 h-px bg-white/[0.06]" />
                </div>
                <div className="border border-white/10 bg-white/[0.02] rounded-xl p-4 text-center space-y-3">
                  <p className="text-xs text-white/60">No matching module exists in your Module Library.</p>
                  <div className="text-[11px] text-white/40">No related modules are currently available. Would you like to request this module for future development?</div>
                  <Link
                    to="/dashboard/modules"
                    state={{ openPublishModal: true }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#D4A017] hover:bg-[#D4A017]/90 text-black text-xs font-bold transition-all shadow-md"
                  >
                    Create Feature Request
                  </Link>
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* Follow-up chips — clickable */}
      {msg.followUps && msg.followUps.length > 0 && !msg.isStreaming && !loading && msgIndex === totalMessages - 1 && (
        <div className="pl-14 pr-4 pb-3 flex flex-wrap gap-2">
          {msg.followUps.map(fu => (
            <button
              key={fu}
              onClick={() => onFollowUp(fu)}
              className="text-[10px] px-3 py-1.5 rounded-full border border-white/10 text-white/50 hover:text-white hover:border-[#D4A017]/40 hover:bg-[#D4A017]/5 transition-all"
            >
              {fu}
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// USER MESSAGE
// ─────────────────────────────────────────────────────────────────────────────
const UserMessage = memo(function UserMessage({ msg, user }) {
  const initials = user?.name ? user.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase() : "U";
  return (
    <div className="flex flex-col items-end gap-1 px-4 py-3">
      <div className="flex items-start gap-3 flex-row-reverse max-w-[85%]">
        <div className="h-8 w-8 rounded-full bg-white/10 border border-white/10 flex items-center justify-center flex-shrink-0 text-[10px] font-black text-white/70 mt-0.5">
          {initials}
        </div>
        <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl rounded-tr-sm px-4 py-2.5">
          <p className="text-sm text-white/90 leading-relaxed whitespace-pre-wrap">{msg.content}</p>
        </div>
      </div>
      <span className="text-[9px] text-white/20 pr-12">{msg.timestamp}</span>
    </div>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// WELCOME SCREEN
// ─────────────────────────────────────────────────────────────────────────────
function WelcomeScreen({ onPrompt, user }) {
  const suggestions = [
    { icon: <Shield size={14} />, label: "I need JWT authentication", category: "Module Search" },
    { icon: <Globe size={14} />, label: "Explain React hooks", category: "General" },
    { icon: <Package size={14} />, label: "Suggest a payment module", category: "Module Search" },
    { icon: <Hash size={14} />, label: "What is RAG?", category: "General" },
    { icon: <Activity size={14} />, label: "I need an admin dashboard", category: "Module Search" },
    { icon: <Code2 size={14} />, label: "How do I use MongoDB?", category: "General" },
  ];

  const firstName = user?.name?.split(" ")[0] || "there";

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 py-12 text-center">
      {/* Logo */}
      <div className="relative mb-8">
        <div className="h-16 w-16 rounded-2xl bg-[#D4A017]/10 border border-[#D4A017]/20 flex items-center justify-center mx-auto">
          <Sparkles size={28} className="text-[#D4A017]" />
        </div>
        <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-emerald-500 border-2 border-[#0a0a0a] animate-pulse" />
      </div>

      {/* Greeting */}
      <h1 className="text-3xl font-black text-white mb-2">
        Hi, {firstName}! 👋
      </h1>
      <p className="text-white/50 text-base mb-1">I'm <span className="text-[#D4A017] font-semibold">Module AI Assistant</span></p>
      <p className="text-white/35 text-sm mb-10 max-w-md leading-relaxed">
        I can help you find reusable modules, explain programming concepts, debug code, search the Module Library, and answer technical questions.
      </p>

      {/* Suggestion chips */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 w-full max-w-2xl">
        {suggestions.map((s) => (
          <button
            key={s.label}
            onClick={() => onPrompt(s.label)}
            className="flex items-center gap-3 text-left px-4 py-3 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.06] hover:border-[#D4A017]/30 transition-all duration-200 group"
          >
            <div className="flex-shrink-0 text-[#D4A017]/60 group-hover:text-[#D4A017] transition-colors">{s.icon}</div>
            <div>
              <div className="text-xs font-medium text-white/70 group-hover:text-white transition-colors leading-tight">{s.label}</div>
              <div className="text-[9px] text-white/30 mt-0.5">{s.category}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LEFT SIDEBAR
// ─────────────────────────────────────────────────────────────────────────────
function ChatSidebar({ sessions, currentSessionId, onNewChat, onSelectSession, onDeleteSession, collapsed, onToggle, user }) {
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = sessions.filter(s =>
    s.summary.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`flex flex-col bg-[#111111] border-r border-white/[0.06] transition-all duration-300 ${collapsed ? "w-0 overflow-hidden" : "w-64"} flex-shrink-0`}>
      <div className="flex flex-col h-full min-w-64">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-[#D4A017]/10 border border-[#D4A017]/20 flex items-center justify-center">
              <Bot size={13} className="text-[#D4A017]" />
            </div>
            <span className="text-sm font-bold text-white">Module AI</span>
          </div>
          <button onClick={onToggle} className="text-white/30 hover:text-white/70 transition-colors">
            <X size={14} />
          </button>
        </div>

        {/* New Chat */}
        <div className="px-3 pt-3 pb-2">
          <button
            onClick={onNewChat}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-[#D4A017]/10 border border-[#D4A017]/20 hover:bg-[#D4A017]/15 text-[#D4A017] text-xs font-semibold transition-all"
          >
            <Plus size={13} /> New Chat
          </button>
        </div>

        {/* Search */}
        <div className="px-3 pb-2">
          <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-lg px-2.5 py-1.5">
            <Search size={11} className="text-white/30 flex-shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search chats..."
              className="bg-transparent text-xs text-white/60 placeholder-white/25 outline-none flex-1"
            />
          </div>
        </div>

        {/* Sessions list */}
        <div className="flex-1 overflow-y-auto px-3 space-y-0.5">
          {sessions.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare size={18} className="text-white/15 mx-auto mb-2" />
              <p className="text-[10px] text-white/25">No previous chats</p>
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-[10px] text-white/25 text-center py-4">No results</p>
          ) : (
            <>
              <p className="text-[9px] font-bold text-white/25 uppercase tracking-widest px-2 py-2">Recent</p>
              {filtered.map(s => (
                <div key={s.id} className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all ${s.id === currentSessionId ? "bg-white/[0.07] border border-white/10" : "hover:bg-white/[0.04]"}`}>
                  <MessageSquare size={11} className="text-white/30 flex-shrink-0" />
                  <button
                    onClick={() => onSelectSession(s)}
                    className="flex-1 text-left text-xs text-white/60 truncate hover:text-white/90 transition-colors"
                  >
                    {s.summary}
                  </button>
                  <button
                    onClick={() => onDeleteSession(s.id)}
                    className="opacity-0 group-hover:opacity-100 text-white/25 hover:text-red-400 transition-all"
                  >
                    <Trash2 size={10} />
                  </button>
                </div>
              ))}
            </>
          )}
        </div>

        {/* User profile */}
        <div className="px-3 py-3 border-t border-white/[0.06]">
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <div className="h-7 w-7 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-black text-white/60 flex-shrink-0">
              {user?.name ? user.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase() : "U"}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-white/70 truncate">{user?.name || "User"}</div>
              <div className="text-[9px] text-white/30 truncate">{user?.email || ""}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RIGHT DASHBOARD PANEL
// ─────────────────────────────────────────────────────────────────────────────
function RightDashboardPanel({ promptTokens, completionTokens, responseTime, retrievedDocs, selectedEngine, collapsed, onToggle }) {
  const totalTokens = promptTokens + completionTokens;
  const dailyLimit = 50000;
  const usagePercent = Math.min(100, Math.round((totalTokens / dailyLimit) * 100));
  const estimatedCost = ((promptTokens * 0.000000075) + (completionTokens * 0.0000003)).toFixed(6);
  const remaining = Math.max(0, dailyLimit - totalTokens);

  const Metric = ({ icon, label, value, accent }) => (
    <div className="flex items-center justify-between py-2 border-b border-white/[0.05] last:border-0">
      <div className="flex items-center gap-2">
        <span className={accent ? "text-[#D4A017]" : "text-white/30"}>{icon}</span>
        <span className="text-[10px] text-white/45">{label}</span>
      </div>
      <span className={`text-[10px] font-bold tabular-nums ${accent ? "text-[#D4A017]" : "text-white/70"}`}>{value}</span>
    </div>
  );

  if (collapsed) return (
    <button onClick={onToggle} className="flex-shrink-0 w-10 bg-[#111111] border-l border-white/[0.06] flex items-start pt-4 justify-center">
      <PanelRight size={14} className="text-white/30 hover:text-[#D4A017] transition-colors" />
    </button>
  );

  return (
    <div className="flex-shrink-0 w-64 bg-[#111111] border-l border-white/[0.06] flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <Activity size={13} className="text-[#D4A017]" />
          <span className="text-xs font-bold text-white/70">AI Dashboard</span>
        </div>
        <button onClick={onToggle} className="text-white/25 hover:text-white/60 transition-colors">
          <PanelRightClose size={13} />
        </button>
      </div>

      <div className="flex-1 px-4 py-3 space-y-4">
        {/* Model status */}
        <div>
          <div className="text-[9px] font-bold text-white/25 uppercase tracking-widest mb-2">Active Model</div>
          <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-3 space-y-2">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-bold text-white/80">
                {selectedEngine === "gemini" ? "Gemini 2.5 Flash" : selectedEngine === "semantic" ? "Semantic Search" : "Hybrid RAG"}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { label: "API", val: "Connected", color: "text-emerald-400" },
                { label: "RAG", val: "Active", color: "text-blue-400" },
                { label: "Memory", val: "Active", color: "text-purple-400" },
                { label: "Vector DB", val: "Ready", color: "text-amber-400" },
              ].map(b => (
                <div key={b.label} className="bg-white/[0.03] rounded-lg px-2 py-1.5 text-center">
                  <div className="text-[8px] text-white/30">{b.label}</div>
                  <div className={`text-[9px] font-bold ${b.color}`}>{b.val}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Token usage */}
        <div>
          <div className="text-[9px] font-bold text-white/25 uppercase tracking-widest mb-2">Token Usage</div>
          <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-3">
            {/* Progress bar */}
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[9px] text-white/40">Daily Usage</span>
              <span className="text-[9px] font-bold text-white/60">{usagePercent}%</span>
            </div>
            <div className="h-1.5 w-full bg-white/[0.08] rounded-full overflow-hidden mb-3">
              <div
                className="h-full bg-gradient-to-r from-[#D4A017] to-amber-500 rounded-full transition-all duration-700"
                style={{ width: `${usagePercent}%` }}
              />
            </div>
            <Metric icon={<Zap size={10} />} label="Prompt Tokens" value={promptTokens > 0 ? promptTokens.toLocaleString() : "—"} />
            <Metric icon={<Cpu size={10} />} label="Completion Tokens" value={completionTokens > 0 ? completionTokens.toLocaleString() : "—"} />
            <Metric icon={<Hash size={10} />} label="Total Tokens" value={totalTokens > 0 ? totalTokens.toLocaleString() : "—"} accent />
            <Metric icon={<Hash size={10} />} label="Remaining" value={remaining > 0 ? remaining.toLocaleString() : "—"} />
            <Metric icon={<TrendingUp size={10} />} label="Est. Cost" value={totalTokens > 0 ? `$${estimatedCost}` : "—"} />
          </div>
        </div>

        {/* Performance */}
        <div>
          <div className="text-[9px] font-bold text-white/25 uppercase tracking-widest mb-2">Performance</div>
          <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-3">
            <Metric icon={<Clock size={10} />} label="Response Time" value={responseTime > 0 ? `${responseTime}s` : "—"} />
            <Metric icon={<Database size={10} />} label="Retrieved Docs" value={retrievedDocs > 0 ? retrievedDocs : "—"} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
export function ModuleAIAssistantPage() {
  const location = useLocation();
  const { user } = useAuth();

  // ── Layout state ───────────────────────────────────────────────────────────
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);

  // ── Session management ─────────────────────────────────────────────────────
  const [sessionId, setSessionId] = useState(() => `sess-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`);
  const [sessions, setSessions] = useState([]); // past sessions list
  const [selectedEngine, setSelectedEngine] = useState("gemini");

  // ── Messages ───────────────────────────────────────────────────────────────
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [copiedCmd, setCopiedCmd] = useState("");

  // ── Token dashboard ────────────────────────────────────────────────────────
  const [promptTokens, setPromptTokens] = useState(0);
  const [completionTokens, setCompletionTokens] = useState(0);
  const [responseTime, setResponseTime] = useState(0);
  const [retrievedDocs, setRetrievedDocs] = useState(0);

  // ── Scroll refs ────────────────────────────────────────────────────────────
  const scrollContainerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const userScrolledUpRef = useRef(false);
  const abortRef = useRef(null);
  const streamTimerRef = useRef(null);
  const inputRef = useRef(null);

  // ── Scroll logic ───────────────────────────────────────────────────────────
  const scrollToBottom = useCallback(() => {
    if (!userScrolledUpRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  const handleContainerScroll = useCallback((e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    userScrolledUpRef.current = (scrollHeight - scrollTop - clientHeight) > 60;
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, loading, scrollToBottom]);

  // ── Initial query from location state ─────────────────────────────────────
  useEffect(() => {
    if (location.state?.initialQuery) {
      handleSend(location.state.initialQuery);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Copy command ───────────────────────────────────────────────────────────
  const handleCopy = useCallback((cmd) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(cmd);
    setTimeout(() => setCopiedCmd(""), 2500);
  }, []);

  // ── New chat ───────────────────────────────────────────────────────────────
  const handleNewChat = useCallback(() => {
    if (streamTimerRef.current) clearTimeout(streamTimerRef.current);
    if (abortRef.current) abortRef.current.abort();

    if (messages.length > 0) {
      const firstUserMsg = messages.find(m => m.role === "user");
      const summary = firstUserMsg?.content?.substring(0, 40) || "Untitled Chat";
      setSessions(prev => [{ id: sessionId, summary, messages }, ...prev].slice(0, 20));
    }

    const newId = `sess-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    setSessionId(newId);
    setMessages([]);
    setLoading(false);
    userScrolledUpRef.current = false;
    inputRef.current?.focus();
  }, [messages, sessionId]);

  // ── Load past session ──────────────────────────────────────────────────────
  const handleSelectSession = useCallback((s) => {
    if (streamTimerRef.current) clearTimeout(streamTimerRef.current);
    if (abortRef.current) abortRef.current.abort();
    setSessionId(s.id);
    setMessages(s.messages);
    setLoading(false);
    userScrolledUpRef.current = false;
    setTimeout(scrollToBottom, 50);
  }, [scrollToBottom]);

  // ── Delete session ─────────────────────────────────────────────────────────
  const handleDeleteSession = useCallback((id) => {
    setSessions(prev => prev.filter(s => s.id !== id));
  }, []);

  // ── Feedback ───────────────────────────────────────────────────────────────
  const handleFeedback = useCallback((idx, type) => {
    setMessages(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], feedback: type };
      return copy;
    });
  }, []);

  // ── Stop generating ────────────────────────────────────────────────────────
  const handleStop = useCallback(() => {
    if (streamTimerRef.current) clearTimeout(streamTimerRef.current);
    if (abortRef.current) abortRef.current.abort();
    setLoading(false);
    setMessages(prev => {
      const copy = [...prev];
      const last = copy[copy.length - 1];
      if (last?.isStreaming) {
        copy[copy.length - 1] = { ...last, isStreaming: false, content: last.content + " *(stopped)*" };
      }
      return copy;
    });
  }, []);

  // ── Regenerate ─────────────────────────────────────────────────────────────
  const handleRegenerate = useCallback(() => {
    const lastUser = [...messages].reverse().find(m => m.role === "user");
    if (!lastUser || loading) return;
    setMessages(prev => {
      const copy = [...prev];
      if (copy[copy.length - 1]?.role === "assistant") copy.pop();
      return copy;
    });
    handleSend(lastUser.content, true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, loading]);

  // ── SEND MESSAGE ───────────────────────────────────────────────────────────
  const handleSend = useCallback(async (textArg, isRegen = false) => {
    const text = (textArg || inputValue).trim();
    if (!text || loading) return;

    if (streamTimerRef.current) clearTimeout(streamTimerRef.current);
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    const ts = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    if (!isRegen) {
      setMessages(prev => [...prev, { role: "user", content: text, timestamp: ts }]);
    }
    setInputValue("");
    setLoading(true);
    userScrolledUpRef.current = false;

    try {
      const result = await processQuery(text, sessionId, selectedEngine);

      // Update token metrics from real API metadata
      if (result.metadata) {
        if (result.metadata.promptTokens) setPromptTokens(p => p + result.metadata.promptTokens);
        if (result.metadata.completionTokens) setCompletionTokens(c => c + result.metadata.completionTokens);
        if (result.metadata.responseTime) setResponseTime(result.metadata.responseTime);
        if (result.metadata.retrievedCount) setRetrievedDocs(result.metadata.retrievedCount);
      }

      const fullText = result.summary || "I couldn't process that request. Please try again.";
      const recommendations = result.recommendations || [];
      const followUps = result.followUps || [];

      // Seed streaming message
      const aiTs = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "",
        isStreaming: true,
        intent: result.intent,
        recommendations,
        followUps,
        timestamp: aiTs
      }]);

      // Char-by-char streaming — fast, non-blocking
      let charIdx = 0;
      let accumulated = "";
      const CHUNK = 3; // chars per tick for performance
      const SPEED = 12; // ms per tick

      const typeNext = () => {
        if (charIdx >= fullText.length) {
          setMessages(prev => {
            const copy = [...prev];
            const last = copy[copy.length - 1];
            if (last?.isStreaming) copy[copy.length - 1] = { ...last, isStreaming: false };
            return copy;
          });
          setLoading(false);
          return;
        }

        const end = Math.min(charIdx + CHUNK, fullText.length);
        accumulated += fullText.slice(charIdx, end);
        charIdx = end;

        const snapshot = accumulated;
        setMessages(prev => {
          const copy = [...prev];
          const last = copy[copy.length - 1];
          if (last?.isStreaming) copy[copy.length - 1] = { ...last, content: snapshot };
          return copy;
        });

        // Only auto-scroll if at bottom
        if (!userScrolledUpRef.current) {
          messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
        }

        streamTimerRef.current = setTimeout(typeNext, SPEED);
      };

      streamTimerRef.current = setTimeout(typeNext, 50);

    } catch (err) {
      if (err.name === "AbortError") return;
      const errTs = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      setMessages(prev => [...prev, {
        role: "assistant",
        content: `**Error:** ${err.message || "Something went wrong. Please try again."}`,
        isStreaming: false,
        recommendations: [],
        followUps: [],
        timestamp: errTs
      }]);
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputValue, loading, sessionId, selectedEngine]);

  // ── Input key handling ─────────────────────────────────────────────────────
  const handleKeyDown = useCallback((e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  // ── Render ─────────────────────────────────────────────────────────────────
  const hasMessages = messages.length > 0;

  return (
    <>
      {/* Global dark styles for AI prose */}
      <style>{`
        .ai-prose .ai-p { margin: 0 0 0.6em; color: rgba(255,255,255,0.85); font-size: 0.875rem; line-height: 1.65; }
        .ai-prose .ai-p:last-child { margin-bottom: 0; }
        .ai-prose .ai-h1 { font-size: 1.1rem; font-weight: 800; color: #fff; margin: 1em 0 0.4em; }
        .ai-prose .ai-h2 { font-size: 1rem; font-weight: 700; color: rgba(255,255,255,0.9); margin: 0.9em 0 0.35em; }
        .ai-prose .ai-h3 { font-size: 0.875rem; font-weight: 700; color: rgba(255,255,255,0.85); margin: 0.8em 0 0.3em; }
        .ai-prose .ai-ul { margin: 0.3em 0 0.6em 1em; padding: 0; list-style: disc; }
        .ai-prose .ai-li { margin-bottom: 0.2em; color: rgba(255,255,255,0.8); font-size: 0.875rem; }
        .ai-prose .ai-li-num { margin-bottom: 0.2em; color: rgba(255,255,255,0.8); font-size: 0.875rem; list-style: decimal; }
        .ai-prose .ai-hr { border: none; border-top: 1px solid rgba(255,255,255,0.08); margin: 0.8em 0; }
        .ai-prose .ai-link { color: #D4A017; text-decoration: underline; text-underline-offset: 2px; }
        .ai-prose .ai-link:hover { color: #f0bb30; }
        .ai-prose .ai-inline-code { background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; padding: 1px 5px; font-family: 'JetBrains Mono', monospace; font-size: 0.78rem; color: #f0bb30; }
        .ai-prose .ai-code-block { background: #0d0d0d; border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; overflow: hidden; margin: 0.6em 0; }
        .ai-prose .ai-code-lang { padding: 6px 12px; font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: rgba(255,255,255,0.3); border-bottom: 1px solid rgba(255,255,255,0.06); background: rgba(255,255,255,0.02); }
        .ai-prose .ai-code-block pre { margin: 0; padding: 12px 16px; overflow-x: auto; }
        .ai-prose .ai-code-block code { font-family: 'JetBrains Mono', monospace; font-size: 0.78rem; color: rgba(255,255,255,0.85); white-space: pre; }
        .ai-prose strong { color: #fff; font-weight: 700; }
        .ai-prose em { color: rgba(255,255,255,0.7); font-style: italic; }
      `}</style>

      {/* Root container — 100% of dashboard content area, dark */}
      <div className="flex h-full bg-[#0a0a0a] text-white overflow-hidden" style={{ minHeight: "calc(100vh - 48px)" }}>

        {/* ── LEFT SIDEBAR ────────────────────────────────────────────────── */}
        <ChatSidebar
          sessions={sessions}
          currentSessionId={sessionId}
          onNewChat={handleNewChat}
          onSelectSession={handleSelectSession}
          onDeleteSession={handleDeleteSession}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(o => !o)}
          user={user}
        />

        {/* ── MAIN CHAT AREA ───────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

          {/* Chat Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06] bg-[#0d0d0d] flex-shrink-0">
            <div className="flex items-center gap-3">
              {sidebarCollapsed && (
                <button onClick={() => setSidebarCollapsed(false)} className="text-white/30 hover:text-white/70 transition-colors mr-1">
                  <Menu size={15} />
                </button>
              )}
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-[#D4A017]" />
                <span className="text-sm font-bold text-white">Module AI Assistant</span>
              </div>

              {/* Status badges */}
              <div className="hidden sm:flex items-center gap-1.5">
                {[
                  { label: "API Connected", color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
                  { label: "RAG Active", color: "text-blue-400 bg-blue-400/10 border-blue-400/20" },
                  { label: "Memory On", color: "text-purple-400 bg-purple-400/10 border-purple-400/20" },
                ].map(b => (
                  <span key={b.label} className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${b.color}`}>{b.label}</span>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Model selector */}
              <div className="flex items-center gap-1 bg-white/[0.04] border border-white/[0.08] rounded-xl p-0.5">
                {[
                  { key: "gemini", label: "Gemini" },
                  { key: "semantic", label: "Semantic" },
                  { key: "hybrid", label: "Hybrid" },
                ].map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => setSelectedEngine(opt.key)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${selectedEngine === opt.key ? "bg-[#D4A017] text-black shadow-sm" : "text-white/40 hover:text-white/70"}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Right panel toggle */}
              <button
                onClick={() => setRightPanelCollapsed(o => !o)}
                className="text-white/30 hover:text-[#D4A017] transition-colors p-1.5 rounded-lg hover:bg-white/[0.04]"
                title="Toggle dashboard"
              >
                {rightPanelCollapsed ? <PanelRight size={14} /> : <PanelRightClose size={14} />}
              </button>
            </div>
          </div>

          {/* Messages scroll container */}
          <div
            ref={scrollContainerRef}
            onScroll={handleContainerScroll}
            className="flex-1 overflow-y-auto"
          >
            {!hasMessages ? (
              <WelcomeScreen onPrompt={(p) => handleSend(p)} user={user} />
            ) : (
              <div className="max-w-4xl mx-auto py-4">
                {messages.map((msg, i) =>
                  msg.role === "user" ? (
                    <UserMessage key={i} msg={msg} user={user} />
                  ) : (
                    <AssistantMessage
                      key={i}
                      msg={msg}
                      msgIndex={i}
                      totalMessages={messages.length}
                      loading={loading}
                      copiedCmd={copiedCmd}
                      onCopy={handleCopy}
                      onLike={() => handleFeedback(i, "liked")}
                      onDislike={() => handleFeedback(i, "disliked")}
                      onRegenerate={handleRegenerate}
                      onFollowUp={handleSend}
                      selectedEngine={selectedEngine}
                    />
                  )
                )}
                {loading && !messages[messages.length - 1]?.isStreaming && (
                  <TypingIndicator />
                )}
                <div ref={messagesEndRef} className="h-4" />
              </div>
            )}
          </div>

          {/* ── STICKY INPUT BAR ──────────────────────────────────────────── */}
          <div className="flex-shrink-0 border-t border-white/[0.06] bg-[#0d0d0d] px-4 py-3">
            <div className="max-w-4xl mx-auto">
              {/* Stop generating button */}
              {loading && (
                <div className="flex justify-center mb-2">
                  <button
                    onClick={handleStop}
                    className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-semibold hover:bg-red-500/20 transition-all"
                  >
                    <Square size={10} fill="currentColor" /> Stop generating
                  </button>
                </div>
              )}

              {/* Input box */}
              <div className="flex items-end gap-3 bg-white/[0.04] border border-white/[0.10] rounded-2xl px-4 py-3 focus-within:border-[#D4A017]/40 focus-within:ring-1 focus-within:ring-[#D4A017]/20 transition-all">
                <Sparkles size={14} className="text-[#D4A017]/50 flex-shrink-0 mb-0.5" />
                <textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={e => {
                    setInputValue(e.target.value);
                    // Auto-height
                    e.target.style.height = "auto";
                    e.target.style.height = Math.min(e.target.scrollHeight, 160) + "px";
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask Module AI anything... (Shift+Enter for new line)"
                  rows={1}
                  disabled={loading}
                  className="flex-1 bg-transparent text-sm text-white/85 placeholder-white/25 outline-none resize-none leading-relaxed disabled:opacity-50"
                  style={{ maxHeight: "160px", overflowY: "auto" }}
                />
                <button
                  onClick={() => handleSend()}
                  disabled={loading || !inputValue.trim()}
                  className="flex-shrink-0 h-8 w-8 rounded-xl bg-[#D4A017] hover:bg-[#D4A017]/85 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all mb-0.5"
                >
                  <Send size={13} className="text-black" />
                </button>
              </div>

              <p className="text-center text-[9px] text-white/20 mt-2">
                Powered by <span className="text-[#D4A017]/60">Gemini AI</span> · Module Library RAG · Intent-aware routing
              </p>
            </div>
          </div>
        </div>

        {/* ── RIGHT DASHBOARD PANEL ────────────────────────────────────────── */}
        <RightDashboardPanel
          promptTokens={promptTokens}
          completionTokens={completionTokens}
          responseTime={responseTime}
          retrievedDocs={retrievedDocs}
          selectedEngine={selectedEngine}
          collapsed={rightPanelCollapsed}
          onToggle={() => setRightPanelCollapsed(o => !o)}
        />
      </div>
    </>
  );
}
