import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  CheckCircle,
  AlertOctagon,
  Clock,
  Eye,
  Check,
  X,
  ShieldCheck,
} from "lucide-react";
import { Card, Badge, Button } from "../../components/ui/index";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../../components/ui/table";
import { cn } from "../../lib/utils";

const initialSubmissions = [
  {
    id: 1,
    name: "@org/payment-gateway",
    team: "Backend Team",
    submittedBy: "Alex Kim",
    submittedAt: "Jun 12, 2026",
    version: "1.0.0",
    status: "Pending",
  },
  {
    id: 2,
    name: "@org/notification-service",
    team: "Platform Team",
    submittedBy: "Jordan Liu",
    submittedAt: "Jun 11, 2026",
    version: "1.0.1",
    status: "Pending",
  },
  {
    id: 3,
    name: "@org/theme-provider",
    team: "Frontend Team",
    submittedBy: "Sarah Chen",
    submittedAt: "Jun 11, 2026",
    version: "1.0.1-beta.1",
    status: "Pending",
  },
  {
    id: 4,
    name: "@org/cache-manager",
    team: "DevOps Team",
    submittedBy: "Priya Patel",
    submittedAt: "Jun 10, 2026",
    version: "1.2.0",
    status: "Pending",
  },
];

export function ModuleReviewPage() {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState(initialSubmissions);
  const [rejectionTarget, setRejectionTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [notification, setNotification] = useState(null);

  const handleApprove = (id, name) => {
    setSubmissions((prev) =>
      prev.map((sub) => (sub.id === id ? { ...sub, status: "Approved" } : sub))
    );
    showToast(`Approved Module: ${name} v1.0.0 is live on registry index.`);
  };

  const handleOpenReject = (item) => {
    setRejectionTarget(item);
    setRejectReason("");
  };

  const handleRejectSubmit = (e) => {
    e.preventDefault();
    if (!rejectionTarget || !rejectReason) return;
    
    setSubmissions((prev) =>
      prev.map((sub) => (sub.id === rejectionTarget.id ? { ...sub, status: "Rejected" } : sub))
    );
    showToast(`Rejected Module: ${rejectionTarget.name}. Reason logged.`, "error");
    setRejectionTarget(null);
  };

  const showToast = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const statusStyles = {
    Pending: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    Approved: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    Rejected: "bg-red-500/10 text-red-400 border border-red-500/20",
  };

  return (
    <div className="space-y-6 animate-fade-in text-white pb-10 max-w-[1400px]">
      
      {/* Toast Notification */}
      {notification && (
        <div className={cn(
          "fixed bottom-4 right-4 z-50 rounded-lg border p-4 shadow-xl text-xs flex items-center gap-3 animate-slide-in-right",
          notification.type === "success" 
            ? "border-emerald-500/30 bg-emerald-950/90 text-emerald-300"
            : "border-red-500/30 bg-red-950/90 text-red-300"
        )}>
          {notification.type === "success" ? <CheckCircle size={16} /> : <AlertOctagon size={16} />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="border-b border-white/[0.06] pb-5">
        <h1 className="text-2xl font-bold text-foreground">Module Review Queue</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Govern incoming package submissions, review CVE scans, and check license compliance standards.
        </p>
      </div>

      {/* Table summary */}
      <Card className="p-5 bg-card/30 border-white/[0.06]">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/[0.04]">
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-gold-300" />
            <h3 className="text-sm font-semibold text-foreground">Submissions Index</h3>
          </div>
          <span className="text-[10px] text-muted-foreground/40 font-mono">Platform compliance audits</span>
        </div>

        {submissions.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.02] border border-white/[0.04]">
              <ShieldCheck size={20} className="text-emerald-400" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-foreground">Queue is Clear</h4>
              <p className="text-xs text-muted-foreground/60 mt-1">All incoming registry submissions have been processed.</p>
            </div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-b border-white/[0.04] hover:bg-transparent">
                <TableHead>Module Name</TableHead>
                <TableHead>Team</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Submission Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right pr-4">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submissions.map((item) => (
                <TableRow key={item.id} className="border-b border-white/[0.02]">
                  <TableCell className="font-mono text-xs text-foreground font-bold">
                    {item.name}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground/75">
                    {item.team}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground/80">
                    v{item.version}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground/60">
                    {item.submittedAt}
                  </TableCell>
                  <TableCell>
                    <Badge className={cn("text-[9px] uppercase tracking-wider font-mono", statusStyles[item.status])}>
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right pr-4">
                    <div className="inline-flex gap-1.5">
                      <Button
                        onClick={() => navigate(`/dashboard/modules/${item.name.replace("@org/", "")}`)}
                        variant="secondary"
                        size="sm"
                        className="h-8 px-2.5 text-xs gap-1 hover:bg-white/[0.04]"
                      >
                        <Eye size={12} />
                        View Details
                      </Button>
                      
                      {item.status === "Pending" && (
                        <>
                          <Button
                            onClick={() => handleApprove(item.id, item.name)}
                            variant="primary"
                            size="sm"
                            className="h-8 px-2.5 text-xs gap-1 font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            <Check size={12} />
                            Approve
                          </Button>

                          <Button
                            onClick={() => handleOpenReject(item)}
                            variant="destructive"
                            size="sm"
                            className="h-8 px-2.5 text-xs gap-1"
                          >
                            <X size={12} />
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Rejection Modal overlay */}
      {rejectionTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden">
          <div
            onClick={() => setRejectionTarget(null)}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          <div className="relative w-full max-w-md bg-card border border-white/[0.08] rounded-xl p-6 shadow-2xl text-white animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.04]">
              <h3 className="text-sm font-bold text-foreground">Reject Module Publication</h3>
              <button
                onClick={() => setRejectionTarget(null)}
                className="p-1 rounded text-muted-foreground hover:text-foreground"
              >
                <X size={14} />
              </button>
            </div>
            
            <form onSubmit={handleRejectSubmit} className="space-y-4 mt-4">
              <div className="text-xs text-muted-foreground leading-relaxed">
                You are rejecting <span className="font-mono text-gold-300 font-semibold">{rejectionTarget.name} v{rejectionTarget.version}</span>. Please state the grounds for rejection.
              </div>
              
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Rejection Reason</label>
                <textarea
                  required
                  placeholder="e.g. Package failed security vulnerability CVE scans."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="input-field min-h-20 py-2 resize-none text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/[0.04]">
                <Button
                  type="button"
                  onClick={() => setRejectionTarget(null)}
                  variant="secondary"
                  size="sm"
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  size="sm"
                  className="text-xs font-bold bg-red-600 hover:bg-red-700 text-white"
                >
                  Confirm Rejection
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
