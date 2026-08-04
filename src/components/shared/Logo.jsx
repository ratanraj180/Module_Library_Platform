import { cn } from "../../lib/utils";
import { Package } from "lucide-react";

export function Logo({ size = "md", showText = true, className }) {
  const sizes = {
    sm: { icon: 18, text: "text-base" },
    md: { icon: 22, text: "text-xl" },
    lg: { icon: 30, text: "text-3xl" },
  };

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      {/* Icon container */}
      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 rounded-lg bg-gold-600/20 blur-md" />
        <div className="relative rounded-lg bg-gradient-to-br from-gold-500 to-gold-700 p-1.5">
          <Package size={sizes[size].icon} className="text-white" strokeWidth={2} />
        </div>
      </div>
      {showText && (
        <span
          className={cn(
            "font-bold tracking-tight",
            sizes[size].text,
            "gradient-text"
          )}
        >
          ModuleLib
        </span>
      )}
    </div>
  );
}
