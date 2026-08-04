import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Bell, Search, ChevronRight, ChevronDown, LogOut, User, Settings } from "lucide-react";
import { Avatar } from "../ui/index";
import { notifications } from "../../data/mockData";
import { useAuth } from "../../hooks/useAuth";
import { cn } from "../../lib/utils";
import { NotificationPanel } from "../shared/NotificationPanel";

function useBreadcrumbs() {
  const { pathname } = useLocation();
  const segments = pathname.replace(/^\//, "").split("/").filter(Boolean);

  return segments.map((seg, i) => ({
    label: seg.charAt(0).toUpperCase() + seg.slice(1),
    isLast: i === segments.length - 1,
  }));
}

export function TopBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const breadcrumbs = useBreadcrumbs();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <>
      <header className="flex h-12 items-center justify-between border-b border-white/[0.06] px-4 sm:px-6">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1 text-sm">
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && (
                <ChevronRight size={12} className="text-muted-foreground/40" />
              )}
              <span
                className={cn(
                  "transition-colors",
                  crumb.isLast
                    ? "text-foreground font-medium"
                    : "text-muted-foreground hover:text-gold-300 cursor-default"
                )}
              >
                {crumb.label}
              </span>
            </span>
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Search button */}
          <button className="hidden w-56 items-center gap-2 rounded-md border border-white/[0.06] bg-white/[0.02] px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-white/[0.1] hover:text-foreground sm:flex">
            <Search size={13} className="flex-shrink-0" />
            <span className="flex-1 text-left">Search...</span>
            <kbd className="rounded border border-white/[0.08] bg-white/[0.04] px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground/60">
              ⌘K
            </kbd>
          </button>

          {/* Notification bell */}
          <button
            onClick={() => {
              setNotifOpen((p) => !p);
              setProfileOpen(false);
            }}
            className="relative flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-white/[0.04] hover:text-foreground"
            aria-label="Notifications"
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span className="absolute right-1 top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-gold-600 text-[9px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Separator */}
          <div className="h-5 w-px bg-white/[0.06]" />

          {/* User avatar + dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setProfileOpen((p) => !p);
                setNotifOpen(false);
              }}
              className="flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-white/[0.04]"
              aria-label="User menu"
            >
              <Avatar initials={user?.initials || "??"} size="sm" className="h-6 w-6 text-[10px] ring-1 ring-gold-500/20" />
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 animate-scale-in rounded-xl border border-white/[0.08] bg-[#0f0f0f] shadow-2xl z-50">
                <div className="border-b border-white/[0.06] px-4 py-3">
                  <p className="text-sm font-semibold text-foreground">{user?.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
                <div className="p-1">
                  {[
                    { icon: User, label: "Profile", href: "/dashboard/profile" },
                    { icon: Settings, label: "Settings", href: "/dashboard/settings" },
                  ].map((item) => (
                    <Link
                      key={item.label}
                      to={item.href}
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-white/[0.04] hover:text-foreground"
                    >
                      <item.icon size={15} />
                      {item.label}
                    </Link>
                  ))}
                </div>
                <div className="border-t border-white/[0.06] p-1">
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-red-400 transition-colors hover:bg-red-500/10"
                  >
                    <LogOut size={15} />
                    Log Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <NotificationPanel open={notifOpen} onClose={() => setNotifOpen(false)} />

      {(profileOpen || notifOpen) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setProfileOpen(false);
            setNotifOpen(false);
          }}
        />
      )}
    </>
  );
}
