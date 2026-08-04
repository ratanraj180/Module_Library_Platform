import { useAuth } from "../../hooks/useAuth";
import {
  User,
  Shield,
  Layers,
  Activity,
  Mail,
  Users,
  CheckCircle,
  Clock,
  GitBranch,
  Key,
} from "lucide-react";
import { Card, Badge, Avatar } from "../../components/ui/index";

export function UserProfilePage() {
  const { user } = useAuth();

  // Mock details for the profile view
  const userProfile = {
    team: user?.team || "Frontend Product Team",
    title: user?.role === "Administrator" ? "Principal Security Architect" : "Senior Frontend Engineer",
    joinDate: "March 15, 2024",
    publishedModules: [
      { name: "@org/ui-components", version: "v1.0.4", downloads: "8,920", date: "June 2026" },
      { name: "@org/form-validator", version: "v1.2.0", downloads: "3,200", date: "May 2026" },
      { name: "@org/theme-provider", version: "v3.0.0-beta.1", downloads: "540", date: "Just now" },
    ],
    timeline: [
      { action: "Triggered Security Scan", detail: "Scanned @org/data-fetcher, 0 CVEs found.", time: "2 hours ago" },
      { action: "Approved Registry Submission", detail: "Approved @org/payment-gateway v1.0.0 for CDN edge release.", time: "4 hours ago" },
      { action: "Published package release", detail: "Published v3.0.0-beta.1 of @org/theme-provider.", time: "1 day ago" },
      { action: "Granted team access", detail: "Assigned MAINTAINER role to Sarah Chen on Frontend Team.", time: "3 days ago" },
    ],
  };

  return (
    <div className="space-y-6 animate-fade-in text-white pb-10 max-w-4xl mx-auto">
      
      {/* Header Profile Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-br from-gold-950/20 via-[#0d0d0d] to-background p-6">
        <div className="absolute top-1/2 -right-16 h-32 w-32 -translate-y-1/2 rounded-full bg-gold-600/10 blur-2xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-center gap-5">
          <Avatar
            initials={user?.initials || "DU"}
            size="lg"
            className="h-16 w-16 text-xl bg-gradient-to-br from-gold-500 to-gold-700 ring-4 ring-gold-500/10 flex-shrink-0"
          />
          <div className="space-y-1 text-center md:text-left flex-1 min-w-0">
            <h1 className="text-xl font-bold text-foreground truncate">{user?.name || "Dev User"}</h1>
            <p className="text-xs text-gold-300 font-mono font-medium">{userProfile.title}</p>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-3 gap-y-1 text-[11px] text-muted-foreground/60 pt-1">
              <span className="flex items-center gap-1"><Mail size={12} /> {user?.email || "developer@modulelib.dev"}</span>
              <span>·</span>
              <span className="flex items-center gap-1"><Users size={12} /> {userProfile.team}</span>
              <span>·</span>
              <span className="flex items-center gap-1"><Clock size={12} /> Joined {userProfile.joinDate}</span>
            </div>
          </div>
          <Badge className="bg-gold-500/10 text-gold-300 border border-gold-500/20 text-xs font-bold uppercase tracking-wider px-3 py-1 mt-3 md:mt-0">
            {user?.role || "Developer"}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column: Permissions & Keys */}
        <div className="md:col-span-1 space-y-6">
          
          {/* Permissions / Capabilities list */}
          <Card className="p-5 bg-card/30 border-white/[0.06] space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#D4A64F] flex items-center gap-1.5 pb-2.5 border-b border-white/[0.04]">
              <Shield size={13} />
              Portal Access Roles
            </h3>
            <div className="space-y-3">
              {(user?.permissions || ["Browse Modules", "Publish Modules", "Track versions"]).map((perm, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CheckCircle size={13} className="text-gold-400 flex-shrink-0" />
                  <span>{perm}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* API Access Tokens info */}
          <Card className="p-5 bg-card/30 border-white/[0.06] space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#D4A64F] flex items-center gap-1.5 pb-2.5 border-b border-white/[0.04]">
              <Key size={13} />
              Registry Tokens
            </h3>
            <div className="space-y-3">
              <div className="rounded border border-white/[0.04] bg-background p-2.5 font-mono text-[10px] text-muted-foreground/80 flex items-center justify-between">
                <span>npm_token_****8a2f</span>
                <span className="text-gold-300 text-[8px] uppercase tracking-wider font-sans font-bold">Active</span>
              </div>
              <p className="text-[10px] text-muted-foreground/40 leading-normal">
                Use registry tokens in your CI/CD configuration files to authorize automatic package publish requests.
              </p>
            </div>
          </Card>

        </div>

        {/* Right Column: Published Modules & Activity Timeline */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Published Modules */}
          <Card className="p-5 bg-card/30 border-white/[0.06] space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#D4A64F] flex items-center gap-1.5 pb-2.5 border-b border-white/[0.04]">
              <Layers size={13} />
              My Published Packages
            </h3>
            
            <div className="divide-y divide-white/[0.04] space-y-3">
              {userProfile.publishedModules.map((mod, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs pt-3 first:pt-0">
                  <div>
                    <span className="font-mono font-bold text-foreground">{mod.name}</span>
                    <span className="block text-[10px] text-muted-foreground/40 mt-0.5">Published {mod.date}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-gold-300 font-semibold">{mod.version}</span>
                    <span className="block text-[9px] text-muted-foreground/50 mt-0.5">{mod.downloads} downloads</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Activity Timeline */}
          <Card className="p-5 bg-card/30 border-white/[0.06] space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#D4A64F] flex items-center gap-1.5 pb-2.5 border-b border-white/[0.04]">
              <Activity size={13} />
              Recent Activity Timeline
            </h3>

            <div className="relative border-l border-white/[0.04] pl-4 space-y-5">
              {userProfile.timeline.map((item, idx) => (
                <div key={idx} className="relative text-xs">
                  <span className="absolute -left-[20px] top-1 h-2 w-2 rounded-full bg-gold-400 border border-background" />
                  <div className="flex justify-between items-baseline">
                    <span className="font-semibold text-foreground">{item.action}</span>
                    <span className="text-[10px] text-muted-foreground/30 font-mono">{item.time}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{item.detail}</p>
                </div>
              ))}
            </div>
          </Card>

        </div>

      </div>

    </div>
  );
}
