import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-4">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  unit,
  delta,
  hint,
  tone = "default",
}: {
  label: string;
  value: string | number;
  unit?: string;
  delta?: number;
  hint?: string;
  tone?: "default" | "success" | "warning" | "danger";
}) {
  const toneRing = {
    default: "border-border",
    success: "border-success/30",
    warning: "border-warning/30",
    danger: "border-destructive/30",
  }[tone];
  return (
    <div className={cn("rounded-lg border bg-card p-4 flex flex-col gap-2", toneRing)}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
          {label}
        </span>
        {typeof delta === "number" && (
          <span
            className={cn(
              "font-mono-num text-[11px] px-1.5 py-0.5 rounded",
              delta >= 0
                ? "text-success bg-success/10"
                : "text-destructive bg-destructive/10",
            )}
          >
            {delta >= 0 ? "+" : ""}
            {delta.toFixed(1)}%
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="font-mono-num text-2xl font-semibold tracking-tight">
          {value}
        </span>
        {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
      </div>
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </div>
  );
}

export function StatusPill({
  state,
  label,
}: {
  state: "ok" | "warn" | "danger" | "muted";
  label: string;
}) {
  const map = {
    ok: "bg-success/10 text-success border-success/30",
    warn: "bg-warning/10 text-warning border-warning/30",
    danger: "bg-destructive/10 text-destructive border-destructive/30",
    muted: "bg-muted text-muted-foreground border-border",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded border font-mono-num text-[11px] uppercase tracking-wider",
        map[state],
      )}
    >
      <span
        className={cn("status-dot", {
          "bg-success": state === "ok",
          "bg-warning": state === "warn",
          "bg-destructive": state === "danger",
          "bg-muted-foreground": state === "muted",
        })}
      />
      {label}
    </span>
  );
}

export function formatNumber(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "k";
  return n.toString();
}
