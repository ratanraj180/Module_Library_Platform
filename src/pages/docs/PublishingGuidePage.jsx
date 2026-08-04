import { Link } from "react-router-dom";
import { ArrowLeft, BookOpen, CheckCircle, Info, UploadCloud, ShieldCheck, GitBranch } from "lucide-react";
import { Card, Badge, Separator } from "../../components/ui/index";

export function PublishingGuidePage() {
  const steps = [
    {
      num: "01",
      title: "Initialize Module Metadata",
      desc: "Configure local configurations. Ensure package metadata contains a proper title, comprehensive description, category, and target technology stack. You can also specify the source repository URL."
    },
    {
      num: "02",
      title: "Select Semantic Version",
      desc: "Apply strict Semantic Versioning (SemVer) tags (e.g. 1.0.0). Increment the MAJOR version for breaking changes, MINOR version for backward-compatible features, and PATCH version for bug fixes."
    },
    {
      num: "03",
      title: "Upload Archive Package",
      desc: "Prepare the source code bundle. The registry accepts a compressed ZIP archive containing source files, package manifests, and documentation readmes."
    },
    {
      num: "04",
      title: "Review Queue Submission",
      desc: "Once published, the package draft is created and automatically submitted to the Admin review pipeline where it awaits static security analysis and manual policy audits."
    }
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#4B5563] flex flex-col justify-between font-sans selection:bg-gold-500/30 selection:text-white">
      <div className="absolute inset-0 bg-hero-grid bg-grid opacity-5 pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="text-gold-500 h-5 w-5" />
            <span className="font-mono text-sm font-bold tracking-tight text-gray-900">
              ModuleLib <span className="text-gold-600">Docs</span>
            </span>
          </div>
          <Link
            to="/"
            onClick={() => console.log("Back to Home clicked from Publishing Guide")}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#4B5563] hover:text-gold-600 transition-colors py-2 px-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 shadow-sm"
          >
            <ArrowLeft size={13} className="text-[#4B5563]" />
            Back to Home
          </Link>
        </div>
      </header>

      {/* Hero Header */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-8 border-b border-gray-200 w-full">
        <div className="space-y-4">
          <Badge variant="cyan" className="text-[10px] tracking-wider uppercase font-semibold bg-cyan-50 text-cyan-700 border border-cyan-200">
            Guides
          </Badge>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-[#111827]">
            Publishing Guide
          </h1>
          <p className="text-sm text-[#4B5563] max-w-2xl leading-relaxed">
            Follow guidelines to register new libraries, configure scoped namespaces, publish releases, and transition your package through code audits.
          </p>
        </div>
      </section>

      {/* Content */}
      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-12 flex-1 w-full space-y-12">
        {/* Workflow Steps */}
        <section className="space-y-6">
          <h2 className="text-lg font-bold text-[#1F2937] flex items-center gap-2">
            <UploadCloud className="text-gold-500" size={16} /> Publishing Lifecycle Steps
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {steps.map((st) => (
              <Card key={st.num} className="border border-gray-200 bg-white p-5 space-y-3 relative overflow-hidden group hover:border-gold-500/40 transition-all duration-200 shadow-sm hover:shadow-md">
                <div className="absolute top-2 right-2 text-3xl font-black text-gray-100 font-mono select-none group-hover:text-gold-500/5 transition-colors">
                  {st.num}
                </div>
                <div className="h-6 w-6 rounded-md bg-gold-500/10 text-gold-600 border border-gold-500/20 font-bold font-mono text-xs flex items-center justify-center">
                  {st.num}
                </div>
                <h3 className="text-xs font-bold text-[#111827]">{st.title}</h3>
                <p className="text-[10px] text-[#6B7280] leading-relaxed">
                  {st.desc}
                </p>
              </Card>
            ))}
          </div>
        </section>

        {/* Required Fields Section */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-lg font-bold text-[#1F2937] flex items-center gap-2">
              <Info className="text-gold-500" size={16} /> Required Manifest Fields
            </h2>
            <div className="border border-gray-200 bg-white rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-[#4B5563] font-semibold">
                    <th className="p-3">Field Name</th>
                    <th className="p-3">Data Type</th>
                    <th className="p-3">Constraint</th>
                    <th className="p-3">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-[#4B5563]">
                  <tr>
                    <td className="p-3 font-mono text-[#111827] font-bold">title</td>
                    <td className="p-3 font-mono text-gray-600">String</td>
                    <td className="p-3 text-red-600 font-semibold">Required</td>
                    <td className="p-3 leading-normal">Clean display name of your module. Unique in namespace.</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono text-[#111827] font-bold">description</td>
                    <td className="p-3 font-mono text-gray-600">String</td>
                    <td className="p-3 text-red-600 font-semibold">Required</td>
                    <td className="p-3 leading-normal">Short explanation detailing usage context and features.</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono text-[#111827] font-bold">category</td>
                    <td className="p-3 font-mono text-gray-600">Enum</td>
                    <td className="p-3 text-red-600 font-semibold">Required</td>
                    <td className="p-3 leading-normal">Must be one of: Frontend, Backend, Database, Utility, DevOps, Other.</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono text-[#111827] font-bold">technology</td>
                    <td className="p-3 font-mono text-gray-600">String</td>
                    <td className="p-3 text-red-600 font-semibold">Required</td>
                    <td className="p-3 leading-normal">List frameworks or environments (e.g. React, Express, MongoDB).</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono text-[#111827] font-bold">repositoryUrl</td>
                    <td className="p-3 font-mono text-gray-600">URL String</td>
                    <td className="p-3 text-red-600 font-semibold">Required</td>
                    <td className="p-3 leading-normal">Valid repository link (HTTP/HTTPS url) for version auditing.</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono text-[#111827] font-bold">file</td>
                    <td className="p-3 font-mono text-gray-600">ZIP Binary</td>
                    <td className="p-3 text-red-600 font-semibold">Required</td>
                    <td className="p-3 leading-normal">The package source code folder compressed in ZIP format.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-lg font-bold text-[#1F2937] flex items-center gap-2">
              <GitBranch className="text-gold-500" size={16} /> Version Governance
            </h2>
            <Card className="border border-gray-200 bg-white p-5 space-y-4 shadow-sm">
              <p className="text-[11px] text-[#4B5563] leading-relaxed">
                Module Library platform strictly tracks dependency tags using semantic tags:
              </p>
              <div className="space-y-3 font-sans text-xs">
                <div className="p-3 rounded-lg border border-gray-150 bg-gray-50/50">
                  <div className="font-bold text-gold-600 font-mono">MAJOR (e.g. 2.0.0)</div>
                  <div className="text-[10px] text-[#6B7280] mt-1">Increment for breaking API structures. Requires consumer migration check.</div>
                </div>
                <div className="p-3 rounded-lg border border-gray-150 bg-gray-50/50">
                  <div className="font-bold text-gold-600 font-mono">MINOR (e.g. 1.5.0)</div>
                  <div className="text-[10px] text-[#6B7280] mt-1">Increment for adding new features without breaking backward compatibility.</div>
                </div>
                <div className="p-3 rounded-lg border border-gray-150 bg-gray-50/50">
                  <div className="font-bold text-gold-600 font-mono">PATCH (e.g. 1.0.3)</div>
                  <div className="text-[10px] text-[#6B7280] mt-1">Increment for non-breaking bug fixes, optimizations, and patch documentation.</div>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* Approval Process Policy */}
        <section className="border border-gray-200 bg-white rounded-2xl p-6 sm:p-8 space-y-4 shadow-sm">
          <h2 className="text-lg font-bold text-[#1F2937] flex items-center gap-2">
            <ShieldCheck className="text-gold-500" size={18} /> Safety & Approval Policy
          </h2>
          <p className="text-xs text-[#4B5563] leading-relaxed max-w-4xl">
            Upon submitting a module version, our backend hooks trigger static analysis. The analysis evaluates code compliance against security filters. Once static analysis is marked passing, an Administrator is assigned to run sandbox tests, review your README and manifest fields, and approve the module. Once approved, it will transition into the active directory for developer access.
          </p>
          <div className="flex items-center gap-2 text-[10px] text-gold-600 bg-gold-500/5 border border-gold-500/10 p-3 rounded-lg max-w-2xl">
            <Info size={14} className="flex-shrink-0 text-gold-500" />
            <span className="text-[#4B5563]">Note: Developers have permission to submit new packages. System Administrators are the only roles allowed to review and approve or reject submissions.</span>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8 bg-white text-center text-[10px] text-[#9CA3AF] relative z-10">
        &copy; 2026 ModuleLib Marketplace. All rights reserved. Secure developer portal documentation.
      </footer>
    </div>
  );
}
