import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { Pause, Play, Trash2 } from "lucide-react";
import { generateLog, seedLogs } from "@/lib/gateway-client";
import type { LogEntry } from "@/lib/gateway-types";
import { PageHeader } from "@/components/dashboard-ui";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/logs")({
  head: () => ({
    meta: [
      { title: "Live Logs · API Gateway" },
      { name: "description", content: "Streaming gateway access logs." },
    ],
  }),
  component: LogsPage,
});

const FILTERS = ["all", "info", "warn", "error"] as const;
type Filter = (typeof FILTERS)[number];

function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>(() => seedLogs(40));
  const [paused, setPaused] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (paused) return;
    const interval = setInterval(() => {
      const batch = Math.random() > 0.6 ? 2 : 1;
      setLogs((prev) => {
        const next = [...Array.from({ length: batch }, () => generateLog()), ...prev];
        return next.slice(0, 250);
      });
    }, 700);
    return () => clearInterval(interval);
  }, [paused]);

  const filtered = useMemo(() => {
    return logs.filter((l) => {
      if (filter !== "all" && l.level !== filter) return false;
      if (query && !`${l.path} ${l.clientIp} ${l.upstream}`.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [logs, filter, query]);

  return (
    <div className="px-6 py-6 flex flex-col gap-4 h-screen">
      <PageHeader
        title="Live logs"
        description="Streaming access log from every proxied request."
        actions={
          <div className="flex items-center gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="filter path, ip, upstream…"
              className="h-8 rounded-md border border-input bg-card px-2.5 text-xs font-mono-num w-64 outline-none focus:border-ring"
            />
            <div className="flex rounded-md border border-border overflow-hidden">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    "px-2.5 h-8 text-[11px] font-mono-num uppercase tracking-wider transition-colors",
                    filter === f ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
            <Button size="sm" variant="outline" className="h-8" onClick={() => setPaused((p) => !p)}>
              {paused ? <Play className="size-3.5" /> : <Pause className="size-3.5" />}
              {paused ? "Resume" : "Pause"}
            </Button>
            <Button size="sm" variant="ghost" className="h-8 text-muted-foreground" onClick={() => setLogs([])}>
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        }
      />

      <div
        ref={containerRef}
        className="flex-1 min-h-0 rounded-lg border bg-card overflow-auto font-mono-num text-xs"
      >
        <table className="w-full">
          <thead className="sticky top-0 bg-card border-b border-border z-10">
            <tr className="text-left text-[10px] uppercase tracking-wider text-muted-foreground">
              <th className="px-3 py-2 font-medium w-[88px]">Time</th>
              <th className="px-3 py-2 font-medium w-[56px]">Method</th>
              <th className="px-3 py-2 font-medium w-[56px] text-right">Status</th>
              <th className="px-3 py-2 font-medium">Path</th>
              <th className="px-3 py-2 font-medium w-[140px]">Upstream</th>
              <th className="px-3 py-2 font-medium w-[120px]">Client</th>
              <th className="px-3 py-2 font-medium w-[60px]">Cache</th>
              <th className="px-3 py-2 font-medium w-[64px] text-right">Time</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((l) => (
              <tr
                key={l.id}
                className={cn(
                  "border-b border-border/40 hover:bg-accent/40 transition-colors",
                  l.level === "error" && "bg-destructive/5",
                  l.level === "warn" && "bg-warning/5",
                )}
              >
                <td className="px-3 py-1.5 text-muted-foreground">{format(new Date(l.ts), "HH:mm:ss")}</td>
                <td className="px-3 py-1.5">
                  <span className={cn("px-1.5 py-0.5 rounded text-[10px]", methodColor(l.method))}>{l.method}</span>
                </td>
                <td className={cn("px-3 py-1.5 text-right", statusColor(l.status))}>{l.status}</td>
                <td className="px-3 py-1.5">{l.path}</td>
                <td className="px-3 py-1.5 text-muted-foreground">{l.upstream}</td>
                <td className="px-3 py-1.5 text-muted-foreground">{l.clientIp}</td>
                <td className="px-3 py-1.5">
                  <span className={cn(
                    "text-[10px] uppercase tracking-wider",
                    l.cache === "hit" ? "text-success" : l.cache === "miss" ? "text-warning" : "text-muted-foreground",
                  )}>{l.cache}</span>
                </td>
                <td className="px-3 py-1.5 text-right text-muted-foreground">{l.durationMs}ms</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="px-3 py-12 text-center text-muted-foreground">No matching logs</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function methodColor(m: LogEntry["method"]) {
  switch (m) {
    case "GET": return "bg-info/15 text-info";
    case "POST": return "bg-success/15 text-success";
    case "PUT":
    case "PATCH": return "bg-warning/15 text-warning";
    case "DELETE": return "bg-destructive/15 text-destructive";
    default: return "bg-muted text-muted-foreground";
  }
}

function statusColor(s: number) {
  if (s >= 500) return "text-destructive";
  if (s >= 400) return "text-warning";
  if (s >= 300) return "text-info";
  return "text-success";
}
