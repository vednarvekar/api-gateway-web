import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format } from "date-fns";
import { getOverview, getStatusMix, getTimeseries, getTopRoutes } from "@/lib/gateway-client";
import { PageHeader, StatCard, formatNumber } from "@/components/dashboard-ui";

const STATUS_COLOR: Record<string, string> = {
  "2xx": "var(--color-chart-1)",
  "3xx": "var(--color-chart-2)",
  "4xx": "var(--color-chart-3)",
  "5xx": "var(--color-chart-4)",
};

export default function OverviewPage() {
  const [overview, setOverview] = useState<Awaited<ReturnType<typeof getOverview>>>();
  const [series, setSeries] = useState<Awaited<ReturnType<typeof getTimeseries>>>([]);
  const [mix, setMix] = useState<Awaited<ReturnType<typeof getStatusMix>>>([]);
  const [top, setTop] = useState<Awaited<ReturnType<typeof getTopRoutes>>>([]);

  useEffect(() => {
    document.title = "Overview · API Gateway";
  }, []);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const data = await getOverview();
      if (!cancelled) setOverview(data);
    };
    run();
    const timer = setInterval(run, 5000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const data = await getTimeseries(48);
      if (!cancelled) setSeries(data);
    };
    run();
    const timer = setInterval(run, 10_000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const [mixData, topData] = await Promise.all([getStatusMix(), getTopRoutes()]);
      if (!cancelled) {
        setMix(mixData);
        setTop(topData);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  const m = overview;

  return (
    <div className="flex flex-col">
      <div className="px-6 pt-6">
        <PageHeader
          title="Overview"
          description="Live gateway throughput, latency, and upstream health."
          actions={
            <div className="flex items-center gap-2 text-xs font-mono-num text-muted-foreground">
              <span className="status-dot pulse-ring bg-success text-success" />
              streaming · {format(new Date(), "HH:mm:ss")}
            </div>
          }
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 px-6 mt-4">
        <StatCard
          label="Requests / sec"
          value={m ? m.rps : "—"}
          unit="rps"
          delta={m?.rpsDelta}
          hint="rolling 1m"
          tone="success"
        />
        <StatCard
          label="p95 latency"
          value={m ? m.p95 : "—"}
          unit="ms"
          hint={m ? `p50 ${m.p50}ms · p99 ${m.p99}ms` : undefined}
        />
        <StatCard
          label="Error rate"
          value={m ? (m.errorRate * 100).toFixed(2) : "—"}
          unit="%"
          delta={m?.errorRateDelta}
          tone={m && m.errorRate > 0.05 ? "danger" : "default"}
        />
        <StatCard
          label="Cache hit rate"
          value={m ? Math.round(m.cacheHitRate * 100) : "—"}
          unit="%"
          hint="GET responses · 60s TTL"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 px-6 mt-3">
        <div className="lg:col-span-2 rounded-lg border bg-card">
          <ChartHeader title="Requests & errors" sub="last 24h · 30m buckets" />
          <div className="h-72 px-2 pb-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series}>
                <defs>
                  <linearGradient id="gReq" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gErr" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-chart-4)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="var(--color-chart-4)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  stroke="var(--color-border)"
                  strokeDasharray="2 4"
                  vertical={false}
                />
                <XAxis
                  dataKey="t"
                  tickFormatter={(v) => format(new Date(v), "HH:mm")}
                  stroke="var(--color-muted-foreground)"
                  tick={{ fontSize: 10, fontFamily: "var(--font-mono)" }}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={32}
                />
                <YAxis
                  stroke="var(--color-muted-foreground)"
                  tick={{ fontSize: 10, fontFamily: "var(--font-mono)" }}
                  tickLine={false}
                  axisLine={false}
                  width={36}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--color-border)" }} />
                <Area
                  type="monotone"
                  dataKey="requests"
                  stroke="var(--color-chart-1)"
                  strokeWidth={1.5}
                  fill="url(#gReq)"
                />
                <Area
                  type="monotone"
                  dataKey="errors"
                  stroke="var(--color-chart-4)"
                  strokeWidth={1.5}
                  fill="url(#gErr)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-lg border bg-card flex flex-col">
          <ChartHeader title="Status code mix" sub="last 24h" />
          <div className="flex-1 grid grid-cols-2 gap-3 p-4 items-center">
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie
                  data={mix.data ?? []}
                  dataKey="count"
                  nameKey="code"
                  innerRadius={42}
                  outerRadius={62}
                  paddingAngle={2}
                  stroke="var(--color-card)"
                  strokeWidth={2}
                >
                  {mix.map((d) => (
                    <Cell key={d.code} fill={STATUS_COLOR[d.code]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1.5">
              {mix.map((s) => (
                <div key={s.code} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2">
                    <span
                      className="size-2 rounded-sm"
                      style={{ background: STATUS_COLOR[s.code] }}
                    />
                    <span className="font-mono-num">{s.code}</span>
                  </span>
                  <span className="font-mono-num text-muted-foreground">
                    {formatNumber(s.count)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 px-6 mt-3 pb-6">
        <div className="rounded-lg border bg-card">
          <ChartHeader title="p95 latency" sub="last 24h · ms" />
          <div className="h-56 px-2 pb-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series}>
                <defs>
                  <linearGradient id="gLat" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-chart-2)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--color-chart-2)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  stroke="var(--color-border)"
                  strokeDasharray="2 4"
                  vertical={false}
                />
                <XAxis
                  dataKey="t"
                  tickFormatter={(v) => format(new Date(v), "HH:mm")}
                  stroke="var(--color-muted-foreground)"
                  tick={{ fontSize: 10, fontFamily: "var(--font-mono)" }}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={32}
                />
                <YAxis
                  stroke="var(--color-muted-foreground)"
                  tick={{ fontSize: 10, fontFamily: "var(--font-mono)" }}
                  tickLine={false}
                  axisLine={false}
                  width={36}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--color-border)" }} />
                <Area
                  type="monotone"
                  dataKey="p95"
                  stroke="var(--color-chart-2)"
                  strokeWidth={1.5}
                  fill="url(#gLat)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-2 rounded-lg border bg-card">
          <ChartHeader title="Top routes" sub="by requests · last 24h" />
          <div className="px-2 pb-3">
            <ResponsiveContainer width="100%" height={224}>
              <BarChart data={top} layout="vertical" margin={{ left: 16, right: 24 }}>
                <CartesianGrid
                  stroke="var(--color-border)"
                  strokeDasharray="2 4"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  stroke="var(--color-muted-foreground)"
                  tick={{ fontSize: 10, fontFamily: "var(--font-mono)" }}
                  tickFormatter={(v) => formatNumber(v as number)}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="path"
                  stroke="var(--color-muted-foreground)"
                  tick={{ fontSize: 11, fontFamily: "var(--font-mono)" }}
                  tickLine={false}
                  axisLine={false}
                  width={140}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--color-accent)" }} />
                <Bar dataKey="requests" fill="var(--color-chart-1)" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChartHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-border">
      <span className="text-sm font-medium">{title}</span>
      {sub && (
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono-num">
          {sub}
        </span>
      )}
    </div>
  );
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-border bg-popover/95 backdrop-blur px-2.5 py-1.5 shadow-lg text-xs">
      {label && (
        <div className="font-mono-num text-[10px] text-muted-foreground mb-1">
          {typeof label === "string" && label.includes("T")
            ? format(new Date(label), "MMM d · HH:mm")
            : label}
        </div>
      )}
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 font-mono-num">
          <span className="size-2 rounded-sm" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name}</span>
          <span className="ml-auto">{formatNumber(p.value)}</span>
        </div>
      ))}
    </div>
  );
}
