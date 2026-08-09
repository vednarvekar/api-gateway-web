// Mock gateway client. Replace internals with fetch() against your gateway later;
// the public function signatures should stay the same.
import type {
  ApiKey,
  Circuit,
  GatewayRoute,
  LogEntry,
  OverviewMetrics,
  RateLimitedClient,
  StatusMix,
  TimeseriesPoint,
  TopRoute,
} from "./gateway-types";

// ---------- deterministic RNG so re-renders don't flicker numbers wildly ----------
function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SEEDED_ROUTES: Omit<GatewayRoute, "requests24h" | "errorRate" | "p95">[] = [
  { id: "r_user", path: "/user", upstream: "http://localhost:4001", authType: "jwt", roles: ["admin", "user"], enabled: true },
  { id: "r_order", path: "/order", upstream: "http://localhost:4002", authType: "jwt", roles: ["admin", "user"], enabled: true },
  { id: "r_public", path: "/public", upstream: "http://localhost:4003", authType: "none", roles: [], enabled: true },
  { id: "r_admin", path: "/admin", upstream: "http://localhost:4005", authType: "jwt", roles: ["admin"], enabled: true },
  { id: "r_billing", path: "/billing", upstream: "http://localhost:4006", authType: "apikey", roles: ["service"], enabled: true },
  { id: "r_payments", path: "/payments", upstream: "http://localhost:4010", authType: "any", roles: ["admin", "user"], enabled: false },
];

export async function getOverview(): Promise<OverviewMetrics> {
  const r = mulberry32(7);
  return {
    rps: 142 + Math.floor(r() * 40),
    rpsDelta: 6.4,
    p50: 18,
    p95: 84,
    p99: 212,
    errorRate: 0.014,
    errorRateDelta: -0.3,
    cacheHitRate: 0.612,
    totalRequests24h: 11_482_330,
    activeKeys: 24,
    rateLimited24h: 318,
  };
}

export async function getTimeseries(points = 48): Promise<TimeseriesPoint[]> {
  const now = Date.now();
  const r = mulberry32(42);
  const out: TimeseriesPoint[] = [];
  for (let i = points - 1; i >= 0; i--) {
    const t = new Date(now - i * 30 * 60 * 1000).toISOString();
    const base = 140 + Math.sin(i / 4) * 40 + r() * 30;
    const requests = Math.max(20, Math.round(base));
    const errors = Math.max(0, Math.round(requests * (0.005 + r() * 0.02)));
    const p95 = Math.round(60 + Math.sin(i / 3) * 20 + r() * 30);
    out.push({ t, requests, errors, p95 });
  }
  return out;
}

export async function getStatusMix(): Promise<StatusMix[]> {
  return [
    { code: "2xx", count: 10_982_410 },
    { code: "3xx", count: 84_120 },
    { code: "4xx", count: 372_180 },
    { code: "5xx", count: 43_620 },
  ];
}

export async function getTopRoutes(): Promise<TopRoute[]> {
  return [
    { path: "/user/profile", requests: 3_412_120, errorRate: 0.004, p95: 62 },
    { path: "/order/list", requests: 2_188_402, errorRate: 0.011, p95: 110 },
    { path: "/billing/invoices", requests: 1_902_551, errorRate: 0.002, p95: 48 },
    { path: "/public/feed", requests: 1_440_980, errorRate: 0.0, p95: 22 },
    { path: "/admin/users", requests: 612_402, errorRate: 0.029, p95: 188 },
    { path: "/order/checkout", requests: 488_120, errorRate: 0.041, p95: 240 },
  ];
}

export async function getRoutes(): Promise<GatewayRoute[]> {
  const r = mulberry32(13);
  return SEEDED_ROUTES.map((s, i) => ({
    ...s,
    requests24h: Math.round(50_000 + r() * 3_000_000),
    errorRate: s.enabled ? Math.round(r() * 400) / 10000 : 0,
    p95: Math.round(40 + r() * 200),
  }));
}

export async function toggleRoute(id: string, enabled: boolean): Promise<void> {
  const idx = SEEDED_ROUTES.findIndex((s) => s.id === id);
  if (idx >= 0) (SEEDED_ROUTES[idx] as { enabled: boolean }).enabled = enabled;
}

let API_KEYS: ApiKey[] = [
  {
    id: "key_billing",
    label: "billing-service",
    prefix: "sk_live_b1l",
    scopes: ["billing:read", "billing:write"],
    createdAt: "2025-04-12T09:14:00Z",
    lastUsedAt: "2026-06-29T11:02:14Z",
    requests24h: 1_902_551,
    rateLimitPerMin: 5000,
    revoked: false,
  },
  {
    id: "key_orders_bot",
    label: "orders-sync-bot",
    prefix: "sk_live_ord",
    scopes: ["order:read"],
    createdAt: "2025-11-30T18:42:00Z",
    lastUsedAt: "2026-06-29T11:01:55Z",
    requests24h: 384_220,
    rateLimitPerMin: 1200,
    revoked: false,
  },
  {
    id: "key_partner_x",
    label: "partner-x-prod",
    prefix: "sk_live_pxr",
    scopes: ["public:read", "order:read"],
    createdAt: "2026-01-04T12:00:00Z",
    lastUsedAt: "2026-06-28T22:11:09Z",
    requests24h: 92_140,
    rateLimitPerMin: 600,
    revoked: false,
  },
  {
    id: "key_legacy",
    label: "legacy-importer",
    prefix: "sk_live_lgy",
    scopes: ["public:read"],
    createdAt: "2024-06-18T08:00:00Z",
    lastUsedAt: "2026-03-02T07:14:00Z",
    requests24h: 0,
    rateLimitPerMin: 60,
    revoked: true,
  },
];

