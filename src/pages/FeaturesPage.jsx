import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Sparkles,
  Package,
  Layers,
  Shield,
  Clock,
  Users,
  GitBranch,
  ArrowRight,
  ChevronRight,
  Database,
  Terminal,
  Cpu,
  BookOpen
} from "lucide-react";
import { Logo } from "../components/shared/Logo";

export function FeaturesPage() {
  const containerRef = useRef(null);
  const heroTitleRef = useRef(null);

  const features = [
    {
      title: "Reusable Component Registry",
      desc: "Vercel and shadcn/ui style components catalog supporting visual previews, custom downloads, and CLI installations.",
      icon: Layers
    },
    {
      title: "Internal Module Marketplace",
      desc: "Register enterprise backend services, custom routes middleware, utility modules, and common configuration assets.",
      icon: Package
    },
    {
      title: "Admin Approval Workflow",
      desc: "Robust review queue letting admins verify package code archives, audit security, and leave reviews comments.",
      icon: Shield
    },
    {
      title: "Version Management",
      desc: "Track semantic versions logs, dependencies trees, and installation setup configurations across assets.",
      icon: GitBranch
    },
    {
      title: "Team Workspaces",
      desc: "Isolated workspaces for different business groups to publish, govern, and sync certified internal libraries.",
      icon: Users
    },
    {
      title: "Analytics Dashboard",
      desc: "Telemetry monitoring metrics tracing download telemetry, pending submission states, and user actions statistics.",
      icon: Clock
    },
    {
      title: "Internal Developer AI Assistant",
      desc: "Internal ModuleAI chat assistant recommending suitable components and modules via developer prompts.",
      icon: Sparkles
    },
    {
      title: "Role Based Access Control",
      desc: "Regulated API commands access blocking unauthorized actions based on developer or admin workspace roles.",
      icon: Database
    },
    {
      title: "Component Documentation",
      desc: "Auto-extracted parameters documentation, usage examples logs, installation instructions, and file specs.",
      icon: BookOpen
    },
    {
      title: "Private Package Registry",
      desc: "Upload local express zip archives securely to keep company infrastructure components inside internal firewalls.",
      icon: Terminal
    }
  ];

  useEffect(() => {
    console.log("[FeaturesPage] Features data loaded:", features);
    
    // Smooth scroll animations on load using anime.js
    import("animejs").then((mod) => {
      const anime = mod.default || mod;

      // Card slide-up sequence
      if (containerRef.current) {
        const cards = containerRef.current.querySelectorAll(".feature-card");
        anime({
          targets: Array.from(cards),
          translateY: [20, 0],
          delay: anime.stagger(60),
          duration: 500,
          easing: "easeOutQuad"
        });
      }

      // Hero Title slide animation
      if (heroTitleRef.current) {
        anime({
          targets: heroTitleRef.current,
          translateY: [15, 0],
          duration: 400,
          easing: "easeOutExpo"
        });
      }
    });
  }, []);

  const handleCardHover = (e, isHover) => {
    import("animejs").then((mod) => {
      const anime = mod.default || mod;
      anime({
        targets: e.currentTarget,
        scale: isHover ? 1.025 : 1,
        boxShadow: isHover
          ? "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)"
          : "0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)",
        borderColor: isHover ? "#D4A017" : "#E5E7EB",
        duration: 200,
        easing: "easeOutQuad"
      });
    });
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#111827] flex flex-col justify-between font-sans selection:bg-gold-500/30">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-hero-grid opacity-[0.02] pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-gold-500 to-gold-700 flex items-center justify-center text-xs font-bold text-white shadow-sm">
                ML
              </div>
              <span className="font-mono text-sm font-bold tracking-tight text-[#111827]">
                ModuleLib <span className="text-[#D4A017]">Console</span>
              </span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/" className="text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors">
              Home
            </Link>
            <Link
              to="/login"
              className="bg-[#111827] hover:bg-black text-white py-2 px-4 text-xs rounded-lg font-bold transition-all shadow-sm"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 pt-16 pb-8 text-center space-y-4">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-gold-50 border border-gold-150 px-3 py-1 text-xs text-[#D4A017] font-semibold justify-center">
          <Sparkles size={11} className="animate-pulse" />
          <span className="uppercase text-[9px] font-black tracking-wider">Features Overview</span>
        </div>
        <h1
          ref={heroTitleRef}
          className="text-3xl sm:text-5xl font-black tracking-tight text-[#111827] leading-tight"
        >
          Enterprise Development Features
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 max-w-xl mx-auto leading-relaxed">
          Everything engineering teams need to build, manage, approve and distribute reusable software assets.
        </p>
      </section>

      {/* Catalog Grid Section */}
      <main ref={containerRef} className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full">
        {(!features || features.length === 0) ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((num) => (
              <div key={num} className="border border-gray-200 bg-white p-5 rounded-2xl flex flex-col justify-between h-56 shadow-sm border-t-4 border-t-[#D4A017]">
                <div className="space-y-3">
                  <div className="h-10 w-10 rounded-xl bg-gold-50 border border-gold-100 flex items-center justify-center text-[#D4A017]">
                    <Sparkles size={18} />
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 leading-tight">Static Feature {num}</h3>
                  <p className="text-[11px] text-gray-500 leading-normal">
                    Fallback mock item displayed because the registry telemetry is currently syncing.
                  </p>
                </div>
                <Link to="/login" className="text-[10px] font-bold text-[#D4A017] inline-flex items-center gap-0.5 pt-2">
                  Learn More <ChevronRight size={10} />
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feat) => {
              const IconComponent = feat.icon || Sparkles;
              return (
                <div
                  key={feat.title}
                  onMouseEnter={(e) => handleCardHover(e, true)}
                  onMouseLeave={(e) => handleCardHover(e, false)}
                  className="feature-card border border-gray-200 bg-white p-5 rounded-2xl flex flex-col justify-between h-56 transition-all shadow-sm hover:scale-[1.015]"
                >
                  <div className="space-y-3">
                    <div className="h-10 w-10 rounded-xl bg-gold-50 border border-gold-100 flex items-center justify-center text-[#D4A017]">
                      <IconComponent size={18} />
                    </div>
                    <h3 className="text-sm font-bold text-gray-900 leading-tight">{feat.title}</h3>
                    <p className="text-[11px] text-gray-500 leading-normal line-clamp-3">{feat.desc}</p>
                  </div>
                  <Link
                    to="/login"
                    className="text-[10px] font-bold text-[#D4A017] hover:text-[#C28E2A] inline-flex items-center gap-0.5 pt-2"
                  >
                    Learn More <ChevronRight size={10} />
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8 bg-white text-center text-[10px] text-gray-400 relative z-10 w-full mt-12">
        &copy; 2026 ModuleLib Platform. All rights reserved. Secure enterprise console documentation.
      </footer>
    </div>
  );
}
