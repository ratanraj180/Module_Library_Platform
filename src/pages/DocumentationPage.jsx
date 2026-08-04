import { useState, useMemo } from "react";
import { Navbar } from "../components/layout/Navbar";
import { Footer } from "../components/layout/Footer";
import {
  Search,
  BookOpen,
  Terminal,
  Layers,
  ArrowRight,
  GitBranch,
  ShieldCheck,
  HelpCircle,
  Check,
  ChevronDown,
} from "lucide-react";
import { Button, Input, Card, Separator } from "../components/ui/index";
import { cn } from "../lib/utils";

// ─── Document Sections Content ────────────────────────────────────────────────
const sections = [
  {
    id: "getting-started",
    label: "Getting Started",
    icon: BookOpen,
    title: "Getting Started",
    subtitle: "Learn the core concepts and value of the Module Library Platform.",
    content: (
      <div className="space-y-6">
        <div>
          <h4 className="text-base font-bold text-foreground mb-2">What is Module Library Platform?</h4>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Module Library Platform (ModuleLib) is the centralized, secure registry for your organization's proprietary software packages. It hosts private packages under scoped namespaces, facilitating easy publishing, discovery, and secure dependency consumption.
          </p>
        </div>
        <div>
          <h4 className="text-base font-bold text-foreground mb-2">Why Reusable Modules Matter</h4>
          <p className="text-sm leading-relaxed text-muted-foreground">
            In large engineering teams, duplicate code causes security fragmentation, version drifts, and wasted developer hours. ModuleLib solves this by enforcing scoped reuse, dependency verification, and license auditing on every build, ensuring developers write clean, reusable components once and share them securely.
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card/60 p-5 mt-6">
          <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
            Key Platform Advantages
          </h4>
          <ul className="space-y-2 text-xs text-muted-foreground list-disc list-inside pl-1">
            <li>Single source of truth for corporate libraries.</li>
            <li>Real-time vulnerability audits on every publishing lifecycle.</li>
            <li>SSO integration and role-based access control (RBAC).</li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    id: "installation",
    label: "Installation",
    icon: Terminal,
    title: "Installation Guide",
    subtitle: "Install the CLI tools to start interacting with the registry.",
    content: (
      <div className="space-y-6">
        <p className="text-sm leading-relaxed text-muted-foreground">
          To publish and consume private modules, install the ModuleLib Command Line Interface (CLI) tool globally using your package manager.
        </p>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground font-mono">Install globally via npm:</label>
          <pre className="rounded-lg border border-border bg-[#0a0a0a] p-4 font-mono text-xs text-gold-200 overflow-x-auto">
            $ npm install -g @org/mlp-cli
          </pre>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground font-mono">Alternatively, install via yarn:</label>
          <pre className="rounded-lg border border-border bg-[#0a0a0a] p-4 font-mono text-xs text-gold-200 overflow-x-auto">
            $ yarn global add @org/mlp-cli
          </pre>
        </div>
        <div className="space-y-2 mt-4">
          <label className="text-xs font-semibold text-muted-foreground font-mono">Authenticate with your registry account:</label>
          <pre className="rounded-lg border border-border bg-[#0a0a0a] p-4 font-mono text-xs text-gold-200 overflow-x-auto">
            $ mlp login --registry=https://registry.modulelib.dev
          </pre>
        </div>
      </div>
    ),
  },
  {
    id: "module-usage",
    label: "Module Usage",
    icon: Layers,
    title: "Module Usage",
    subtitle: "Configure your local environment and use installed packages in code.",
    content: (
      <div className="space-y-6">
        <p className="text-sm leading-relaxed text-muted-foreground">
          Importing modules from the private registry requires configuring your project's scoped package routing.
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Add the organization scope to your local `.npmrc` file:
        </p>
        <pre className="rounded-lg border border-border bg-[#0a0a0a] p-4 font-mono text-xs text-gold-200 overflow-x-auto">
          @org:registry=https://registry.modulelib.dev/
        </pre>
        <p className="text-sm leading-relaxed text-muted-foreground mt-4">
          Once configured, install scoped packages using the standard CLI commands:
        </p>
        <pre className="rounded-lg border border-border bg-[#0a0a0a] p-4 font-mono text-xs text-gold-200 overflow-x-auto">
          $ npm install @org/auth-core
        </pre>
        <div className="space-y-2 mt-6">
          <label className="text-xs font-semibold text-muted-foreground">Example code implementation:</label>
          <pre className="rounded-lg border border-border bg-[#0a0a0a] p-4 font-mono text-xs text-gold-200 overflow-x-auto">
{`import React from 'react';
import { AuthProvider } from '@org/auth-core';

function App() {
  return (
    <AuthProvider clientKey="mlp_prod_8x99">
      <MainDashboard />
    </AuthProvider>
  );
}`}
          </pre>
        </div>
      </div>
    ),
  },
  {
    id: "publishing",
    label: "Publishing Modules",
    icon: ArrowRight,
    title: "Publishing Modules",
    subtitle: "Learn the steps required to compile and publish a module.",
    content: (
      <div className="space-y-6">
        <p className="text-sm leading-relaxed text-muted-foreground">
          Publishing packages to the corporate registry requires configuring publish options inside your package manifest.
        </p>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground">Step 1: Check package configurations</label>
          <pre className="rounded-lg border border-border bg-[#0a0a0a] p-4 font-mono text-xs text-gold-200 overflow-x-auto">
{`{
  "name": "@org/auth-core",
  "version": "2.3.1",
  "publishConfig": {
    "registry": "https://registry.modulelib.dev"
  }
}`}
          </pre>
        </div>
        <div className="space-y-2 mt-4">
          <label className="text-xs font-semibold text-muted-foreground">Step 2: Run the local publishing pipeline</label>
          <pre className="rounded-lg border border-border bg-[#0a0a0a] p-4 font-mono text-xs text-gold-200 overflow-x-auto">
            $ mlp publish
          </pre>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-2">Automated Approval Workflow</h4>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Every published package undergoes automated security scanning (static analysis + SBOM auditing). If it meets security criteria, it moves to 'pending review' where platform admins verify the package documentation and API stability before approving it for the global registry.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "versioning",
    label: "Version Management",
    icon: GitBranch,
    title: "Version Management",
    subtitle: "Guidelines on semantic versioning and releasing code changes.",
    content: (
      <div className="space-y-6">
        <p className="text-sm leading-relaxed text-muted-foreground">
          ModuleLib strictly enforces Semantic Versioning (SemVer) rules. Every release update must follow the format `MAJOR.MINOR.PATCH`:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <h5 className="font-bold text-xs text-gold-300">MAJOR (e.g. 2.0.0)</h5>
            <p className="text-xs text-muted-foreground mt-1">Introduces incompatible API changes that require consumers to refactor.</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <h5 className="font-bold text-xs text-gold-300">MINOR (e.g. 1.3.0)</h5>
            <p className="text-xs text-muted-foreground mt-1">Adds new functionality in a backward-compatible manner.</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <h5 className="font-bold text-xs text-gold-300">PATCH (e.g. 1.0.4)</h5>
            <p className="text-xs text-muted-foreground mt-1">Backward-compatible bug fixes and stability tweaks.</p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "security",
    label: "Security Guidelines",
    icon: ShieldCheck,
    title: "Security Guidelines",
    subtitle: "Security scanning mechanisms, access controls, and audits.",
    content: (
      <div className="space-y-6">
        <div>
          <h4 className="text-base font-bold text-foreground mb-2">Access Control</h4>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Registry access is strictly governed by Enterprise Single Sign-On (SSO) and Role-Based Access Control (RBAC). Teams can only write to namespaces registered under their specific department ownership to prevent unauthorized package squatting or overrides.
          </p>
        </div>
        <div>
          <h4 className="text-base font-bold text-foreground mb-2">Vulnerability & License Audits</h4>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Before any package version transition compiles successfully, the registry runs static analysis tools to check for embedded credentials, hardcoded connection strings, and license compatibility (rejecting non-approved GPL dependencies).
          </p>
        </div>
      </div>
    ),
  },
];

// ─── FAQ Component ────────────────────────────────────────────────────────────
function FAQSection() {
  const faqs = [
    {
      q: "How do I install a module?",
      a: "Configure your scoped registry by adding `@org:registry=https://registry.modulelib.dev/` to your local `.npmrc` file, then run standard commands like `npm install @org/auth-core`.",
    },
    {
      q: "How do I publish a module?",
      a: "Verify that your `package.json` config includes the registry URL. Run the CLI login `mlp login --registry=https://registry.modulelib.dev` and publish using `mlp publish`.",
    },
    {
      q: "How do approvals work?",
      a: "Every new package version is automatically scanned by our security scanners. If clean, the package moves to the 'pending review' stage where platform administrators check API details and approve it.",
    },
    {
      q: "How do I update versions?",
      a: "Increment the version field in your `package.json` following semantic versioning guidelines (e.g., changing from `1.0.0` to `1.0.1` for a patch release), and run `mlp publish` again.",
    },
  ];

  const [openIdx, setOpenIdx] = useState(null);

  return (
    <div className="space-y-4">
      {faqs.map((faq, idx) => {
        const isOpen = openIdx === idx;
        return (
          <div key={idx} className="rounded-xl border border-border bg-card/40 overflow-hidden transition-all duration-300">
            <button
              onClick={() => setOpenIdx(isOpen ? null : idx)}
              className="flex w-full items-center justify-between px-5 py-4 text-left font-semibold text-sm text-foreground hover:bg-secondary/40 transition-colors"
            >
              <span className="flex items-center gap-2">
                <HelpCircle size={15} className="text-gold-300" />
                {faq.q}
              </span>
              <ChevronDown size={14} className={cn("text-muted-foreground transition-transform duration-300", isOpen && "rotate-180")} />
            </button>
            <div className={cn("px-5 overflow-hidden transition-all duration-300 text-xs text-muted-foreground leading-relaxed", isOpen ? "py-4 border-t border-border/50 max-h-40" : "max-h-0")}>
              {faq.a}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function DocumentationPage() {
  const [activeTab, setActiveTab] = useState("getting-started");
  const [searchQuery, setSearchQuery] = useState("");

  const activeSection = sections.find((s) => s.id === activeTab) || sections[0];

  // Search logic
  const filteredSections = useMemo(() => {
    if (!searchQuery) return sections;
    return sections.filter(
      (s) =>
        s.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const handleQuickLinkClick = (id) => {
    setActiveTab(id);
    document.getElementById("doc-content-section")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col justify-between">
      <div>
        <Navbar />

        {/* Hero Section */}
        <section className="relative overflow-hidden pt-32 pb-16 border-b border-border/40">
          <div className="absolute left-1/4 top-1/4 h-80 w-80 rounded-full bg-gold-500/5 blur-[120px] pointer-events-none" />
          <div className="absolute right-1/4 bottom-0 h-64 w-64 rounded-full bg-gold-200/5 blur-[100px] pointer-events-none" />

          <div className="relative mx-auto max-w-3xl px-6 text-center space-y-6">
            <span className="text-xs font-bold uppercase tracking-widest text-[#D4A64F]">
              Support & Docs
            </span>
            <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-5xl">
              Documentation Center
            </h1>
            <p className="text-sm leading-relaxed text-muted-foreground max-w-xl mx-auto">
              Find reference guides, setup instructions, publishing workflows, and security standards for ModuleLib.
            </p>
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search documentation topics..."
                className="pl-10 h-11"
              />
            </div>
          </div>
        </section>

        {/* Quick Links Cards */}
        <section className="py-12 max-w-7xl mx-auto px-6 sm:px-8">
          <div className="mb-6 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Quick Links
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => handleQuickLinkClick(section.id)}
                  className="card-hover text-left flex flex-col justify-between p-4 bg-card/60 hover:bg-card hover:border-[#D4A64F]/30"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-500/10 text-gold-300 ring-1 ring-gold-500/20">
                    <Icon size={16} />
                  </div>
                  <div className="mt-4">
                    <span className="block text-[11px] font-bold text-foreground truncate">{section.label}</span>
                    <span className="block text-[9px] text-muted-foreground mt-0.5">View guide →</span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <Separator className="max-w-7xl mx-auto opacity-40" />

        {/* Documentation Sections */}
        <section id="doc-content-section" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Sidebar Navigation */}
            <aside className="w-full md:w-64 flex-shrink-0">
              <div className="sticky top-24 rounded-xl border border-border bg-card p-4 space-y-1">
                <div className="px-3 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Guide Sections
                </div>
                {filteredSections.map((section) => {
                  const Icon = section.icon;
                  const isSelected = activeTab === section.id;
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveTab(section.id)}
                      className={cn(
                        "w-full flex items-center gap-3 rounded-lg px-3 py-2 text-left text-xs font-semibold transition-all duration-150",
                        isSelected
                          ? "bg-gold-500/10 text-gold-200"
                          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                      )}
                    >
                      <Icon size={14} className={isSelected ? "text-gold-200" : "text-muted-foreground"} />
                      {section.label}
                    </button>
                  );
                })}
                {filteredSections.length === 0 && (
                  <div className="px-3 py-2 text-xs text-muted-foreground italic">No sections found</div>
                )}
              </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 min-w-0">
              <article className="rounded-2xl border border-border bg-card/30 p-6 sm:p-8 backdrop-blur-sm space-y-6">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                    {activeSection.title}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1.5">{activeSection.subtitle}</p>
                  <Separator className="mt-4 border-border/60" />
                </div>
                {activeSection.content}
              </article>
            </main>
          </div>
        </section>

        {/* FAQs */}
        <section className="max-w-4xl mx-auto px-6 pb-24 space-y-6">
          <div className="text-center">
            <h3 className="text-xl font-bold text-foreground sm:text-2xl">Frequently Asked Questions</h3>
            <p className="text-xs text-muted-foreground mt-1.5">Common questions about modules, publishing, and security registry policies.</p>
          </div>
          <FAQSection />
        </section>
      </div>

      <Footer />
    </div>
  );
}
