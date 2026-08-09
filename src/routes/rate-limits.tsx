import { useEffect, useState } from "react";
import { getRateLimited } from "@/lib/gateway-client";
import { PageHeader } from "@/components/dashboard-ui";

export default function RateLimitsPage() {
  const [data, setData] = useState<Awaited<ReturnType<typeof getRateLimited>>>([]);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    document.title = "Rate Limits · API Gateway";
  }, []);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const rows = await getRateLimited();
      if (!cancelled) setData(rows);
    };
    run();
    const timer = setInterval(run, 4000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, []);

  return (
    <div className="px-6 py-6 flex flex-col gap-4">
      <PageHeader
        title="Rate limits"
        description="Redis-backed limiter — current throttled clients across all routes."
        actions={
          <span className="text-[11px] font-mono-num text-muted-foreground uppercase tracking-wider">
            {data?.length ?? 0} active blocks
          </span>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {data?.map((c) => {
          const remain = Math.max(0, Math.round((new Date(c.blockedUntil).getTime() - now) / 1000));
          return (
            <div key={c.id} className="rounded-lg border bg-card p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                  {c.kind === "ip" ? "IP address" : "API key"}
                </span>
                <span className="font-mono-num text-[10px] px-1.5 py-0.5 rounded bg-destructive/10 text-destructive border border-destructive/30 uppercase tracking-wider">
                  throttled
                </span>
              </div>
              <div className="font-mono-num text-sm break-all">{c.identifier}</div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <div className="text-muted-foreground text-[10px] uppercase tracking-wider">
                    Hits
                  </div>
                  <div className="font-mono-num">{c.hits}</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-[10px] uppercase tracking-wider">
                    Window
                  </div>
                  <div className="font-mono-num">{c.windowSec}s</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-[10px] uppercase tracking-wider">
                    Resets in
                  </div>
                  <div className="font-mono-num text-warning">{remain}s</div>
                </div>
              </div>
              <div className="text-xs text-muted-foreground border-t border-border pt-2">
                On <span className="font-mono-num text-foreground">{c.route}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
