import { useState, useEffect, useRef, useCallback, memo, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Sparkles,
  Send,
  Loader2,
  Trash2,
  ChevronDown,
  ChevronUp,
  Bot,
  User,
  Activity,
  Zap,
  Clock,
  Hash,
  Database,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  Copy,
  Check,
  PanelRightClose,
  PanelRight,
  Package,
  BookOpen,
  ArrowRight,
  Menu,
  Square,
  FileCode,
  Lock,
  Shield,
  ExternalLink,
  Code as Code2,
  HelpCircle,
  Globe,
  Search
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { api } from "../../lib/api";
import { cn } from "../../lib/utils";

// ─── Query handler using backend API ─────────────────────────────────────────
async function processQuery(query, sessionId, engine) {
  try {
    const res = await api.get(`/api/ai/search?q=${encodeURIComponent(query)}&sessionId=${sessionId}&mode=${engine === "hybrid" ? "ai" : engine}`);
    return res;
  } catch (err) {
    console.error("AI Assistant processQuery error:", err);
    throw err;
  }
}

// ─── Minimal Markdown Renderer ────────────────────────────────────────────────
function renderMarkdown(text) {
  if (!text) return "";
  let html = text;

  // Code blocks
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => {
    const cleanCode = code
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    return `<div class="ai-code-block">
      <div class="ai-code-lang">${lang || "code"}</div>
      <pre><code>${cleanCode}</code></pre>
    </div>`;
  });

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code class="ai-inline-code">$1</code>');

  // Bold text
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");

  // Headers
  html = html.replace(/^### (.*$)/gim, '<h3 class="ai-h3">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 class="ai-h2">$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1 class="ai-h1">$1</h1>');

  // Paragraphs
  const paragraphs = html.split("\n\n").filter(Boolean);
  html = paragraphs
    .map((p) => {
      if (p.trim().startsWith("<div") || p.trim().startsWith("<h")) {
        return p;
      }
      return `<p class="ai-p">${p.replace(/\n/g, "<br/>")}</p>`;
    })
    .join("\n");

  return html;
}

// ─────────────────────────────────────────────────────────────────────────────
// RECOMMENDATION CARD
// ─────────────────────────────────────────────────────────────────────────────
const RecommendationCard = memo(function RecommendationCard({ rec, copiedCmd, onCopy }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const isModule = rec.type === "Module";
  const confidence = rec.confidence || 90;
  const matchQuality = rec.matchQuality || "Related Match";
  const path = rec.path || (isModule ? `/dashboard/modules/${rec.id}` : `/components/${rec.id}`);
  const docsPath = rec.docsPath || (isModule ? `/dashboard/modules/${rec.id}` : `/components/${rec.id}#documentation`);
  const installation = rec.installation || rec.installCommand;

  const confidenceColor =
    confidence >= 85 ? "text-indigo-600" :
    confidence >= 70 ? "text-purple-600" :
    "text-slate-500";

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
    <div className="group border border-slate-200 bg-white hover:bg-slate-50/50 hover:border-indigo-500/20 rounded-2xl p-5 shadow-sm transition-all duration-300 flex flex-col gap-3.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className={`h-8 w-8 rounded-xl flex items-center justify-center flex-shrink-0 ${isModule ? "bg-indigo-50 text-indigo-600" : "bg-purple-50 text-purple-650"}`}>
            {isModule ? <Package size={15} /> : <Code2 size={15} />}
          </div>
          <div>
            <div className="text-sm font-bold text-slate-800 leading-tight">{rec.name}</div>
            <div className={`text-[10px] font-bold ${confidenceColor}`}>{matchQuality} ({confidence}%)</div>
          </div>
        </div>
        <span className={`text-[9px] font-extrabold uppercase border px-2.5 py-0.5 rounded-full flex-shrink-0 ${isModule ? "border-indigo-150 text-indigo-600 bg-indigo-50/50" : "border-purple-150 text-purple-600 bg-purple-50/50"}`}>
          {rec.type || "Component"}
        </span>
      </div>

      <p className="text-xs text-slate-500 leading-relaxed font-medium">{rec.description || "No description available."}</p>

      {/* Meta specifications */}
      <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 bg-slate-50/50 rounded-xl p-3 border border-slate-100">
        <div><span className="font-bold text-slate-400">Technology:</span> {rec.technology || "JavaScript"}</div>
        <div><span className="font-bold text-slate-400">Version:</span> v{rec.version || "1.0.0"}</div>
        <div><span className="font-bold text-slate-400">Status:</span> <span className="text-emerald-600 font-bold">Approved</span></div>
        <div><span className="font-bold text-slate-400">Downloads:</span> {rec.downloads || 0}</div>
      </div>

      {installation && (
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
          <code className="flex-1 text-[10px] font-mono text-slate-600 truncate">{installation}</code>
          <button onClick={() => onCopy(installation)} className="flex-shrink-0 text-slate-400 hover:text-indigo-600 transition-colors">
            {copiedCmd === installation ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
          </button>
        </div>
      )}

      <div className="flex items-center gap-3 pt-2.5 border-t border-slate-100 justify-between flex-wrap gap-y-2">
        <div className="flex items-center gap-2.5">
          <button onClick={handleOpen} className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-600 hover:text-indigo-700 transition-colors">
            <ExternalLink size={10} /> Open {rec.type || "Component"}
          </button>
          <span className="text-slate-200">|</span>
          <Link to={docsPath} className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 hover:text-slate-600 transition-colors">
            <BookOpen size={10} /> Docs
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={handleDownload} 
            className="px-2.5 py-1 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 text-[10px] font-bold transition-all shadow-sm"
          >
            Download
          </button>
          <button 
            onClick={() => onCopy(installation)} 
            className="px-3 py-1 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 text-indigo-600 text-[10px] font-bold transition-all shadow-sm"
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
    <div className="flex items-start gap-3 px-6 py-4">
      <div className="h-8 w-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center flex-shrink-0">
        <Bot size={15} className="text-indigo-600 animate-pulse" />
      </div>
      <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-3 shadow-sm">
        <Loader2 size={13} className="animate-spin text-indigo-600 flex-shrink-0" />
        <div className="flex gap-1">
          {[0,1,2].map(i => (
            <div key={i} className="h-1.5 w-1.5 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
        <span className="text-xs text-slate-400 font-semibold">Thinking...</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SOURCES PANEL
// ─────────────────────────────────────────────────────────────────────────────
function SourcesPanel({ recommendations }) {
  const [open, setOpen] = useState(false);
  if (!recommendations || recommendations.length === 0) return null;
  return (
    <div className="mt-3.5 border border-slate-200 rounded-2xl overflow-hidden shadow-sm bg-white">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50/50 hover:bg-slate-50 transition-colors text-xs font-bold text-slate-600"
      >
        <div className="flex items-center gap-2">
          <Database size={13} className="text-indigo-500" />
          <span>{recommendations.length} source{recommendations.length !== 1 ? "s" : ""} retrieved</span>
        </div>
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {open && (
        <div className="px-4 pb-3 pt-2 space-y-2 bg-white border-t border-slate-100">
          {recommendations.map((r, i) => (
            <div key={i} className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
              <span className="truncate">{r.name}</span>
              <span className="text-indigo-600 font-bold flex-shrink-0 ml-2">{r.confidence}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ASSISTANT MESSAGE
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
    <div className="flex flex-col gap-2.5 group/msg px-6 py-4 border-b border-slate-100 bg-white/40">
      {/* Avatar + bubble row */}
      <div className="flex items-start gap-4">
        <div className="h-9 w-9 rounded-xl bg-indigo-50 border border-indigo-150 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
          <Bot size={16} className="text-indigo-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-wider">Module AI</span>
            <span className="text-[9px] text-slate-400 font-bold bg-slate-100 rounded-full px-2.5 py-0.5">{selectedEngine === "gemini" ? "Gemini 2.5 Flash" : "Semantic Engine"}</span>
            {msg.isStreaming && (
              <span className="inline-flex items-center gap-1.5 text-[10px] text-emerald-600 font-extrabold uppercase tracking-wide">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Generating
              </span>
            )}
          </div>
          <div
            className="ai-prose text-[13px] sm:text-sm text-slate-700 leading-relaxed font-medium"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
          {msg.isStreaming && (
            <span className="inline-block h-4 w-0.5 bg-indigo-600 animate-pulse ml-0.5 align-text-bottom" />
          )}
        </div>
      </div>

      {/* Action bar */}
      {msg.content && !msg.isStreaming && (
        <div className="flex items-center gap-2.5 pl-12 pr-4 opacity-0 group-hover/msg:opacity-100 transition-opacity">
          <button onClick={handleCopyText} title="Copy response"
            className="flex items-center gap-1.5 text-[10px] text-slate-400 hover:text-slate-800 transition-colors px-2 py-1 rounded-lg hover:bg-slate-100 font-bold">
            {copied ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
            {copied ? "Copied" : "Copy"}
          </button>
          <button onClick={onLike}
            className={`flex items-center gap-1.5 text-[10px] transition-colors px-2 py-1 rounded-lg hover:bg-slate-100 ${msg.feedback === "liked" ? "text-emerald-600" : "text-slate-400 hover:text-slate-800"}`}
            title="Good response">
            <ThumbsUp size={11} />
          </button>
          <button onClick={onDislike}
            className={`flex items-center gap-1.5 text-[10px] transition-colors px-2 py-1 rounded-lg hover:bg-slate-100 ${msg.feedback === "disliked" ? "text-red-500" : "text-slate-400 hover:text-slate-800"}`}
            title="Bad response">
            <ThumbsDown size={11} />
          </button>
          {msgIndex === totalMessages - 1 && (
            <button onClick={onRegenerate}
              className="flex items-center gap-1.5 text-[10px] text-slate-400 hover:text-slate-800 transition-colors px-2 py-1 rounded-lg hover:bg-slate-100 font-bold"
              title="Regenerate response">
              <RefreshCw size={11} className={loading ? "animate-spin" : ""} />
              Retry
            </button>
          )}
        </div>
      )}

      {/* Recommendations grid wrapper */}
      {!msg.isStreaming && msg.recommendations && msg.recommendations.length > 0 && (
        <div className="pl-12 pr-4 space-y-4">
          <div className="flex items-center gap-2.5 pt-2">
            <div className="h-px bg-slate-200 flex-1" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recommended Modules & Components</span>
            <div className="h-px bg-slate-200 flex-1" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {msg.recommendations.map((recItem) => (
              <RecommendationCard
                key={recItem.id || recItem.name}
                rec={recItem}
                copiedCmd={copiedCmd}
                onCopy={onCopy}
              />
            ))}
          </div>
        </div>
      )}

      {/* Sources collapse block */}
      {!msg.isStreaming && msg.recommendations && msg.recommendations.length > 0 && (
        <div className="pl-12 pr-4">
          <SourcesPanel recommendations={msg.recommendations} />
        </div>
      )}

      {/* Follow-up suggestions */}
      {!msg.isStreaming && msg.followUps && msg.followUps.length > 0 && (
        <div className="pl-12 pr-4 pt-1 flex flex-wrap gap-2">
          {msg.followUps.map((p) => (
            <button
              key={p}
              onClick={() => onFollowUp(p)}
              className="text-[11px] px-3.5 py-1.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 hover:border-indigo-400/40 text-slate-600 font-bold transition-all shadow-sm hover:-translate-y-0.5"
            >
              {p}
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
function UserMessage({ msg, user }) {
  const initials = user?.name ? user.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase() : "U";
  return (
    <div className="flex flex-col gap-1 px-6 py-4 bg-slate-50/30 border-b border-slate-100">
      <div className="flex items-start gap-4">
        <div className="h-9 w-9 rounded-xl bg-slate-150 border border-slate-200 flex items-center justify-center flex-shrink-0 text-xs font-black text-slate-600 mt-0.5">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">You</div>
          <p className="text-[13px] sm:text-sm text-slate-800 leading-relaxed font-bold whitespace-pre-wrap">{msg.content}</p>
        </div>
      </div>
    </div>
  );
}

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
      <div className="relative mb-8 animate-scale-in">
        <div className="h-16 w-16 rounded-2xl bg-indigo-50 border border-indigo-150 flex items-center justify-center mx-auto shadow-md">
          <Sparkles size={28} className="text-indigo-600" />
        </div>
        <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-emerald-500 border-2 border-white animate-pulse" />
      </div>

      {/* Greeting */}
      <h1 className="text-3xl font-black text-slate-800 mb-2">
        Hi, {firstName}! 👋
      </h1>
      <p className="text-slate-500 text-sm mb-1 font-semibold">I'm <span className="text-indigo-600 font-black">Module AI Assistant</span></p>
      <p className="text-slate-400 text-xs mb-10 max-w-sm leading-relaxed font-semibold">
        I can help you find reusable modules, explain programming concepts, debug code, search the Module Library, and answer technical questions.
      </p>

      {/* Suggestion chips */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 w-full max-w-2xl">
        {suggestions.map((s) => (
          <button
            key={s.label}
            onClick={() => onPrompt(s.label)}
            className="flex items-center gap-3 text-left px-4 py-3 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50/50 hover:border-indigo-500/20 shadow-sm transition-all duration-200 group"
          >
            <div className="flex-shrink-0 text-slate-400 group-hover:text-indigo-600 transition-colors">{s.icon}</div>
            <div>
              <div className="text-xs font-bold text-slate-700 group-hover:text-slate-900 transition-colors leading-tight">{s.label}</div>
              <div className="text-[9px] text-slate-400 font-extrabold uppercase mt-0.5 tracking-wider">{s.category}</div>
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
    <div className={`flex flex-col bg-white border-r border-slate-100 transition-all duration-300 ${collapsed ? "w-0 overflow-hidden" : "w-64"} flex-shrink-0`}>
      <div className="flex flex-col h-full min-w-64">
        {/* Header */}
        <div className="px-4 py-4 border-b border-slate-100 flex items-center justify-between">
          <button
            onClick={onNewChat}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-indigo-50 hover:bg-indigo-100 border border-indigo-150 rounded-xl text-xs font-bold text-indigo-700 transition-all hover:scale-[1.02]"
          >
            <Sparkles size={13} />
            <span>New Session</span>
          </button>
        </div>

        {/* Search */}
        <div className="px-3.5 py-3 border-b border-slate-100">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 focus-within:border-indigo-500 focus-within:bg-white transition-all">
            <Search size={13} className="text-slate-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search history..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-xs text-slate-800 placeholder-slate-400 outline-none flex-1 font-semibold"
            />
          </div>
        </div>

        {/* Sessions list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {filtered.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen size={16} className="text-slate-300 mx-auto mb-2" />
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">No history found</p>
            </div>
          ) : (
            <>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-3 py-2">Sessions history</p>
              {filtered.map((s) => (
                <div
                  key={s.id}
                  className={cn(
                    "group flex items-center gap-2.5 rounded-xl px-3 py-2 transition-all duration-150 border border-transparent",
                    s.id === currentSessionId
                      ? "bg-indigo-50/50 text-indigo-600 font-bold border-l-2 border-l-indigo-600 pl-[10px]"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <button
                    onClick={() => onSelectSession(s)}
                    className="flex-1 text-left text-xs truncate font-bold"
                  >
                    {s.summary}
                  </button>
                  <button
                    onClick={() => onDeleteSession(s.id)}
                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all p-0.5"
                    title="Delete chat session"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              ))}
            </>
          )}
        </div>

        {/* User profile info block */}
        <div className="px-3 py-3 border-t border-slate-100">
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-50/50 border border-slate-200">
            <div className="h-7 w-7 rounded-lg bg-indigo-50 border border-indigo-150 flex items-center justify-center text-[10px] font-black text-indigo-600 flex-shrink-0">
              {user?.name ? user.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase() : "U"}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-slate-700 truncate">{user?.name || "User"}</div>
              <div className="text-[9px] text-slate-400 font-semibold truncate leading-none mt-0.5">{user?.email || ""}</div>
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
    <div className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0 text-[11px] font-bold">
      <div className="flex items-center gap-2">
        <span className={accent ? "text-indigo-650" : "text-slate-400"}>{icon}</span>
        <span className="text-slate-500 font-semibold">{label}</span>
      </div>
      <span className={accent ? "text-indigo-600" : "text-slate-800"}>{value}</span>
    </div>
  );

  if (collapsed) return (
    <button onClick={onToggle} className="flex-shrink-0 w-10 bg-white border-l border-slate-100 flex items-start pt-4 justify-center">
      <PanelRight size={14} className="text-slate-400 hover:text-indigo-600 transition-colors" />
    </button>
  );

  return (
    <div className="flex-shrink-0 w-64 bg-white border-l border-slate-100 flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-slate-100 bg-white">
        <div className="flex items-center gap-2">
          <Activity size={13} className="text-indigo-600" />
          <span className="text-xs font-bold text-slate-800 tracking-tight">AI Telemetry</span>
        </div>
        <button onClick={onToggle} className="text-slate-400 hover:text-slate-600 transition-colors">
          <PanelRightClose size={13} />
        </button>
      </div>

      <div className="flex-1 px-4 py-3 space-y-4 bg-slate-50/20">
        {/* Model status */}
        <div>
          <div className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">Active Model</div>
          <div className="bg-white border border-slate-200 rounded-2xl p-3.5 space-y-3 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-black text-slate-850">
                {selectedEngine === "gemini" ? "Gemini 2.5 Flash" : selectedEngine === "semantic" ? "Semantic Search" : "Hybrid RAG"}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { label: "API", val: "Connected", color: "text-emerald-600" },
                { label: "RAG", val: "Active", color: "text-indigo-600" },
                { label: "Memory", val: "On", color: "text-purple-650" },
                { label: "Vector DB", val: "Ready", color: "text-cyan-600" },
              ].map(b => (
                <div key={b.label} className="bg-slate-50 border border-slate-100 rounded-xl px-2 py-1.5 text-center">
                  <div className="text-[8px] font-extrabold text-slate-400 uppercase tracking-wider leading-none mb-0.5">{b.label}</div>
                  <div className={`text-[9px] font-black ${b.color}`}>{b.val}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Token usage */}
        <div>
          <div className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">Token Usage</div>
          <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-sm">
            <div className="flex items-center justify-between mb-1.5 text-[9px] font-black uppercase text-slate-400 tracking-wider">
              <span>Daily Limit</span>
              <span>{usagePercent}%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mb-3">
              <div
                className="h-full bg-gradient-to-r from-indigo-600 to-purple-500 rounded-full transition-all duration-700"
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
          <div className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">Performance</div>
          <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-sm">
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
  const [sessions, setSessions] = useState([]); 
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

      if (result.metadata) {
        if (result.metadata.promptTokens) setPromptTokens(p => p + result.metadata.promptTokens);
        if (result.metadata.completionTokens) setCompletionTokens(c => c + result.metadata.completionTokens);
        if (result.metadata.responseTime) setResponseTime(result.metadata.responseTime);
        if (result.metadata.retrievedCount) setRetrievedDocs(result.metadata.retrievedCount);
      }

      const fullText = result.summary || "I couldn't process that request. Please try again.";
      const recommendations = result.recommendations || [];
      const followUps = result.followUps || [];

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

      let charIdx = 0;
      let accumulated = "";
      const CHUNK = 3; 
      const SPEED = 12; 

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

  const handleKeyDown = useCallback((e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const hasMessages = messages.length > 0;

  return (
    <>
      <style>{`
        .ai-prose .ai-p { margin: 0 0 0.6em; color: #334155; font-size: 0.875rem; line-height: 1.65; }
        .ai-prose .ai-p:last-child { margin-bottom: 0; }
        .ai-prose .ai-h1 { font-size: 1.1rem; font-weight: 800; color: #0f172a; margin: 1em 0 0.4em; }
        .ai-prose .ai-h2 { font-size: 1rem; font-weight: 700; color: #1e293b; margin: 0.9em 0 0.35em; }
        .ai-prose .ai-h3 { font-size: 0.875rem; font-weight: 700; color: #334155; margin: 0.8em 0 0.3em; }
        .ai-prose .ai-ul { margin: 0.3em 0 0.6em 1.25em; padding: 0; list-style: disc; }
        .ai-prose .ai-li { margin-bottom: 0.25em; color: #475569; font-size: 0.875rem; }
        .ai-prose .ai-li-num { margin-bottom: 0.25em; color: #475569; font-size: 0.875rem; list-style: decimal; }
        .ai-prose .ai-hr { border: none; border-top: 1px solid #e2e8f0; margin: 1em 0; }
        .ai-prose .ai-link { color: #4f46e5; text-decoration: underline; text-underline-offset: 2px; }
        .ai-prose .ai-link:hover { color: #4338ca; }
        .ai-prose .ai-inline-code { background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 6px; padding: 1px 5px; font-family: 'Geist Mono', monospace; font-size: 0.78rem; color: #4f46e5; }
        .ai-prose .ai-code-block { background: #0f172a; border: 1px solid #334155; border-radius: 12px; overflow: hidden; margin: 0.75em 0; }
        .ai-prose .ai-code-lang { padding: 6px 12px; font-size: 0.65rem; font-weight: 750; text-transform: uppercase; letter-spacing: 0.08em; color: #94a3b8; border-bottom: 1px solid #1e293b; background: rgba(255,255,255,0.02); }
        .ai-prose .ai-code-block pre { margin: 0; padding: 12px 16px; overflow-x: auto; }
        .ai-prose .ai-code-block code { font-family: 'Geist Mono', monospace; font-size: 0.78rem; color: #f1f5f9; white-space: pre; }
        .ai-prose strong { color: #0f172a; font-weight: 800; }
        .ai-prose em { color: #475569; font-style: italic; }
      `}</style>
 
      {/* Root container */}
      <div className="flex h-full bg-slate-50/50 text-slate-800 overflow-hidden border border-slate-200 rounded-2xl" style={{ minHeight: "calc(100vh - 84px)" }}>

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
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white/40">

          {/* Chat Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-white flex-shrink-0">
            <div className="flex items-center gap-3">
              {sidebarCollapsed && (
                <button onClick={() => setSidebarCollapsed(false)} className="text-slate-400 hover:text-slate-700 transition-colors mr-1">
                  <Menu size={15} />
                </button>
              )}
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-indigo-650" />
                <span className="text-xs font-black text-slate-800 tracking-tight">Module AI Assistant</span>
              </div>

              {/* Status badges */}
              <div className="hidden sm:flex items-center gap-1.5">
                {[
                  { label: "API Connected", color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
                  { label: "RAG Active", color: "text-indigo-600 bg-indigo-50 border-indigo-100" },
                  { label: "Memory On", color: "text-purple-600 bg-purple-50 border-purple-100" },
                ].map(b => (
                  <span key={b.label} className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${b.color}`}>{b.label}</span>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Model selector */}
              <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl p-0.5 shadow-inner">
                {[
                  { key: "gemini", label: "Gemini" },
                  { key: "semantic", label: "Semantic" },
                  { key: "hybrid", label: "Hybrid" },
                ].map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => setSelectedEngine(opt.key)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${selectedEngine === opt.key ? "bg-indigo-600 text-white shadow-sm" : "text-slate-450 hover:text-slate-700"}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Right panel toggle */}
              <button
                onClick={() => setRightPanelCollapsed(o => !o)}
                className="text-slate-400 hover:text-indigo-600 transition-colors p-1.5 rounded-lg hover:bg-slate-50"
                title="Toggle metrics panel"
              >
                {rightPanelCollapsed ? <PanelRight size={14} /> : <PanelRightClose size={14} />}
              </button>
            </div>
          </div>

          {/* Messages scroll container */}
          <div
            ref={scrollContainerRef}
            onScroll={handleContainerScroll}
            className="flex-1 overflow-y-auto bg-slate-50/10"
          >
            {!hasMessages ? (
              <WelcomeScreen onPrompt={(p) => handleSend(p)} user={user} />
            ) : (
              <div className="py-2">
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
          <div className="flex-shrink-0 border-t border-slate-100 bg-white/70 backdrop-blur-md px-6 py-4">
            <div className="max-w-4xl mx-auto">
              {/* Stop generating button */}
              {loading && (
                <div className="flex justify-center mb-3.5">
                  <button
                    onClick={handleStop}
                    className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-red-200 bg-red-50 text-red-650 text-xs font-bold hover:bg-red-100 transition-all shadow-sm"
                  >
                    <Square size={10} fill="currentColor" /> Stop Generating
                  </button>
                </div>
              )}

              {/* Input box */}
              <div className="flex items-end gap-3 bg-white border border-slate-250 rounded-2xl px-4 py-3 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all shadow-sm">
                <Sparkles size={16} className="text-indigo-500 flex-shrink-0 mb-1" />
                <textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={e => {
                    setInputValue(e.target.value);
                    e.target.style.height = "auto";
                    e.target.style.height = Math.min(e.target.scrollHeight, 160) + "px";
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask Module AI anything... (Shift+Enter for new line)"
                  rows={1}
                  disabled={loading}
                  className="flex-1 bg-transparent text-xs sm:text-sm text-slate-800 placeholder-slate-400 outline-none resize-none leading-relaxed disabled:opacity-50 font-medium"
                  style={{ maxHeight: "160px", overflowY: "auto" }}
                />
                <button
                  onClick={() => handleSend()}
                  disabled={loading || !inputValue.trim()}
                  className="flex-shrink-0 h-8 w-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all mb-0.5 shadow-sm"
                >
                  <Send size={13} className="text-white" />
                </button>
              </div>

              <p className="text-center text-[10px] text-slate-400 font-semibold mt-2.5">
                Powered by <span className="text-indigo-600 font-bold">Gemini AI</span> · Module Library RAG · Intent-aware routing
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
