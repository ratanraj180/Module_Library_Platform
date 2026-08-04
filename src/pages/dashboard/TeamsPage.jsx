import { useState, useEffect } from "react";
import {
  Users,
  UserCheck,
  Shield,
  Search,
  Filter,
  Plus,
  X,
  Loader2,
  AlertTriangle,
  ArrowRight,
  FolderOpen,
  History,
  Mail,
  UserPlus,
} from "lucide-react";
import { Button, Card, Badge, Separator, Avatar, Input } from "../../components/ui/index";

export function TeamsPage() {
  // Mock data for teams
  const [teams, setTeams] = useState([
    {
      id: "frontend",
      name: "Frontend Team",
      lead: "Rohit Algou",
      leadEmail: "rohit@modulelib.dev",
      description: "Responsible for the main registry user interfaces, landing page components, and Radix-based reusable libraries.",
      status: "Active",
      modulesCount: 5,
      modulesList: ["ui-components", "theme-provider", "icon-pack", "form-validator", "date-utils"],
      createdDate: "July 12, 2025",
    },
    {
      id: "backend",
      name: "Backend Team",
      lead: "Algo Helper",
      leadEmail: "algo@modulelib.dev",
      description: "Responsible for OAuth2 endpoints, package registry hosting index, and dynamic metadata parsers.",
      status: "Active",
      modulesCount: 3,
      modulesList: ["auth-core", "db-connector", "payment-gateway"],
      createdDate: "August 05, 2025",
    },
    {
      id: "devops",
      name: "DevOps Team",
      lead: "Marcus Aurelius",
      leadEmail: "marcus@modulelib.dev",
      description: "Responsible for CI/CD pipelines validation, server hosting, and automated package version index syncs.",
      status: "Active",
      modulesCount: 3,
      modulesList: ["logger-pro", "devops-pipeline", "sec-audit-tool"],
      createdDate: "September 10, 2025",
    },
    {
      id: "platform",
      name: "Platform Team",
      lead: "Jessica Alba",
      leadEmail: "jessica@modulelib.dev",
      description: "Responsible for overall core registry scaling, analytics pipelines, and integration wrappers.",
      status: "Active",
      modulesCount: 5,
      modulesList: ["notification-service", "analytics-engine", "config-sync", "email-sender", "pdf-generator"],
      createdDate: "December 15, 2025",
    },
  ]);

  // Mock members data
  const [members, setMembers] = useState([
    { id: 1, name: "Rohit Algou", email: "rohit@modulelib.dev", role: "Admin", teamId: "frontend", initials: "RA" },
    { id: 2, name: "Algo Helper", email: "algo@modulelib.dev", role: "Admin", teamId: "backend", initials: "AH" },
    { id: 3, name: "Marcus Aurelius", email: "marcus@modulelib.dev", role: "Maintainer", teamId: "devops", initials: "MA" },
    { id: 4, name: "Jessica Alba", email: "jessica@modulelib.dev", role: "Maintainer", teamId: "platform", initials: "JA" },
    { id: 5, name: "David Vance", email: "david@modulelib.dev", role: "Developer", teamId: "frontend", initials: "DV" },
    { id: 6, name: "Emma Watson", email: "emma@modulelib.dev", role: "Developer", teamId: "frontend", initials: "EW" },
    { id: 7, name: "Sarah Chen", email: "sarah@modulelib.dev", role: "Maintainer", teamId: "frontend", initials: "SC" },
    { id: 8, name: "John Doe", email: "john@modulelib.dev", role: "Developer", teamId: "backend", initials: "JD" },
    { id: 9, name: "Jane Smith", email: "jane@modulelib.dev", role: "Developer", teamId: "backend", initials: "JS" },
    { id: 10, name: "Alice Cooper", email: "alice@modulelib.dev", role: "Developer", teamId: "devops", initials: "AC" },
    { id: 11, name: "Bob Martin", email: "bob@modulelib.dev", role: "Developer", teamId: "platform", initials: "BM" },
    { id: 12, name: "Priya Patel", email: "priya@modulelib.dev", role: "Developer", teamId: "platform", initials: "PP" },
  ]);

  // Mock team activity logs
  const teamLogs = [
    { id: 1, teamId: "frontend", action: "Published v1.0.4 of @org/ui-components", user: "David Vance", time: "5 hours ago" },
    { id: 2, teamId: "backend", action: "Verified JWT session validations key sync", user: "Algo Helper", time: "2 hours ago" },
    { id: 3, teamId: "devops", action: "Upgraded Winston log transports support", user: "Marcus Aurelius", time: "1 day ago" },
    { id: 4, teamId: "devops", action: "Resolved CVE vulnerability patch warning", user: "Marcus Aurelius", time: "2 days ago" },
    { id: 5, teamId: "frontend", action: "Assigned ownership of @org/form-validator", user: "Rohit Algou", time: "3 days ago" },
  ];

  // States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [isAddTeamOpen, setIsAddTeamOpen] = useState(false);

  // Invite Member State
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("Developer");
  const [inviteTeamId, setInviteTeamId] = useState("");
  const [toastMessage, setToastMessage] = useState(null);

  const handleInviteSubmit = (e) => {
    e.preventDefault();
    if (!inviteName || !inviteEmail) return;

    const initials = inviteName.split(" ").map(n => n[0]).join("").toUpperCase();
    const newMember = {
      id: members.length + 1,
      name: inviteName,
      email: inviteEmail,
      role: inviteRole,
      teamId: inviteTeamId,
      initials,
    };

    setMembers([...members, newMember]);
    setToastMessage(`Successfully invited ${inviteName} to the team!`);
    setTimeout(() => setToastMessage(null), 4000);

    // Reset forms
    setInviteName("");
    setInviteEmail("");
    setInviteRole("Developer");
    setIsInviteOpen(false);
  };

  // Form State
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamLead, setNewTeamLead] = useState("");
  const [newTeamDesc, setNewTeamDesc] = useState("");
  const [newTeamStatus, setNewTeamStatus] = useState("Active");

  // Dynamic filter lists
  const filteredTeams = teams.filter((team) => {
    // Search filter
    const matchesSearch =
      team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      team.lead.toLowerCase().includes(searchQuery.toLowerCase()) ||
      members
        .filter((m) => m.teamId === team.id)
        .some((m) => m.name.toLowerCase().includes(searchQuery.toLowerCase()));

    // Status filter
    const matchesStatus = selectedStatus === "all" || team.status === selectedStatus;

    // Role filter (check if team has members matching role)
    const matchesRole =
      selectedRole === "all" ||
      members.filter((m) => m.teamId === team.id).some((m) => m.role === selectedRole);

    return matchesSearch && matchesStatus && matchesRole;
  });

  // Calculate statistics
  const totalTeamsCount = teams.length;
  const activeMembersCount = members.length;
  const maintainersCount = members.filter((m) => m.role === "Maintainer").length;
  const developersCount = members.filter((m) => m.role === "Developer").length;

  const handleAddTeamSubmit = (e) => {
    e.preventDefault();
    if (!newTeamName || !newTeamLead) return;

    const newTeamId = newTeamName.toLowerCase().replace(/\s+/g, "-");
    const newTeamObj = {
      id: newTeamId,
      name: newTeamName,
      lead: newTeamLead,
      leadEmail: `${newTeamLead.toLowerCase().split(" ")[0]}@modulelib.dev`,
      description: newTeamDesc || "No description provided.",
      status: newTeamStatus,
      modulesCount: 0,
      modulesList: [],
      createdDate: new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
    };

    setTeams([...teams, newTeamObj]);
    
    // Automatically add the lead as a member of this team
    const newMemberObj = {
      id: members.length + 1,
      name: newTeamLead,
      email: `${newTeamLead.toLowerCase().split(" ")[0]}@modulelib.dev`,
      role: "Maintainer",
      teamId: newTeamId,
      initials: newTeamLead.split(" ").map(n => n[0]).join("").toUpperCase(),
    };
    setMembers([...members, newMemberObj]);

    // Reset fields
    setNewTeamName("");
    setNewTeamLead("");
    setNewTeamDesc("");
    setNewTeamStatus("Active");
    setIsAddTeamOpen(false);
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedRole("all");
    setSelectedStatus("all");
    setError(null);
  };

  // Simulate loader when query changes
  useEffect(() => {
    if (searchQuery || selectedRole !== "all" || selectedStatus !== "all") {
      setLoading(true);
      const timer = setTimeout(() => setLoading(false), 300);
      return () => clearTimeout(timer);
    }
  }, [searchQuery, selectedRole, selectedStatus]);

  return (
    <div className="space-y-6 animate-fade-in text-white pb-10">
      
      {/* 1. Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Team Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage product teams, assign repository ownerships, and allocate registry permissions.
          </p>
        </div>
        
        {/* Actions - Add Team & Simulations */}
        <div className="flex items-center gap-2">
          {/* Simulate error state toggle */}
          <button
            onClick={() => setError(error ? null : "Telemetry connection timed out (Simulated API error).")}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
              error
                ? "bg-red-500/25 border-red-500 text-red-300"
                : "border-border/60 hover:bg-card text-muted-foreground"
            }`}
          >
            Simulate Error
          </button>

          {/* Invite Member button */}
          <Button onClick={() => {
            setInviteTeamId(selectedTeam?.id || teams[0]?.id || "");
            setIsInviteOpen(true);
          }} variant="secondary" size="sm" className="gap-1.5 h-9 px-4 text-xs font-bold">
            <UserPlus size={14} />
            Invite Member
          </Button>
          
          {/* Add Team button */}
          <Button onClick={() => setIsAddTeamOpen(true)} variant="primary" size="sm" className="gap-1.5 h-9 px-4 text-xs font-bold shadow-[0_2px_10px_rgba(212,166,79,0.15)]">
            <Plus size={14} />
            Add Team
          </Button>
        </div>
      </div>

      {/* 2. Statistics Overview Row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Total Teams", value: totalTeamsCount, icon: Users, color: "text-gold-300 bg-gold-500/10 border-gold-500/10" },
          { label: "Active Members", value: activeMembersCount, icon: UserCheck, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/10" },
          { label: "Maintainers", value: maintainersCount, icon: Shield, color: "text-amber-400 bg-amber-500/10 border-amber-500/10" },
          { label: "Developers", value: developersCount, icon: UserPlus, color: "text-gold-200 bg-gold-200/10 border-gold-200/10" },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className={`card border flex items-center justify-between p-4 bg-card/60 ${stat.color}`}>
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{stat.label}</span>
                <div className="text-2xl font-black text-foreground font-mono">{stat.value}</div>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-background/50 border border-border/40 text-gold-300">
                <Icon size={16} />
              </div>
            </div>
          );
        })}
      </div>

      {/* 5. Search and Filters Row */}
      <div className="flex flex-col md:flex-row gap-3.5 bg-card/20 border border-border/60 p-4 rounded-xl">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search teams, leads, or members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-4 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-gold-500 focus:outline-none placeholder-muted-foreground text-foreground"
          />
        </div>

        {/* Filters dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Role Filter */}
          <div className="flex items-center gap-1.5">
            <Filter size={12} className="text-muted-foreground" />
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="h-9 px-2.5 rounded-lg bg-background border border-border text-xs focus:outline-none focus:ring-1 focus:ring-gold-500 text-muted-foreground"
            >
              <option value="all">All Roles</option>
              <option value="Admin">Admin</option>
              <option value="Maintainer">Maintainer</option>
              <option value="Developer">Developer</option>
            </select>
          </div>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="h-9 px-2.5 rounded-lg bg-background border border-border text-xs focus:outline-none focus:ring-1 focus:ring-gold-500 text-muted-foreground"
          >
            <option value="all">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Idle">Idle</option>
            <option value="Archived">Archived</option>
          </select>

          {/* Clear filters */}
          {(searchQuery || selectedRole !== "all" || selectedStatus !== "all" || error) && (
            <Button onClick={handleResetFilters} variant="ghost" size="sm" className="h-9 px-3 text-xs text-gold-300 hover:text-gold-200">
              Reset Filters
            </Button>
          )}
        </div>
      </div>

      {/* 6. Page Content States */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-card/10 border border-border/40 rounded-xl space-y-3">
          <Loader2 className="h-8 w-8 text-gold-500 animate-spin" />
          <span className="text-xs text-muted-foreground">Filtering team registries...</span>
        </div>
      ) : error ? (
        /* Error State UI */
        <div className="flex flex-col items-center justify-center py-16 bg-red-500/5 border border-red-500/20 rounded-xl space-y-4 text-center max-w-2xl mx-auto">
          <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-400">
            <AlertTriangle size={24} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">API Connection Failure</h3>
            <p className="text-xs text-muted-foreground mt-1 px-6">{error}</p>
          </div>
          <Button onClick={handleResetFilters} variant="secondary" size="sm" className="text-xs">
            Retry Connection
          </Button>
        </div>
      ) : filteredTeams.length === 0 ? (
        /* Empty State UI */
        <div className="flex flex-col items-center justify-center py-20 bg-card/15 border border-border/40 rounded-xl space-y-4 text-center">
          <div className="h-12 w-12 rounded-full bg-border/40 flex items-center justify-center text-muted-foreground">
            <Users size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">No Teams Found</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Adjust your filters or query constraints and search again.
            </p>
          </div>
          <Button onClick={handleResetFilters} variant="secondary" size="sm" className="text-xs">
            Clear Search filters
          </Button>
        </div>
      ) : (
        /* Teams Table & Members Grid Layout */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Left Panel: Teams Table (Col span 2) */}
          <div className="lg:col-span-2 card overflow-hidden p-0 border border-border">
            <div className="border-b border-border bg-card/40 px-5 py-3.5">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[#D4A64F]">Registry Groups</h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-background/25">
                    {["Team Name", "Team Lead", "Members", "Modules Owned", "Status", "Actions"].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-card/10">
                  {filteredTeams.map((team) => {
                    const teamMembers = members.filter((m) => m.teamId === team.id);
                    return (
                      <tr
                        key={team.id}
                        onClick={() => setSelectedTeam(team)}
                        className="group transition-colors hover:bg-gold-500/5 cursor-pointer"
                      >
                        {/* Team Name */}
                        <td className="px-5 py-3.5">
                          <div className="font-semibold text-foreground group-hover:text-gold-300 transition-colors">
                            {team.name}
                          </div>
                          <div className="text-[10px] text-muted-foreground/80 line-clamp-1 mt-0.5 max-w-[200px]">
                            {team.description}
                          </div>
                        </td>
                        
                        {/* Team Lead */}
                        <td className="px-5 py-3.5 text-xs">
                          <div className="font-semibold text-foreground">{team.lead}</div>
                          <div className="text-[10px] text-muted-foreground font-mono">{team.leadEmail}</div>
                        </td>
                        
                        {/* Members count */}
                        <td className="px-5 py-3.5 text-xs font-mono text-foreground">
                          {teamMembers.length} members
                        </td>
                        
                        {/* Modules Owned */}
                        <td className="px-5 py-3.5 text-xs font-mono text-gold-300">
                          {team.modulesCount} modules
                        </td>
                        
                        {/* Status */}
                        <td className="px-5 py-3.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                            team.status === "Active"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          }`}>
                            {team.status}
                          </span>
                        </td>
                        
                        {/* Actions */}
                        <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1.5">
                            <Button
                              onClick={() => setSelectedTeam(team)}
                              variant="ghost"
                              className="h-7 px-2 text-[10px] text-gold-300 hover:text-gold-200"
                            >
                              View
                            </Button>
                            <Button
                              onClick={() => alert(`Assign modules flow for: ${team.name}`)}
                              variant="ghost"
                              className="h-7 px-2 text-[10px] text-muted-foreground hover:text-foreground"
                            >
                              Assign
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Panel: Team Members List */}
          <div className="card overflow-hidden p-0 border border-border">
            <div className="border-b border-border bg-card/40 px-5 py-3.5 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[#D4A64F]">Active Members</h3>
              <span className="text-[10px] font-mono text-muted-foreground">{members.length} registered</span>
            </div>
            
            <div className="divide-y divide-border/60 max-h-[420px] overflow-y-auto bg-card/10">
              {members.slice(0, 7).map((member) => {
                const memberTeam = teams.find((t) => t.id === member.teamId);
                return (
                  <div key={member.id} className="p-4 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                      <Avatar initials={member.initials} size="sm" className="bg-gradient-to-br from-gold-600 to-gold-900 text-white font-mono" />
                      <div>
                        <h4 className="font-semibold text-foreground">{member.name}</h4>
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono">
                          <Mail size={10} />
                          {member.email}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="default" className="text-[9px] uppercase tracking-wider scale-90">
                        {member.role}
                      </Badge>
                      <div className="text-[9px] text-gold-300 font-mono mt-0.5">{memberTeam ? memberTeam.name : "Unassigned"}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* 8. Team Details Drawer/Modal (Sliding Drawer from Right) */}
      {selectedTeam && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div
            onClick={() => setSelectedTeam(null)}
            className="absolute inset-0 bg-black/75 backdrop-blur-sm transition-opacity duration-300"
          />
          
          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-card border-l border-border/80 text-white shadow-2xl flex flex-col justify-between">
              
              {/* Drawer Header */}
              <div className="p-6 border-b border-border bg-background/25 flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold font-mono text-foreground">{selectedTeam.name}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">Team Lead:</span>
                    <span className="text-xs font-semibold text-gold-300 font-mono">{selectedTeam.lead}</span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedTeam(null)}
                  className="p-1 rounded border border-border/60 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* Description */}
                <div className="space-y-1.5">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#D4A64F]">About Team</h4>
                  <p className="text-xs leading-relaxed text-muted-foreground/90">{selectedTeam.description}</p>
                </div>

                <Separator className="opacity-30" />

                {/* Team Lead Card */}
                <div className="space-y-2.5">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#D4A64F]">Department Lead</h4>
                  <div className="flex items-center gap-3 bg-background/50 border border-border p-3.5 rounded-lg">
                    <Avatar initials={selectedTeam.lead.split(" ").map(n => n[0]).join("")} size="md" className="bg-gradient-to-br from-gold-500 to-gold-800" />
                    <div>
                      <h5 className="text-xs font-bold text-foreground">{selectedTeam.lead}</h5>
                      <span className="text-[10px] text-muted-foreground font-mono">{selectedTeam.leadEmail}</span>
                      <span className="block text-[9px] text-[#D4A64F] uppercase tracking-wider mt-0.5">Team Lead & Admin</span>
                    </div>
                  </div>
                </div>

                {/* Member list */}
                <div className="space-y-2.5">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#D4A64F]">
                    Team Members ({members.filter((m) => m.teamId === selectedTeam.id).length})
                  </h4>
                  <div className="divide-y divide-border/40 bg-background/25 border border-border/80 rounded-lg overflow-hidden">
                    {members
                      .filter((m) => m.teamId === selectedTeam.id)
                      .map((member) => (
                        <div key={member.id} className="p-3 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2.5">
                            <Avatar initials={member.initials} size="sm" className="bg-gradient-to-br from-secondary to-border/80 text-foreground" />
                            <div>
                              <div className="font-semibold text-foreground">{member.name}</div>
                              <div className="text-[9px] text-muted-foreground font-mono">{member.email}</div>
                            </div>
                          </div>
                          <Badge variant="default" className="text-[8px] uppercase tracking-wider scale-90">
                            {member.role}
                          </Badge>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Owned Modules list */}
                <div className="space-y-2.5">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#D4A64F]">
                    Owned Registry Packages ({selectedTeam.modulesList.length})
                  </h4>
                  {selectedTeam.modulesList.length === 0 ? (
                    <div className="text-xs text-muted-foreground bg-background/20 p-4 rounded-lg border border-border/50 flex items-center justify-center gap-2">
                      <FolderOpen size={13} />
                      <span>No packages currently owned.</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-2">
                      {selectedTeam.modulesList.map((modId) => (
                        <Link
                          key={modId}
                          to={`/dashboard/modules/${modId}`}
                          onClick={() => setSelectedTeam(null)}
                          className="flex items-center justify-between p-3 rounded-lg border border-border bg-background/40 hover:border-gold-500/25 transition-all text-xs font-mono text-gold-300"
                        >
                          <span>@org/{modId}</span>
                          <ArrowRight size={12} className="text-muted-foreground group-hover:text-gold-300" />
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent activity summary */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#D4A64F] flex items-center gap-1">
                    <History size={12} />
                    Recent Activity
                  </h4>
                  <div className="space-y-3.5 pl-1.5">
                    {teamLogs
                      .filter((log) => log.teamId === selectedTeam.id)
                      .map((log) => (
                        <div key={log.id} className="relative flex gap-3.5 items-start">
                          <span className="mt-1 h-2 w-2 rounded-full bg-gold-300 flex-shrink-0" />
                          <div className="space-y-0.5">
                            <p className="text-[10px] text-foreground leading-tight">{log.action}</p>
                            <span className="block text-[8px] text-muted-foreground/60 font-mono">
                              By {log.user} · {log.time}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

              </div>

              {/* Drawer Footer */}
              <div className="p-4 border-t border-border bg-background/25 flex gap-2">
                <Button
                  onClick={() => {
                    setInviteTeamId(selectedTeam.id);
                    setIsInviteOpen(true);
                  }}
                  variant="primary"
                  size="sm"
                  className="flex-1 text-xs font-bold"
                >
                  Invite Member
                </Button>
                <Button
                  onClick={() => alert(`Edit team details flow for: ${selectedTeam.name}`)}
                  variant="secondary"
                  size="sm"
                  className="flex-1 text-xs"
                >
                  Edit Team
                </Button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* 8. Add Team Dialog / Modal */}
      {isAddTeamOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div onClick={() => setIsAddTeamOpen(false)} className="absolute inset-0 bg-black/85 backdrop-blur-sm" />
          
          <Card className="relative w-full max-w-md p-6 bg-card border border-border shadow-2xl rounded-xl space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h3 className="text-lg font-bold font-mono text-foreground flex items-center gap-2">
                <Users size={16} className="text-gold-300" />
                Add New Team
              </h3>
              <button
                onClick={() => setIsAddTeamOpen(false)}
                className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-all"
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleAddTeamSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-muted-foreground font-semibold">Team Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Analytics Team"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg bg-background border border-border focus:ring-1 focus:ring-gold-500 focus:outline-none text-foreground"
                />
              </div>

              <div className="space-y-1">
                <label className="text-muted-foreground font-semibold">Team Lead Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jane Foster"
                  value={newTeamLead}
                  onChange={(e) => setNewTeamLead(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg bg-background border border-border focus:ring-1 focus:ring-gold-500 focus:outline-none text-foreground"
                />
              </div>

              <div className="space-y-1">
                <label className="text-muted-foreground font-semibold">Description</label>
                <textarea
                  placeholder="Describe the team's key package responsibilities..."
                  rows={3}
                  value={newTeamDesc}
                  onChange={(e) => setNewTeamDesc(e.target.value)}
                  className="w-full p-3 rounded-lg bg-background border border-border focus:ring-1 focus:ring-gold-500 focus:outline-none text-foreground"
                />
              </div>

              <div className="space-y-1">
                <label className="text-muted-foreground font-semibold">Status</label>
                <select
                  value={newTeamStatus}
                  onChange={(e) => setNewTeamStatus(e.target.value)}
                  className="w-full h-9 px-2 rounded-lg bg-background border border-border focus:outline-none focus:ring-1 focus:ring-gold-500 text-muted-foreground"
                >
                  <option value="Active">Active</option>
                  <option value="Idle">Idle</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border/60">
                <Button
                  type="button"
                  onClick={() => setIsAddTeamOpen(false)}
                  variant="secondary"
                  size="sm"
                  className="h-9 px-4"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  className="h-9 px-4 font-bold"
                >
                  Add Team
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Invite Member Dialog / Modal */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setIsInviteOpen(false)} className="absolute inset-0 bg-black/85 backdrop-blur-sm" />
          
          <Card className="relative w-full max-w-md p-6 bg-card border border-border shadow-2xl rounded-xl space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h3 className="text-lg font-bold font-mono text-foreground flex items-center gap-2">
                <UserPlus size={16} className="text-gold-300" />
                Invite New Member
              </h3>
              <button
                onClick={() => setIsInviteOpen(false)}
                className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-all"
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleInviteSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-muted-foreground font-semibold">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sarah Connor"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg bg-background border border-border focus:ring-1 focus:ring-gold-500 focus:outline-none text-foreground"
                />
              </div>

              <div className="space-y-1">
                <label className="text-muted-foreground font-semibold">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. sarah@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg bg-background border border-border focus:ring-1 focus:ring-gold-500 focus:outline-none text-foreground"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-muted-foreground font-semibold">Assigned Team</label>
                  <select
                    value={inviteTeamId}
                    onChange={(e) => setInviteTeamId(e.target.value)}
                    className="w-full h-9 px-2 rounded-lg bg-background border border-border focus:outline-none focus:ring-1 focus:ring-gold-500 text-muted-foreground text-xs"
                  >
                    {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-muted-foreground font-semibold">Portal Role</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full h-9 px-2 rounded-lg bg-background border border-border focus:outline-none focus:ring-1 focus:ring-gold-500 text-muted-foreground text-xs"
                  >
                    <option value="Admin">Admin</option>
                    <option value="Maintainer">Maintainer</option>
                    <option value="Developer">Developer</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border/60">
                <Button
                  type="button"
                  onClick={() => setIsInviteOpen(false)}
                  variant="secondary"
                  size="sm"
                  className="h-9 px-4"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  className="h-9 px-4 font-bold"
                >
                  Send Invitation
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Toast alert */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-50 rounded-lg border border-emerald-500/30 bg-emerald-950/90 p-4 shadow-xl text-xs flex items-center gap-2.5 animate-slide-in-right">
          <CheckCircle size={15} className="text-emerald-400" />
          <span className="text-emerald-300">{toastMessage}</span>
        </div>
      )}

    </div>
  );
}
