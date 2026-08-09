import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { getCircuits } from "@/lib/gateway-client";
import { PageHeader, StatusPill, formatNumber } from "@/components/dashboard-ui";

export const Route = createFileRoute("/circuits")({
  head: () => ({
    meta: [
      { title: "Circuits · API Gateway" },
      { name: "description", content: "Upstream circuit breaker states." },
    ],
  }),
  component: CircuitsPage,
});

function CircuitsPage() {
  const { data } = useQuery({ queryKey: ["circuits"], queryFn: getCircuits, refetchInterval: 5000 });

  return (
    <div className="px-6 py-6 flex flex-col gap-4">
      <PageHeader
        title="Circuit breakers"
        description="Opossum-protected upstream services. Open circuits short-circuit requests until recovery."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {data?.map((c) => {
          const stateMap = {
            closed: { pill: "ok" as const, label: "closed" },
            "half-open": { pill: "warn" as const, label: "half-open" },
            open: { pill: "danger" as const, label: "open" },
          }[c.state];
          return (
            <div key={c.service} className="rounded-lg border bg-card p-4 flex flex-col gap-3 relative overflow-hidden">
              {c.state !== "closed" && (
                <div
                  className="absolute inset-x-0 top-0 h-px"
                  style={{
                    background:
                      c.state === "open"
                        ? "var(--color-destructive)"
                        : "var(--color-warning)",
                  }}
                />
              )}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-medium text-sm">{c.service}</div>
                  <div className="font-mono-num text-[11px] text-muted-foreground">{c.upstream}</div>
                </div>
                <StatusPill state={stateMap.pill} label={stateMap.label} />
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs pt-1">
                <div>
                  <div className="text-muted-foreground text-[10px] uppercase tracking-wider">Calls</div>
                  <div className="font-mono-num">{formatNumber(c.totalCalls)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-[10px] uppercase tracking-wider">Errors</div>
                  <div
                    className={
                      "font-mono-num " +
                      (c.errorRate > 0.1
                        ? "text-destructive"
                        : c.errorRate > 0.02
                        ? "text-warning"
                        : "text-foreground")
                    }
                  >
                    {(c.errorRate * 100).toFixed(2)}%
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground text-[10px] uppercase tracking-wider">Rejected</div>
                  <div className="font-mono-num">{formatNumber(c.rejections)}</div>
                </div>
              </div>

              <div className="text-[11px] text-muted-foreground border-t border-border pt-2">
                {c.openedAt
                  ? `Opened ${formatDistanceToNow(new Date(c.openedAt), { addSuffix: true })}`
                  : "No incidents in last 24h"}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
