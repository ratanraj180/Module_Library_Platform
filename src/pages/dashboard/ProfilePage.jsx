import { useState, useEffect } from "react";
import { User, Mail, Shield, Calendar, RefreshCw, AlertTriangle } from "lucide-react";
import { api } from "../../lib/api";
import { useAuth } from "../../hooks/useAuth";
import { Avatar, Badge, Card } from "../../components/ui/index";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function Skeleton({ className = "" }) {
  return <div className={`animate-pulse rounded bg-white/[0.05] ${className}`} />;
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-4 py-3 border-b border-white/[0.04] last:border-0">
      <div className="flex items-center gap-2 w-36 flex-shrink-0 text-muted-foreground">
        <Icon size={13} />
        <span className="text-xs">{label}</span>
      </div>
      <span className="text-sm text-foreground">{value || "—"}</span>
    </div>
  );
}

// ─── ProfilePage ──────────────────────────────────────────────────────────────
export function ProfilePage() {
  const { user: authUser } = useAuth();

  const [profile, setProfile]  = useState(null);
  const [loading, setLoading]  = useState(true);
  const [error, setError]      = useState("");

  const fetchProfile = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.get("/api/users/me");
      setProfile(data);
    } catch (err) {
      // Fallback: use the data stored at login if API call fails
      if (authUser) {
        setProfile(authUser);
      } else {
        setError(err.message || "Failed to load profile.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProfile(); }, []);

  const displayProfile = profile || authUser;
  const initials = displayProfile?.name
    ? displayProfile.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "??";

  const roleColor = {
    admin:       "primary",
    maintainer:  "cyan",
    developer:   "default",
  };

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Profile</h1>
        <button
          onClick={fetchProfile}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-all disabled:opacity-40"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400 flex gap-2">
          <AlertTriangle size={15} className="flex-shrink-0 mt-0.5" /> {error}
        </div>
      )}

      {/* Profile card */}
      <Card className="border-white/[0.06] p-6">
        {loading ? (
          <div className="flex items-center gap-5">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-56" />
              <Skeleton className="h-5 w-20" />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-5">
            <Avatar initials={initials} size="lg" />
            <div>
              <h2 className="text-lg font-bold text-foreground">{displayProfile?.name || "Unknown"}</h2>
              <p className="text-sm text-muted-foreground">{displayProfile?.email || "—"}</p>
              <div className="mt-2">
                <Badge variant={roleColor[displayProfile?.role] || "default"}>
                  {displayProfile?.role || "developer"}
                </Badge>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Details card */}
      <Card className="border-white/[0.06] p-5">
        <h2 className="text-sm font-semibold text-foreground mb-3">Account Information</h2>
        {loading ? (
          <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
        ) : (
          <>
            <InfoRow icon={User}     label="Full Name"   value={displayProfile?.name} />
            <InfoRow icon={Mail}     label="Email"       value={displayProfile?.email} />
            <InfoRow icon={Shield}   label="Role"        value={displayProfile?.role} />
            <InfoRow
              icon={Calendar}
              label="Member since"
              value={displayProfile?.createdAt
                ? new Date(displayProfile.createdAt).toLocaleDateString("en-US", {
                    year: "numeric", month: "long", day: "numeric",
                  })
                : "—"
              }
            />
          </>
        )}
      </Card>

      {/* Status */}
      <Card className="border-white/[0.06] p-5">
        <h2 className="text-sm font-semibold text-foreground mb-3">Account Status</h2>
        <div className="flex items-center gap-3">
          <div className={`h-2.5 w-2.5 rounded-full ${displayProfile?.isActive !== false ? "bg-emerald-400" : "bg-red-400"} ring-2 ring-offset-1 ring-offset-card ${displayProfile?.isActive !== false ? "ring-emerald-400/30" : "ring-red-400/30"}`} />
          <span className="text-sm text-foreground">
            {displayProfile?.isActive !== false ? "Active" : "Inactive"}
          </span>
        </div>
      </Card>
    </div>
  );
}
