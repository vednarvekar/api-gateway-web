import { useEffect, useState } from "react";
import { getRoutes, toggleRoute } from "@/lib/gateway-client";
import { PageHeader, StatusPill, formatNumber } from "@/components/dashboard-ui";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import type { AuthType } from "@/lib/gateway-types";

const AUTH_LABEL: Record<AuthType, string> = {
  jwt: "JWT",
  apikey: "API key",
  any: "JWT / Key",
  none: "Public",
};

export default function RoutesPage() {
  const [data, setData] = useState<Awaited<ReturnType<typeof getRoutes>>>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    document.title = "Routes · API Gateway";
  }, []);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const rows = await getRoutes();
      if (!cancelled) {
        setData(rows);
        setIsLoading(false);
      }
    };
    run();
    const timer = setInterval(run, 30_000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  async function refreshRoutes() {
    const rows = await getRoutes();
    setData(rows);
    setIsLoading(false);
  }

  return (
    <div className="px-6 py-6 flex flex-col gap-4">
      <PageHeader
        title="Routes"
        description="Routes are loaded from PostgreSQL and refreshed every 30s. Toggle enables/disables the proxy."
        actions={
          <span className="text-[11px] font-mono-num text-muted-foreground uppercase tracking-wider">
            {data?.length ?? 0} routes
          </span>
        }
      />

      <div className="rounded-lg border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 border-b border-border">
            <tr className="text-left text-[10px] uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-2.5 font-medium">Path</th>
              <th className="px-4 py-2.5 font-medium">Upstream</th>
              <th className="px-4 py-2.5 font-medium">Auth</th>
              <th className="px-4 py-2.5 font-medium">Roles</th>
              <th className="px-4 py-2.5 font-medium text-right">Reqs 24h</th>
              <th className="px-4 py-2.5 font-medium text-right">Err %</th>
              <th className="px-4 py-2.5 font-medium text-right">p95</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5 font-medium text-right">Enabled</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground text-xs">
                  Loading routes…
                </td>
              </tr>
            )}
            {data?.map((r) => (
              <tr
                key={r.id}
                className="border-b border-border/60 last:border-0 hover:bg-accent/40 transition-colors"
              >
                <td className="px-4 py-3 font-mono-num text-foreground">{r.path}/*</td>
                <td className="px-4 py-3 font-mono-num text-muted-foreground text-xs">
                  {r.upstream}
                </td>
                <td className="px-4 py-3">
                  <Badge
                    variant="outline"
                    className="font-mono-num text-[10px] uppercase tracking-wider"
                  >
                    {AUTH_LABEL[r.authType]}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {r.roles.length === 0 && (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                    {r.roles.map((role) => (
                      <span
                        key={role}
                        className="font-mono-num text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border"
                      >
                        {role}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-right font-mono-num">
                  {formatNumber(r.requests24h)}
                </td>
                <td className="px-4 py-3 text-right font-mono-num">
                  <span
                    className={
                      r.errorRate > 0.03
                        ? "text-destructive"
                        : r.errorRate > 0.01
                          ? "text-warning"
                          : "text-muted-foreground"
                    }
                  >
                    {(r.errorRate * 100).toFixed(2)}%
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-mono-num text-muted-foreground">
                  {r.p95}ms
                </td>
                <td className="px-4 py-3">
                  <StatusPill
                    state={!r.enabled ? "muted" : r.errorRate > 0.05 ? "danger" : "ok"}
                    label={!r.enabled ? "disabled" : r.errorRate > 0.05 ? "degraded" : "healthy"}
                  />
                </td>
                <td className="px-4 py-3 text-right">
                  <Switch
                    checked={r.enabled}
                    onCheckedChange={async (v) => {
                      await toggleRoute(r.id, v);
                      await refreshRoutes();
                    }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
