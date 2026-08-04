import { cn } from "../../lib/utils";
import { notifications } from "../../data/mockData";
import { CheckCircle, AlertTriangle, Info, X, Bell } from "lucide-react";

const typeConfig = {
  success: {
    icon: CheckCircle,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
  },
  warning: {
    icon: AlertTriangle,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
  },
  info: {
    icon: Info,
    color: "text-gold-200",
    bg: "bg-gold-200/10",
    border: "border-gold-200/20",
  },
};

export function NotificationPanel({ open, onClose }) {
  if (!open) return null;

  return (
    <div
      id="notification-panel"
      className="absolute right-4 top-16 z-50 w-80 sm:w-96 animate-slide-in-right"
    >
      <div className="rounded-xl border border-border bg-popover shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <Bell size={16} className="text-gold-300" />
            <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
            <span className="badge bg-gold-500/10 text-gold-300 ring-1 ring-gold-500/20">
              {notifications.filter((n) => !n.read).length} new
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <X size={14} />
          </button>
        </div>

        {/* Notification list */}
        <ul className="max-h-80 overflow-y-auto divide-y divide-border">
          {notifications.map((notif) => {
            const cfg = typeConfig[notif.type] || typeConfig.info;
            return (
              <li
                key={notif.id}
                className={cn(
                  "flex items-start gap-3 px-4 py-3 transition-colors hover:bg-secondary/50",
                  !notif.read && "bg-gold-500/5"
                )}
              >
                <div
                  className={cn(
                    "mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border",
                    cfg.bg,
                    cfg.border
                  )}
                >
                  <cfg.icon size={14} className={cfg.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-foreground truncate">
                      {notif.title}
                    </p>
                    {!notif.read && (
                      <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gold-300" />
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                    {notif.message}
                  </p>
                  <p className="mt-1 text-[10px] text-muted-foreground/60">
                    {notif.time}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>

        {/* Footer */}
        <div className="border-t border-border px-4 py-2.5">
          <button className="text-xs font-medium text-gold-300 hover:text-gold-200 transition-colors">
            Mark all as read
          </button>
        </div>
      </div>
    </div>
  );
}
