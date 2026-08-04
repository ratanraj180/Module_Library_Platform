import { cn } from "../../lib/utils";

// ─── Button ───────────────────────────────────────────────────────────────────
export function Button({
  children,
  variant = "primary",
  size = "md",
  className,
  disabled,
  loading,
  ...props
}) {
  const base =
    "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:pointer-events-none";

  const variants = {
    primary: "btn-primary",
    secondary: "btn-secondary",
    ghost: "btn-ghost",
    destructive:
      "rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700",
    link: "text-gold-300 hover:text-gold-200 underline-offset-4 hover:underline text-sm",
  };

  const sizes = {
    sm: "rounded-md px-3 py-1.5 text-xs",
    md: "rounded-lg px-5 py-2.5 text-sm",
    lg: "rounded-xl px-8 py-3.5 text-base",
    icon: "rounded-lg p-2",
  };

  return (
    <button
      className={cn(
        base,
        variants[variant],
        variant !== "ghost" && variant !== "link" ? sizes[size] : "",
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg
          className="h-4 w-4 animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}

// ─── Input ────────────────────────────────────────────────────────────────────
export function Input({ label, error, className, id, ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={id}
          className="text-sm font-medium text-foreground"
        >
          {label}
        </label>
      )}
      <input
        id={id}
        className={cn(
          "input-field",
          error && "border-red-500 focus:ring-red-500/20 focus:border-red-500",
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────
export function Badge({ children, variant = "default", className }) {
  const variants = {
    default: "badge bg-secondary text-muted-foreground",
    stable: "badge-stable",
    beta: "badge-beta",
    deprecated: "badge-deprecated",
    primary: "badge bg-gold-500/10 text-gold-300 ring-1 ring-gold-500/20",
    cyan: "badge bg-gold-200/10 text-gold-200 ring-1 ring-gold-200/20",
    // legacy alias kept for any code that referenced 'violet'
    violet: "badge bg-gold-500/10 text-gold-300 ring-1 ring-gold-500/20",
  };

  return (
    <span className={cn(variants[variant] ?? variants.default, className)}>
      {children}
    </span>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────
export function Card({ children, className, hover = false, ...props }) {
  return (
    <div
      className={cn(hover ? "card-hover" : "card", className)}
      {...props}
    >
      {children}
    </div>
  );
}

// ─── Separator ────────────────────────────────────────────────────────────────
export function Separator({ className, orientation = "horizontal" }) {
  return (
    <div
      className={cn(
        "bg-border",
        orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
        className
      )}
    />
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
export function Avatar({ initials, src, size = "md", className }) {
  const sizes = {
    sm: "h-7 w-7 text-xs",
    md: "h-9 w-9 text-sm",
    lg: "h-12 w-12 text-base",
  };

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full font-semibold text-white",
        "bg-gradient-to-br from-gold-500 to-gold-700 ring-2 ring-gold-500/25",
        sizes[size],
        className
      )}
    >
      {src ? (
        <img src={src} alt="avatar" className="h-full w-full rounded-full object-cover" />
      ) : (
        initials
      )}
    </div>
  );
}
