import { Construction } from "lucide-react";

export function PlaceholderPage({ title }) {
  return (
    <div className="flex flex-col items-center justify-center gap-5 py-24 animate-fade-in">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-card">
        <Construction size={28} className="text-gold-300" />
      </div>
      <div className="text-center">
        <h2 className="text-xl font-bold text-foreground">{title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This section is under active development and will be available in the next sprint.
        </p>
      </div>
      <div className="flex items-center gap-2 rounded-full border border-gold-500/20 bg-gold-500/5 px-4 py-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-gold-300 animate-pulse" />
        <span className="text-xs font-medium text-gold-300">In progress</span>
      </div>
    </div>
  );
}
