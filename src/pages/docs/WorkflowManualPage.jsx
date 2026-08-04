import { Link } from "react-router-dom";
import { ArrowLeft, GitPullRequest, ArrowRight, UserCheck, Shield, CheckCircle, XCircle, Clock } from "lucide-react";
import { Card, Badge, Separator } from "../../components/ui/index";

export function WorkflowManualPage() {
  const steps = [
    {
      title: "1. Create Draft (Pending)",
      role: "Developer",
      badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
      desc: "A developer publishes a module zip bundle. The status defaults to 'pending' state upon initial creation.",
      icon: GitPullRequest
    },
    {
      title: "2. Submit (Submitted)",
      role: "Developer",
      badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
      desc: "The owner submits the draft module for official review. The status transitions to 'submitted' and becomes visible in the Admin Review Queue.",
      icon: ArrowRight
    },
    {
      title: "3. Policy Audit",
      role: "System Admin",
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
      desc: "An administrator performs static audit checkups, testing code safety parameters, evaluating README instructions, and validating Git source repository ownerships.",
      icon: Shield
    },
    {
      title: "4. Decision (Approved / Rejected)",
      role: "System Admin",
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
      desc: "The Admin either approves the module (publishing it to the active pool) or rejects it (returning it to the author with audit logging explanation).",
      icon: UserCheck
    }
  ];

  const statuses = [
    {
      name: "pending",
      title: "Pending / Draft",
      color: "text-blue-700 bg-blue-50 border-blue-200",
      desc: "The module has been successfully registered on the platform database, but is in a local draft state. It is not yet visible in the public review queues or index listings.",
      icon: Clock
    },
    {
      name: "submitted",
      title: "Submitted / Reviewing",
      color: "text-amber-700 bg-amber-50 border-amber-200",
      desc: "The module uploader has requested a review. It is now registered in the Admin Approval queue where security checks are run.",
      icon: GitPullRequest
    },
    {
      name: "approved",
      title: "Approved / Active",
      color: "text-emerald-700 bg-emerald-50 border-emerald-200",
      desc: "Approved packages undergo global sync in the registry workspace. Any authenticated user can now search for it, view versions, and download package files.",
      icon: CheckCircle
    },
    {
      name: "rejected",
      title: "Rejected",
      color: "text-red-700 bg-red-50 border-red-200",
      desc: "The module version has failed to satisfy dependency standards or security requirements. It is hidden from listings but editable by the owner for fixing.",
      icon: XCircle
    }
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#4B5563] flex flex-col justify-between font-sans selection:bg-gold-500/30 selection:text-white">
      <div className="absolute inset-0 bg-hero-grid bg-grid opacity-5 pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GitPullRequest className="text-gold-500 h-5 w-5" />
            <span className="font-mono text-sm font-bold tracking-tight text-gray-900">
              ModuleLib <span className="text-gold-600">Docs</span>
            </span>
          </div>
          <Link
            to="/"
            onClick={() => console.log("Back to Home clicked from Workflow Manual")}
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
            Operational Manual
          </Badge>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-[#111827]">
            Workflow Manual
          </h1>
          <p className="text-sm text-[#4B5563] max-w-2xl leading-relaxed">
            Understand package status transitions, workspace review mechanisms, and role governance hierarchies within Module Library.
          </p>
        </div>
      </section>

      {/* Content */}
      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-12 flex-1 w-full space-y-12">
        {/* Core Timeline */}
        <section className="space-y-6">
          <h2 className="text-lg font-bold text-[#1F2937]">1. The Publishing to Review Pipeline</h2>
          <div className="relative border-l border-gray-200 ml-4 pl-6 space-y-8">
            {steps.map((st, idx) => {
              return (
                <div key={idx} className="relative">
                  {/* Circle Indicator */}
                  <span className="absolute -left-[35px] top-0.5 h-4 w-4 rounded-full bg-[#F8FAFC] border-2 border-gold-500 flex items-center justify-center">
                    <span className="h-1.5 w-1.5 rounded-full bg-gold-500" />
                  </span>
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-xs font-bold text-[#111827]">{st.title}</h3>
                      <span className={`text-[9px] font-semibold border px-2 py-0.5 rounded-full ${st.badgeColor}`}>
                        Role: {st.role}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#4B5563] max-w-2xl leading-relaxed">
                      {st.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <Separator className="opacity-40" />

        {/* Status Dictionary */}
        <section className="space-y-6">
          <div>
            <h2 className="text-lg font-bold text-[#1F2937]">2. Status Dictionary</h2>
            <p className="text-xs text-[#6B7280] mt-1">
              Modules transition across these four system states. Access controls adjust dynamically depending on the current status.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {statuses.map((s) => {
              const Icon = s.icon;
              return (
                <Card key={s.name} className="border border-gray-200 bg-white p-5 space-y-3 shadow-sm hover:shadow-md transition-all duration-200">
                  <div className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${s.color} border`}>
                      <Icon size={16} />
                    </div>
                    <div className="text-left">
                      <h3 className="text-xs font-bold text-[#111827]">{s.title}</h3>
                      <span className="text-[8px] font-mono uppercase font-black text-[#6B7280]">
                        status: "{s.name}"
                      </span>
                    </div>
                  </div>
                  <p className="text-[10px] text-[#4B5563] leading-relaxed">
                    {s.desc}
                  </p>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Access Rights Note */}
        <section className="border border-gray-200 bg-white rounded-2xl p-6 space-y-3 shadow-sm">
          <h3 className="text-xs font-bold text-[#111827]">Workflow Integrity & Version Locks</h3>
          <p className="text-[10px] text-[#4B5563] leading-relaxed">
            Approved versions are locked and cannot be overwritten. To issue code patches or updates, authors must submit a new semantic version (e.g. from 1.0.0 to 1.0.1) through the complete review pipeline. This ensures complete system traceability and prevents breaking dependency changes.
          </p>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-8 bg-black/40 text-center text-[10px] text-muted-foreground relative z-10">
        &copy; 2026 ModuleLib Marketplace. All rights reserved. Secure developer portal documentation.
      </footer>
    </div>
  );
}
