import { cn } from "../../lib/utils";

export function Table({ children, className }) {
  return (
    <div className="w-full overflow-x-auto">
      <table className={cn("w-full text-sm", className)}>{children}</table>
    </div>
  );
}

export function TableHeader({ children, className }) {
  return <thead className={cn("", className)}>{children}</thead>;
}

export function TableBody({ children, className }) {
  return (
    <tbody className={cn("divide-y divide-border", className)}>
      {children}
    </tbody>
  );
}

export function TableRow({ children, className, ...props }) {
  return (
    <tr
      className={cn(
        "transition-colors hover:bg-white/[0.02]",
        className
      )}
      {...props}
    >
      {children}
    </tr>
  );
}

export function TableHead({ children, className }) {
  return (
    <th
      className={cn(
        "px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70",
        className
      )}
    >
      {children}
    </th>
  );
}

export function TableCell({ children, className }) {
  return (
    <td className={cn("px-4 py-3", className)}>
      {children}
    </td>
  );
}
