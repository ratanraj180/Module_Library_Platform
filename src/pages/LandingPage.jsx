import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Package, Shield, ArrowRight, Lock, Terminal, CheckCircle2, 
  Download, Layers, BookOpen, Users, GitBranch, 
  ArrowRightLeft, AlertTriangle, ExternalLink, Clock, Sparkles
} from "lucide-react";
import { Logo } from "../components/shared/Logo";

export function LandingPage() {
  const navigate = useNavigate();
  const [aiQuery, setAiQuery] = useState("");
 
  // Refs for animations
  const heroBadgeRef = useRef(null);
  const heroTitleRef = useRef(null);
  const heroSubtitleRef = useRef(null);
  const browseBtnRef = useRef(null);
  const demoSectionRef = useRef(null);
  const workflowSectionRef = useRef(null);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    import("animejs").then((mod) => {
      const anime = typeof mod.default === "function" ? mod.default : typeof mod === "function" ? mod : null;
      if (!anime) return;

      // 1. Hero Badge pop-in
      if (heroBadgeRef.current) {
        anime({
          targets: heroBadgeRef.current,
          opacity: [0.8, 1],
          scale: [0.95, 1],
          duration: 350,
          easing: "easeOutExpo",
        });
      }

      // 2. Hero Title fade & slide on load (Y=20 to Y=0, opacity 0.8 to 1)
      if (heroTitleRef.current) {
        anime({
          targets: heroTitleRef.current,
          opacity: [0.8, 1],
          translateY: [20, 0],
          duration: 500,
          easing: "easeOutExpo",
        });
      }

      // 3. Hero Subtitle appears with delay
      if (heroSubtitleRef.current) {
        anime({
          targets: heroSubtitleRef.current,
          opacity: [0.8, 1],
          translateY: [15, 0],
          duration: 500,
          delay: 150,
          easing: "easeOutExpo",
        });
      }

      // 4. Browse Components button scales 0.95 to 1
      if (browseBtnRef.current) {
        anime({
          targets: browseBtnRef.current,
          scale: [0.95, 1],
          duration: 400,
          delay: 250,
          easing: "easeOutBack",
        });
      }

      // 5. Stagger demo profile cards
      if (demoSectionRef.current) {
        const cards = demoSectionRef.current.querySelectorAll(".demo-card");
        if (cards.length) {
          anime({
            targets: Array.from(cards),
            translateY: [10, 0],
            opacity: [0.9, 1],
            delay: anime.stagger(100),
            duration: 450,
            easing: "easeOutQuad",
          });
        }
      }

      // 6. Workflow arrows animating left-to-right
      if (workflowSectionRef.current) {
        const arrows = workflowSectionRef.current.querySelectorAll(".workflow-arrow");
        if (arrows.length) {
          anime({
            targets: Array.from(arrows),
            translateX: [-5, 0],
            opacity: [0.4, 0.8],
            delay: anime.stagger(120),
            duration: 500,
            loop: true,
            direction: "alternate",
            easing: "easeInOutQuad",
          });
        }
      }
    });
  }, []);

  // Quick login demo credentials
  const demoUsers = [
    {
      role: "Developer",
      email: "dev@test.com",
      password: "password123",
      color: "border-gray-200 hover:border-blue-500/20 bg-blue-50/20",
      badgeColor: "bg-blue-100 text-blue-800 ring-1 ring-blue-500/20",
      desc: "Browse registry modules, download packages, view credentials, and publish module drafts.",
    },
    {
      role: "Admin",
      email: "admin@test.com",
      password: "password123",
      color: "border-gray-200 hover:border-emerald-500/20 bg-emerald-50/20",
      badgeColor: "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-500/20",
      desc: "Approve or reject module submissions, manage user roles, and monitor entire platform metrics.",
    },
  ];

  const handleDemoLogin = (email, password) => {
    navigate("/login", { state: { email, password } });
  };

  const handleScroll = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="relative min-h-screen bg-[#FAFAFA] text-[#111827] overflow-hidden font-sans scroll-smooth">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-hero-grid opacity-[0.03] pointer-events-none" />

      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Logo size="md" />
            <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-gray-500">
              <Link to="/features" className="hover:text-[#111827] transition-colors nav-link-animated">Features</Link>
              <button onClick={() => handleScroll("demo-login")} className="hover:text-[#111827] transition-colors nav-link-animated">Quick Access</button>
              <button onClick={() => handleScroll("analytics")} className="hover:text-[#111827] transition-colors nav-link-animated">Analytics</button>
              <button onClick={() => handleScroll("workflow")} className="hover:text-[#111827] transition-colors nav-link-animated">Workflow</button>
              <button onClick={() => handleScroll("permissions")} className="hover:text-[#111827] transition-colors nav-link-animated">Governance</button>
              <button onClick={() => handleScroll("docs")} className="hover:text-[#111827] transition-colors nav-link-animated">Documentation</button>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-xs font-bold text-gray-500 hover:text-[#111827] transition-colors nav-link-animated">
              Sign In
            </Link>
            <Link to="/signup" className="bg-[#111827] hover:bg-black text-white py-2 px-4 text-xs rounded-lg flex items-center gap-1 font-bold transition-all btn-ripple hover:scale-[1.03]">
              Register
              <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pt-24 pb-16 text-center space-y-8">
        <div ref={heroBadgeRef} className="inline-flex items-center gap-2 rounded-full border border-[#D4A017]/30 bg-[#D4A017]/5 px-3.5 py-1 text-xs text-[#D4A017] font-semibold">
          <Sparkles size={12} className="animate-badge-pulse" />
          <span className="tracking-wider uppercase text-[10px]">Secured Enterprise Registry</span>
        </div>

        <h1 ref={heroTitleRef} className="text-4xl sm:text-6xl font-black tracking-tight text-[#111827] leading-[1.1] max-w-3xl mx-auto">
          The Central Hub for your <br />
          <span className="text-[#D4A017]">Enterprise Modules</span>
        </h1>

        <p ref={heroSubtitleRef} className="text-sm sm:text-base text-gray-500 max-w-xl mx-auto leading-relaxed">
          Share, audit, and integrate certified reusable code components, utility libraries, and infrastructure pipelines safely across all engineering teams.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link 
            to="/components" 
            ref={browseBtnRef}
            className="bg-[#111827] hover:bg-black text-white w-full sm:w-auto py-3 px-8 text-sm rounded-xl font-bold flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer btn-ripple"
          >
            Browse Components
            <ArrowRight size={16} />
          </Link>
          <Link 
            to="/login" 
            className="w-full sm:w-auto py-3 px-8 text-sm rounded-xl border border-gray-200 bg-white hover:bg-gray-50 hover:scale-[1.03] text-[#111827] font-semibold flex items-center justify-center gap-2 transition-all shadow-sm btn-ripple"
          >
            Sign In
          </Link>
        </div>
      </section>

      {/* ModuleAI Assistant Section */}
      <section className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-1 scroll-mt-20 mb-16 select-text">
        {/* Floating background gradient blobs with low opacity */}
        <div className="absolute -top-12 -left-12 w-64 h-64 bg-blue-300 rounded-full mix-blend-multiply filter blur-2xl opacity-20 animate-blob pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-amber-200 rounded-full mix-blend-multiply filter blur-2xl opacity-25 animate-blob animation-delay-2000 pointer-events-none" />
        <div className="absolute top-1/2 left-1/3 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-2xl opacity-15 animate-blob animation-delay-4000 pointer-events-none" />

        <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-amber-50 rounded-3xl border border-slate-200 shadow-2xl backdrop-blur-lg p-8 sm:p-12 space-y-8 text-center">
          
          {/* Header Area */}
          <div className="space-y-4 flex flex-col items-center">
            {/* Glowing AI Icon */}
            <div className="relative">
              <div className="absolute inset-0 bg-[#D4A017] rounded-full filter blur-md opacity-35 animate-pulse" />
              <div className="relative h-14 w-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-[#D4A017] flex items-center justify-center text-white shadow-lg border border-white/20">
                <Sparkles size={28} className="animate-spin-slow" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-950 bg-clip-text text-transparent">
                Ask ModuleAI
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto leading-relaxed font-medium">
                Describe your requirements in plain English and receive intelligent module recommendations instantly.
              </p>
            </div>
          </div>

          {/* Search Bar Input Container */}
          <div className="max-w-xl mx-auto relative group">
            {/* Premium Input Container */}
            <div className="flex items-center gap-3 bg-white/90 border border-slate-200 rounded-2xl p-2.5 text-left shadow-lg focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all duration-300 relative z-20">
              <Sparkles size={16} className="text-[#D4A017] ml-2 flex-shrink-0 animate-pulse" />
              <input
                type="text"
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && aiQuery.trim()) {
                    navigate("/module-ai", { state: { initialQuery: aiQuery } });
                  }
                }}
                placeholder="Example: I need authentication and chat support for my project..."
                className="flex-1 bg-transparent px-1 py-2 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-0 border-none outline-none font-medium select-text"
              />
              <button
                onClick={() => {
                  if (aiQuery.trim()) {
                    navigate("/module-ai", { state: { initialQuery: aiQuery } });
                  } else {
                    navigate("/module-ai");
                  }
                }}
                className="bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-700 hover:to-indigo-700 text-white py-2 sm:py-2.5 px-5 text-xs font-bold rounded-xl transition-all shadow-md hover:shadow-indigo-500/20 hover:scale-[1.03] active:scale-[0.98] flex items-center gap-1.5 flex-shrink-0 group/btn"
              >
                <span>Launch ModuleAI</span>
                <ArrowRight size={13} className="transition-transform duration-300 group-hover/btn:translate-x-1" />
              </button>
            </div>
          </div>

          {/* Suggested Prompts Section */}
          <div className="max-w-xl mx-auto space-y-3 text-left">
            <span className="text-[9px] uppercase font-extrabold text-slate-400 tracking-wider">Suggested Prompts</span>
            <div className="flex flex-wrap gap-2">
              {[
                { text: "Need authentication", color: "hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300" },
                { text: "Need dashboard components", color: "hover:bg-purple-50 hover:text-purple-600 hover:border-purple-300" },
                { text: "Need file upload", color: "hover:bg-orange-50 hover:text-orange-600 hover:border-orange-300" },
                { text: "Need analytics", color: "hover:bg-green-50 hover:text-green-600 hover:border-green-300" },
                { text: "Need admin panel modules", color: "hover:bg-red-50 hover:text-red-600 hover:border-red-300" }
              ].map(prompt => (
                <Link
                  key={prompt.text}
                  to="/module-ai"
                  state={{ initialQuery: prompt.text }}
                  className={`text-[11px] bg-white border border-slate-200 rounded-full px-3.5 py-1.5 text-slate-600 font-bold transition-all shadow-sm hover:scale-[1.03] hover:-translate-y-0.5 ${prompt.color}`}
                >
                  {prompt.text}
                </Link>
              ))}
            </div>
          </div>

          {/* Premium AI Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-slate-100 max-w-3xl mx-auto">
            {[
              {
                title: "Natural Language Understanding",
                desc: "Understand developer requirements written in plain English.",
                icon: "🤖"
              },
              {
                title: "Smart Module Discovery",
                desc: "Recommend components and modules automatically.",
                icon: "📦"
              },
              {
                title: "Architecture Suggestions",
                desc: "Suggest implementation ideas and system design improvements.",
                icon: "⚡"
              }
            ].map(card => (
              <div 
                key={card.title} 
                className="bg-white/60 border border-slate-150 p-4 rounded-2xl text-left shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-300 hover:bg-white"
              >
                <div className="text-xl mb-2">{card.icon}</div>
                <h4 className="text-xs font-extrabold text-slate-900 mb-1">{card.title}</h4>
                <p className="text-[10px] text-slate-500 leading-relaxed font-medium">{card.desc}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Section 1: Quick Login Demo Cards */}
      <section id="demo-login" className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-16 scroll-mt-20 border-t border-gray-200 bg-white">
        <div className="text-center space-y-2 mb-10">
          <h2 className="text-xl sm:text-2xl font-bold text-[#111827]">Quick Access Demo Profiles</h2>
          <p className="text-xs sm:text-sm text-gray-500 max-w-lg mx-auto">
            Choose a profile below to automatically populate credentials and experience the platform workflows.
          </p>
        </div>

        <div ref={demoSectionRef} className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {demoUsers.map((u) => (
            <div 
              key={u.role} 
              className={`demo-card border border-gray-200 bg-white p-6 flex flex-col justify-between h-72 rounded-xl hover:scale-[1.02] hover:shadow-md transition-all duration-300 ${u.color}`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${u.badgeColor}`}>
                    {u.role}
                  </span>
                  <Lock size={14} className="text-gray-400" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-[#111827]">{u.role} Sandbox</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    {u.desc}
                  </p>
                </div>
                <div className="bg-gray-50 border border-gray-100 rounded-lg p-2.5 font-mono text-[10px] space-y-1 text-gray-600">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Email:</span>
                    <span className="text-gray-700">{u.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Password:</span>
                    <span className="text-gray-700">{u.password}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleDemoLogin(u.email, u.password)}
                className="bg-[#111827] hover:bg-black text-white w-full py-2 text-xs rounded-lg flex items-center justify-center gap-1.5 font-bold hover:shadow-md transition-all btn-ripple"
              >
                Log In as {u.role}
                <ArrowRight size={12} />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Section 2: Platform Analytics */}
      <section id="analytics" className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-16 scroll-mt-20 border-t border-gray-200 bg-[#FAFAFA]">
        <div className="text-center space-y-2 mb-10">
          <h2 className="text-xl sm:text-2xl font-bold text-[#111827]">Platform Statistics</h2>
          <p className="text-xs sm:text-sm text-gray-500 max-w-lg mx-auto">
            Live telemetry and package metrics monitored directly from the registry.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: "Total Components", value: "24", icon: Package },
            { label: "Approved Components", value: "18", icon: CheckCircle2 },
            { label: "Pending Reviews", value: "2", icon: Clock },
            { label: "Total Users", value: "12", icon: Users },
            { label: "Total Downloads", value: "186", icon: Download },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div 
                key={stat.label} 
                className="border border-gray-200 bg-white p-4 text-center space-y-2 rounded-xl hover:scale-[1.02] hover:shadow-md hover:border-[#D4A017]/30 transition-all duration-300"
              >
                <div className="mx-auto h-8 w-8 rounded-lg bg-[#D4A017]/10 flex items-center justify-center text-[#D4A017]">
                  <Icon size={14} />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wider">{stat.label}</p>
                  <p className="text-xl font-black text-[#111827] mt-1">{stat.value}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Section 3: Visual Workflow */}
      <section id="workflow" className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-16 scroll-mt-20 border-t border-gray-200 bg-white">
        <div className="text-center space-y-2 mb-10">
          <h2 className="text-xl sm:text-2xl font-bold text-[#111827]">Review & Approval Workflow</h2>
          <p className="text-xs sm:text-sm text-gray-500 max-w-lg mx-auto">
            Granular package validation lifecycle ensures production code meets organizational security requirements.
          </p>
        </div>

        <div ref={workflowSectionRef} className="rounded-2xl border border-gray-200 bg-gray-50 p-8 shadow-sm">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {[
              { step: "1", title: "Developer", desc: "Builds component and files details in marketplace.", icon: Users },
              { step: "2", title: "Publish Component", desc: "Form registers metadata and sets draft status.", icon: Package },
              { step: "3", title: "Submitted", desc: "Auto-transitions version to reviews pipeline.", icon: GitBranch },
              { step: "4", title: "Admin Review", desc: "Admins inspect source files and comments.", icon: Shield },
              { step: "5", title: "Approved", desc: "Passed standards and ready for public download.", icon: CheckCircle2 },
            ].map((node, i) => (
              <div key={node.step} className="flex-1 flex flex-col md:flex-row items-center gap-4 w-full">
                <div className="flex flex-col items-center text-center space-y-2 flex-1">
                  <div className="h-10 w-10 rounded-full bg-[#D4A017]/10 border border-[#D4A017]/20 flex items-center justify-center text-xs font-bold text-[#D4A017]">
                    <node.icon size={15} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#111827]">{node.title}</h4>
                    <p className="text-[10px] text-gray-500 mt-1 max-w-[150px] mx-auto leading-relaxed">{node.desc}</p>
                  </div>
                </div>
                {i < 4 && (
                  <div className="workflow-arrow hidden md:flex items-center text-[#D4A017]/60 flex-shrink-0">
                    <ArrowRight size={14} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 4: Role Permissions */}
      <section id="permissions" className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-16 scroll-mt-20 border-t border-gray-200 bg-[#FAFAFA]">
        <div className="text-center space-y-2 mb-10">
          <h2 className="text-xl sm:text-2xl font-bold text-[#111827]">Role Governance Matrix</h2>
          <p className="text-xs sm:text-sm text-gray-500 max-w-lg mx-auto">
            Workspace governance and API capabilities are regulated by granular role maps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {[
            {
              role: "Developer",
              badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
              actions: ["Browse Components", "Submit Components", "View Profile", "Test API Credentials"],
            },
            {
              role: "Admin",
              badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
              actions: ["Approve/Reject Components", "Manage Users", "Manage System Platform", "Configure Registry Settings"],
            },
          ].map((matrix) => (
            <div 
              key={matrix.role} 
              className="border border-gray-200 bg-white p-5 space-y-4 rounded-xl hover:scale-[1.02] hover:shadow-md transition-all duration-300"
            >
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold uppercase border px-2.5 py-0.5 rounded-full ${matrix.badgeColor}`}>
                  {matrix.role} Permissions
                </span>
              </div>
              <ul className="space-y-2 text-xs">
                {matrix.actions.map((act) => (
                  <li key={act} className="flex items-center gap-2 text-gray-600">
                    <CheckCircle2 size={12} className="text-[#D4A017] flex-shrink-0" />
                    <span>{act}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Section 5: Documentation Reference */}
      <section id="docs" className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-16 scroll-mt-20 border-t border-gray-200 bg-white">
        <div className="text-center space-y-2 mb-10">
          <h2 className="text-xl sm:text-2xl font-bold text-[#111827]">Documentation & Reference</h2>
          <p className="text-xs sm:text-sm text-gray-500 max-w-lg mx-auto">
            Explore guides, reference documents, and API endpoints to integrate libraries.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { title: "API Reference", desc: "Interact with registry endpoints, pull metadata, and manage downloads via CLI commands.", icon: Terminal, path: "/docs/api-reference" },
            { title: "Publishing Guide", desc: "Understand package requirements, semantic tag versioning, and code archive guidelines.", icon: Package, path: "/docs/publishing-guide" },
            { title: "Workflow Manual", desc: "Step-by-step documentation detailing approval status transitions and review comment logs.", icon: ArrowRightLeft, path: "/docs/workflow-manual" },
            { title: "Developer Guide", desc: "Local setup tutorials, proxy settings, auth hook methods, and configuration files.", icon: BookOpen, path: "/docs/developer-guide" },
          ].map((doc) => {
            const Icon = doc.icon;
            return (
              <div 
                key={doc.title} 
                className="border border-gray-200 bg-white p-5 rounded-xl hover:scale-[1.02] hover:shadow-md transition-all duration-300 flex flex-col justify-between h-48"
              >
                <div className="space-y-2">
                  <div className="h-8 w-8 rounded-lg bg-[#D4A017]/10 flex items-center justify-center text-[#D4A017]">
                    <Icon size={14} />
                  </div>
                  <h3 className="text-xs font-bold text-[#111827]">{doc.title}</h3>
                  <p className="text-[10px] text-gray-500 leading-relaxed">{doc.desc}</p>
                </div>
                <Link
                  to={doc.path}
                  onClick={() => console.log(`Click verified: Navigating to ${doc.title} via React Router Link`)}
                  className="text-[10px] font-bold text-[#D4A017] hover:text-[#D4A017]/80 flex items-center gap-1 mt-2 text-left self-start"
                >
                  Read Article <ExternalLink size={10} />
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-gray-200 py-12 mt-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-3 md:col-span-2">
            <Logo size="md" />
            <p className="text-[11px] text-gray-500 max-w-sm leading-relaxed">
              ModuleLib provides reusable UI layouts and backend components to build enterprise-grade applications quickly and securely.
            </p>
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#111827] mb-3">Resources</h4>
            <div className="flex flex-col gap-2 text-[11px] text-gray-500">
              <span className="hover:text-[#111827] cursor-pointer transition-colors">Security Policy</span>
              <span className="hover:text-[#111827] cursor-pointer transition-colors">API Reference</span>
              <span className="hover:text-[#111827] cursor-pointer transition-colors">Developer Manual</span>
            </div>
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#111827] mb-3">Platform</h4>
            <div className="flex flex-col gap-2 text-[11px] text-gray-500 font-mono">
              <span>Version: 1.0.0</span>
              <span className="hover:text-[#111827] cursor-pointer flex items-center gap-1 transition-colors">
                GitHub Repository <ExternalLink size={10} />
              </span>
              <span>Contact: support@modulelib.com</span>
            </div>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 border-t border-gray-150 text-[10px] text-gray-400 text-center sm:text-left">
          &copy; 2026 ModuleLib Marketplace. All rights reserved. Built for secure corporate engineering workflows.
        </div>
      </footer>
    </div>
  );
}
