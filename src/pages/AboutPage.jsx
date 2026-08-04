import { Navbar } from "../components/layout/Navbar";
import { Footer } from "../components/layout/Footer";
import { Users, ShieldCheck, Zap, Globe } from "lucide-react";
import { Card } from "../components/ui/index";

export function AboutPage() {
  const coreValues = [
    {
      icon: Users,
      title: "Developer Collaboration",
      description: "Breaking down silos by enabling engineers to discover, share, and contribute to internal modules across all teams.",
    },
    {
      icon: ShieldCheck,
      title: "Security & Compliance",
      description: "Automatic dependency audit, software bill of materials (SBOM) generation, and active vulnerability checking.",
    },
    {
      icon: Zap,
      title: "Developer Velocity",
      description: "Pre-verified CLI tools and seamless package manager integration to sync, build, and deploy faster.",
    },
    {
      icon: Globe,
      title: "Internal Scaling",
      description: "Reliable local registry infrastructure engineered for internal project workloads and integrated team environments.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col justify-between">
      <div>
        <Navbar />

        {/* Hero Area */}
        <section className="relative overflow-hidden pt-32 pb-20">
          <div className="absolute left-1/4 top-1/4 h-80 w-80 rounded-full bg-gold-500/5 blur-[120px] pointer-events-none" />
          <div className="absolute right-1/4 bottom-0 h-64 w-64 rounded-full bg-gold-200/5 blur-[100px] pointer-events-none" />

          <div className="relative mx-auto max-w-4xl px-6 text-center">
            <h1 className="text-4xl font-black tracking-tight text-foreground sm:text-6xl">
              About <span className="gradient-text">ModuleLib</span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              ModuleLib is the ultimate developer platform designed for modern engineering organizations. 
              We serve as the single source of truth for package hosting, module discovery, and dependency management.
            </p>
          </div>
        </section>

        {/* Detailed Grid */}
        <section className="py-12 max-w-7xl mx-auto px-6 sm:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {coreValues.map((value, idx) => {
              const Icon = value.icon;
              return (
                <Card key={idx} hover={true} className="flex gap-4 p-6 bg-card border border-border">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gold-500/10 text-gold-300 ring-1 ring-gold-500/20">
                    <Icon size={22} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground mb-2">{value.title}</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">{value.description}</p>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Platform stats */}
        <section className="py-16 bg-card/25 border-y border-border/40 my-12">
          <div className="max-w-4xl mx-auto px-6 grid grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-3xl sm:text-4xl font-extrabold text-[#D4A64F]">100%</div>
              <div className="mt-1.5 text-xs uppercase tracking-widest text-muted-foreground font-semibold">Open Source Friendly</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-extrabold text-[#D4A64F]">65ms</div>
              <div className="mt-1.5 text-xs uppercase tracking-widest text-muted-foreground font-semibold">Average Response Time</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-extrabold text-[#D4A64F]">99.2%</div>
              <div className="mt-1.5 text-xs uppercase tracking-widest text-muted-foreground font-semibold">Platform Uptime SLA</div>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}