export async function getApiKeys(): Promise<ApiKey[]> {
  return [...API_KEYS];
}

export async function createApiKey(input: {
  label: string;
  scopes: string[];
  rateLimitPerMin: number;
}): Promise<{ key: ApiKey; secret: string }> {
  const id = `key_${Math.random().toString(36).slice(2, 8)}`;
  const prefix = `sk_live_${Math.random().toString(36).slice(2, 5)}`;
  const secret = `${prefix}_${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
  const key: ApiKey = {
    id,
    label: input.label,
    prefix,
    scopes: input.scopes,
    createdAt: new Date().toISOString(),
    lastUsedAt: null,
    requests24h: 0,
    rateLimitPerMin: input.rateLimitPerMin,
    revoked: false,
  };
  API_KEYS = [key, ...API_KEYS];
  return { key, secret };
}

export async function revokeApiKey(id: string): Promise<void> {
  API_KEYS = API_KEYS.map((k) => (k.id === id ? { ...k, revoked: true } : k));
}

export async function getRateLimited(): Promise<RateLimitedClient[]> {
  return [
    { id: "rl1", kind: "ip", identifier: "203.0.113.42", hits: 1284, windowSec: 60, blockedUntil: new Date(Date.now() + 42_000).toISOString(), route: "/user/profile" },
    { id: "rl2", kind: "key", identifier: "sk_live_pxr…", hits: 612, windowSec: 60, blockedUntil: new Date(Date.now() + 120_000).toISOString(), route: "/order/list" },
    { id: "rl3", kind: "ip", identifier: "198.51.100.7", hits: 488, windowSec: 60, blockedUntil: new Date(Date.now() + 18_000).toISOString(), route: "/public/feed" },
    { id: "rl4", kind: "ip", identifier: "192.0.2.221", hits: 322, windowSec: 60, blockedUntil: new Date(Date.now() + 8_000).toISOString(), route: "/admin/users" },
  ];
}

export async function getCircuits(): Promise<Circuit[]> {
  return [
    { service: "user-service", upstream: "http://localhost:4001", state: "closed", errorRate: 0.004, openedAt: null, totalCalls: 3_412_120, rejections: 0 },
    { service: "order-service", upstream: "http://localhost:4002", state: "closed", errorRate: 0.011, openedAt: null, totalCalls: 2_188_402, rejections: 12 },
    { service: "public-service", upstream: "http://localhost:4003", state: "closed", errorRate: 0.0, openedAt: null, totalCalls: 1_440_980, rejections: 0 },
    { service: "admin-service", upstream: "http://localhost:4005", state: "half-open", errorRate: 0.071, openedAt: new Date(Date.now() - 90_000).toISOString(), totalCalls: 612_402, rejections: 184 },
    { service: "billing-service", upstream: "http://localhost:4006", state: "closed", errorRate: 0.002, openedAt: null, totalCalls: 1_902_551, rejections: 0 },
    { service: "payments-service", upstream: "http://localhost:4010", state: "open", errorRate: 0.612, openedAt: new Date(Date.now() - 12 * 60_000).toISOString(), totalCalls: 14_200, rejections: 8_720 },
  ];
}

// ---------- live logs (synthetic stream) ----------
const PATHS: Array<{ path: string; upstream: string; auth: LogEntry["auth"] }> = [
  { path: "/user/profile", upstream: "user-service", auth: "jwt" },
  { path: "/user/settings", upstream: "user-service", auth: "jwt" },
  { path: "/order/list", upstream: "order-service", auth: "jwt" },
  { path: "/order/checkout", upstream: "order-service", auth: "jwt" },
  { path: "/billing/invoices", upstream: "billing-service", auth: "apikey" },
  { path: "/public/feed", upstream: "public-service", auth: "none" },
  { path: "/admin/users", upstream: "admin-service", auth: "jwt" },
  { path: "/payments/charge", upstream: "payments-service", auth: "any" },
];
const METHODS: LogEntry["method"][] = ["GET", "GET", "GET", "POST", "POST", "PUT", "DELETE"];
const IPS = ["203.0.113.42", "198.51.100.7", "192.0.2.221", "10.0.4.18", "10.0.7.92", "172.16.3.55"];

let logCounter = 0;
export function generateLog(): LogEntry {
  const p = PATHS[Math.floor(Math.random() * PATHS.length)];
  const method = METHODS[Math.floor(Math.random() * METHODS.length)];
  const roll = Math.random();
  let status = 200;
  if (p.upstream === "payments-service" && roll > 0.4) status = 503;
  else if (roll > 0.97) status = 500;
  else if (roll > 0.94) status = 429;
  else if (roll > 0.9) status = 404;
  else if (roll > 0.86) status = 401;
  const level: LogEntry["level"] = status >= 500 ? "error" : status >= 400 ? "warn" : "info";
  const cache = method === "GET" && Math.random() > 0.45 ? "hit" : method === "GET" ? "miss" : "bypass";
  return {
    id: `log_${Date.now()}_${logCounter++}`,
    ts: new Date().toISOString(),
    level,
    method,
    path: p.path,
    status,
    durationMs: Math.round(8 + Math.random() * (status >= 500 ? 600 : 180)),
    clientIp: IPS[Math.floor(Math.random() * IPS.length)],
    upstream: p.upstream,
    auth: p.auth,
    cache,
  };
}

export function seedLogs(n = 30): LogEntry[] {
  return Array.from({ length: n }, () => generateLog()).reverse();
}
