import { cn } from "../../lib/utils";

export function Progress({ value = 0, max = 100, className, barClassName }) {
  const percent = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div
      className={cn(
        "relative h-1.5 w-full overflow-hidden rounded-full bg-secondary",
        className
      )}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      <div
        className={cn(
          "h-full rounded-full transition-all duration-500 ease-out",
          "bg-gradient-to-r from-gold-600 to-gold-400",
          barClassName
        )}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
