# API Gateway Console

<p align="center">
  <strong>A high-signal operations dashboard for modern API gateways.</strong><br />
  Built as a plain Vite + React SPA with a clean dark observability UI.
</p>

---

## Why this project exists

This app is an **operator-facing control plane UI** for an API Gateway.  
It gives you one place to watch traffic, inspect health, and perform day-to-day gateway actions:

- Track request volume, latency, and error trends
- Manage routes and toggle them on/off
- Create and revoke API keys
- Monitor live throttling activity
- Observe circuit breaker state
- Tail synthetic live access logs

> Today, the dashboard runs on a deterministic in-memory/mock client (`src/lib/gateway-client.ts`) so the UI can be developed without backend coupling.  
> Swapping to real APIs is intentionally straightforward.

---

## Stack at a glance

| Layer         | Technology                                                   |
| ------------- | ------------------------------------------------------------ |
| App framework | **Vite** + **React 19**                                      |
| Routing       | **React Router**                                             |
| UI            | **React 19** + **Tailwind CSS v4** + shadcn/Radix primitives |
| Charts        | **Recharts**                                                 |
| Tooling       | **TypeScript**, **ESLint**, **Prettier**                     |
| Typography    | Inter Variable + JetBrains Mono                              |

---

## Product surfaces

| Route          | Purpose                                                               |
| -------------- | --------------------------------------------------------------------- |
| `/`            | Overview: live RPS, latency, error rate, status mix, top routes       |
| `/routes`      | Route inventory + auth mode + role visibility + enable/disable toggle |
| `/keys`        | API key lifecycle: create, reveal once, revoke                        |
| `/rate-limits` | Active Redis-backed throttling cards with countdowns                  |
| `/circuits`    | Circuit breaker state by upstream (`closed`, `half-open`, `open`)     |
| `/logs`        | Streaming log table with level/search filters, pause/resume, clear    |

---

## Getting started

```bash
npm install
npm run dev
```

Open the app at `http://localhost:3000` (or the Vite-assigned port shown in terminal).

### Available scripts

| Command             | What it does                    |
| ------------------- | ------------------------------- |
| `npm run dev`       | Start local dev server          |
| `npm run build`     | Production build                |
| `npm run build:dev` | Build with development mode     |
| `npm run preview`   | Preview built output            |
| `npm run lint`      | Lint TypeScript/TSX sources     |
| `npm run format`    | Format repository with Prettier |

---

## Project structure

```txt
src/
  App.tsx                    # app layout + route table
  main.tsx                   # SPA entrypoint
  components/
    app-sidebar.tsx          # left nav + environment/health indicators
    dashboard-ui.tsx         # reusable stat/header/status primitives
    ui/                      # shadcn/Radix component set
  hooks/
    use-mobile.tsx
  lib/
    gateway-client.ts        # mock gateway data + mutations + live log generator
    gateway-types.ts         # shared domain types
  routes/
    index.tsx                # overview dashboard
    routes.tsx               # route management
    keys.tsx                 # API key management
    rate-limits.tsx
    circuits.tsx
    logs.tsx
  style.css                  # Tailwind v4 theme tokens + utilities
```

---

## Design language

This console uses a **purpose-built dark operator theme** (OKLCH tokens), semantic status colors, pulse indicators, mono numeric styling, and dense information cards/tables intended for production support workflows.

---

## Wiring to a real gateway backend

You can keep all route/component contracts stable and only replace internals of:

- `src/lib/gateway-client.ts` (data access + mutations)
- optionally add auth/session handling around request calls

As long as responses continue to satisfy `src/lib/gateway-types.ts`, the UI surfaces should work unchanged.

---

## Vercel deployment (SPA)

This repo is configured for Vercel static deployment:

- `vercel.json` rewrites all paths to `/index.html`
- Vercel runs `npm run build`
- Output directory is `dist/`

That means deep links like `/routes` and `/logs` resolve correctly in production.

---

## Notes

- This repository currently includes `dist/` output and `node_modules/` in-tree; treat generated files as build artifacts.
