// Shared types for the gateway dashboard. When wiring to the real gateway,
// keep these shapes and only swap the implementation in `gateway-client.ts`.

export type AuthType = "jwt" | "apikey" | "any" | "none";
export type CircuitState = "closed" | "open" | "half-open";
export type LogLevel = "info" | "warn" | "error";
export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface OverviewMetrics {
  rps: number;
  rpsDelta: number; // % vs previous window
  p50: number; // ms
  p95: number; // ms
  p99: number; // ms
  errorRate: number; // 0..1
  errorRateDelta: number;
  cacheHitRate: number; // 0..1
  totalRequests24h: number;
  activeKeys: number;
  rateLimited24h: number;
}

export interface TimeseriesPoint {
  t: string; // ISO
  requests: number;
  errors: number;
  p95: number;
}

export interface StatusMix {
  code: string; // "2xx" | "3xx" | "4xx" | "5xx"
  count: number;
}

export interface TopRoute {
  path: string;
  requests: number;
  errorRate: number;
  p95: number;
}

export interface GatewayRoute {
  id: string;
  path: string;
  upstream: string;
  authType: AuthType;
  roles: string[];
  enabled: boolean;
  requests24h: number;
  errorRate: number;
  p95: number;
}

export interface ApiKey {
  id: string;
  label: string;
  prefix: string; // first 8 chars, rest masked
  scopes: string[];
  createdAt: string;
  lastUsedAt: string | null;
  requests24h: number;
  rateLimitPerMin: number;
  revoked: boolean;
}

export interface RateLimitedClient {
  id: string;
  kind: "ip" | "key";
  identifier: string;
  hits: number;
  windowSec: number;
  blockedUntil: string;
  route: string;
}

export interface Circuit {
  service: string;
  upstream: string;
  state: CircuitState;
  errorRate: number;
  openedAt: string | null;
  totalCalls: number;
  rejections: number;
}

export interface LogEntry {
  id: string;
  ts: string;
  level: LogLevel;
  method: HttpMethod;
  path: string;
  status: number;
  durationMs: number;
  clientIp: string;
  upstream: string;
  auth: AuthType;
  cache: "hit" | "miss" | "bypass";
}
