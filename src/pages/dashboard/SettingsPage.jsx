import { useState } from "react";
import { User, Mail, Shield, Key, Bell, Copy, Check, Save, Eye, EyeOff, AlertTriangle } from "lucide-react";
import { api } from "../../lib/api";
import { useAuth } from "../../hooks/useAuth";
import { Card, Button, Input, Badge, Separator } from "../../components/ui/index";

export function SettingsPage() {
  const { user, getToken } = useAuth();
  const isAdmin = user?.role === "admin";
  const userId = user?._id || user?.id;

  // Active tab state: "profile" | "preferences" | "developer"
  const [activeTab, setActiveTab] = useState("profile");

  // Profile Form state (Admin editable, others read-only)
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Platform Preferences state
  const [pref, setPref] = useState({
    emailApproval: true,
    emailRelease: false,
    autoRefresh: true,
    compactMode: false,
  });

  // JWT Token visibility state
  const [showToken, setShowToken] = useState(false);
  const [copied, setCopied] = useState(false);

  const token = getToken() || "";

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;

    setSaveLoading(true);
    setSaveSuccess(false);
    setSaveError("");

    try {
      const updatedUser = await api.put(`/api/users/${userId}`, {
        name: form.name,
        email: form.email,
      });

      // Update local storage so data persists across reloads
      const stored = localStorage.getItem("ml_user");
      if (stored) {
        const storedJson = JSON.parse(stored);
        localStorage.setItem(
          "ml_user",
          JSON.stringify({ ...storedJson, name: form.name, email: form.email })
        );
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err.message || "Failed to update profile.");
    } finally {
      setSaveLoading(false);
    }
  };

  const handleCopyToken = () => {
    navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const roleColors = {
    admin: "primary",
    maintainer: "cyan",
    developer: "default",
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage your account details, platform preferences, and API credentials.
        </p>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-white/[0.06] gap-5">
        {[
          { id: "profile", label: "Account Settings", icon: User },
          { id: "preferences", label: "Platform Preferences", icon: Bell },
          { id: "developer", label: "Developer API", icon: Key },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 pb-3.5 text-sm font-semibold border-b-2 transition-all duration-200
                ${isActive 
                  ? "border-gold-500 text-gold-300" 
                  : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <div className="mt-4">
        {/* 1. Account Settings */}
        {activeTab === "profile" && (
          <form onSubmit={handleProfileSubmit} className="space-y-5">
            <Card className="border-white/[0.06] p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-white/[0.04] pb-3">
                <div>
                  <h2 className="text-sm font-semibold text-foreground">Account Information</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isAdmin 
                      ? "Update your personal details below." 
                      : "View your personal account details below."
                    }
                  </p>
                </div>
                <Badge variant={roleColors[user?.role] || "default"}>
                  {user?.role || "developer"}
                </Badge>
              </div>

              {/* Status Notice */}
              {saveSuccess && (
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-400">
                  Profile updated successfully! Refresh page to update top bar info.
                </div>
              )}
              {saveError && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-400 flex gap-2">
                  <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                  <span>{saveError}</span>
                </div>
              )}

              {/* Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Full Name"
                  id="settings-name"
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  disabled={!isAdmin || saveLoading}
                  placeholder="Enter your full name"
                />

                <Input
                  label="Email Address"
                  id="settings-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  disabled={!isAdmin || saveLoading}
                  placeholder="Enter your email"
                />
              </div>

              {/* Readonly Notice for Non-Admins */}
              {!isAdmin && (
                <div className="flex gap-2 rounded-lg bg-white/[0.02] border border-white/[0.04] p-3 text-xs text-muted-foreground">
                  <Shield size={14} className="text-gold-300 flex-shrink-0 mt-0.5" />
                  <span>
                    Profile changes are restricted to administrators. Contact your platform administrator to request email or username modifications.
                  </span>
                </div>
              )}

              {/* Submit for Admin */}
              {isAdmin && (
                <div className="flex justify-end pt-2 border-t border-white/[0.04]">
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    loading={saveLoading}
                    className="flex items-center gap-1.5"
                  >
                    <Save size={14} />
                    Save Changes
                  </Button>
                </div>
              )}
            </Card>

            <Card className="border-white/[0.06] p-5">
              <h2 className="text-sm font-semibold text-foreground mb-3">Membership Details</h2>
              <div className="text-xs text-muted-foreground space-y-2">
                <div className="flex justify-between py-1.5 border-b border-white/[0.04]">
                  <span>Registration Status</span>
                  <span className="text-emerald-400 font-semibold">Active</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-white/[0.04]">
                  <span>Account Type</span>
                  <span className="text-foreground capitalize">{user?.role || "Developer"} Account</span>
                </div>
                {user?.createdAt && (
                  <div className="flex justify-between py-1.5">
                    <span>Joined Date</span>
                    <span className="text-foreground">
                      {new Date(user.createdAt).toLocaleDateString("en-US", {
                        year: "numeric", month: "long", day: "numeric",
                      })}
                    </span>
                  </div>
                )}
              </div>
            </Card>
          </form>
        )}

        {/* 2. Platform Preferences */}
        {activeTab === "preferences" && (
          <Card className="border-white/[0.06] p-5 space-y-5">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Platform Preferences</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Configure local application settings and toggles.
              </p>
            </div>

            <div className="space-y-4">
              {/* Auto Refresh */}
              <div className="flex items-center justify-between py-3 border-b border-white/[0.04]">
                <div>
                  <label htmlFor="pref-auto-refresh" className="text-sm font-medium text-foreground cursor-pointer">
                    Auto-Refresh Dashboards
                  </label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Automatically poll database queues every 30 seconds.
                  </p>
                </div>
                <input
                  id="pref-auto-refresh"
                  type="checkbox"
                  checked={pref.autoRefresh}
                  onChange={(e) => setPref({ ...pref, autoRefresh: e.target.checked })}
                  className="peer h-4 w-4 cursor-pointer rounded border-white/[0.1] bg-white/[0.03] checked:bg-gold-500 checked:border-gold-500"
                />
              </div>

              {/* Email approval alerts */}
              <div className="flex items-center justify-between py-3 border-b border-white/[0.04]">
                <div>
                  <label htmlFor="pref-email-app" className="text-sm font-medium text-foreground cursor-pointer">
                    Module Status Alerts
                  </label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Receive email notifications when your modules change status.
                  </p>
                </div>
                <input
                  id="pref-email-app"
                  type="checkbox"
                  checked={pref.emailApproval}
                  onChange={(e) => setPref({ ...pref, emailApproval: e.target.checked })}
                  className="peer h-4 w-4 cursor-pointer rounded border-white/[0.1] bg-white/[0.03] checked:bg-gold-500 checked:border-gold-500"
                />
              </div>

              {/* Email release notifications */}
              <div className="flex items-center justify-between py-3 border-b border-white/[0.04]">
                <div>
                  <label htmlFor="pref-email-rel" className="text-sm font-medium text-foreground cursor-pointer">
                    Weekly Digest
                  </label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Receive a summary of recently approved community modules.
                  </p>
                </div>
                <input
                  id="pref-email-rel"
                  type="checkbox"
                  checked={pref.emailRelease}
                  onChange={(e) => setPref({ ...pref, emailRelease: e.target.checked })}
                  className="peer h-4 w-4 cursor-pointer rounded border-white/[0.1] bg-white/[0.03] checked:bg-gold-500 checked:border-gold-500"
                />
              </div>

              {/* Compact list mode */}
              <div className="flex items-center justify-between py-3">
                <div>
                  <label htmlFor="pref-compact" className="text-sm font-medium text-foreground cursor-pointer">
                    Compact View Mode
                  </label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Render smaller dashboard cards for package list grids.
                  </p>
                </div>
                <input
                  id="pref-compact"
                  type="checkbox"
                  checked={pref.compactMode}
                  onChange={(e) => setPref({ ...pref, compactMode: e.target.checked })}
                  className="peer h-4 w-4 cursor-pointer rounded border-white/[0.1] bg-white/[0.03] checked:bg-gold-500 checked:border-gold-500"
                />
              </div>
            </div>
          </Card>
        )}

        {/* 3. Developer API */}
        {activeTab === "developer" && (
          <Card className="border-white/[0.06] p-5 space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Developer Authorization Credentials</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Use this JWT token to authenticate curl requests or custom CLI pipelines.
              </p>
            </div>

            <div className="flex gap-2 items-center">
              <div className="relative flex-1 bg-white/[0.02] border border-white/[0.06] rounded-lg p-3 font-mono text-xs text-muted-foreground select-all break-all pr-10">
                {showToken ? token : `${token.slice(0, 45)}... [hidden]`}
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Toggle token visibility"
                >
                  {showToken ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>

              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleCopyToken}
                className="h-10 px-3.5 flex items-center justify-center flex-shrink-0"
              >
                {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </Button>
            </div>

            <div className="rounded-lg bg-gold-500/5 border border-gold-500/15 p-4 text-xs text-muted-foreground leading-relaxed">
              <span className="font-semibold text-gold-300 block mb-1">Testing with CLI:</span>
              To make requests manually to the backend API, append the token in your Authorization header:
              <pre className="mt-2 bg-black/30 border border-white/[0.05] rounded p-2 overflow-x-auto text-[10px] text-foreground font-mono">
                curl -H "Authorization: Bearer [TOKEN]" http://localhost:5000/api/modules
              </pre>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
