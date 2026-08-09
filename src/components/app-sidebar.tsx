import { Link, useLocation } from "react-router-dom";
import { Activity, KeyRound, Network, ScrollText, ShieldAlert, Waves } from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = { to: string; label: string; icon: typeof Activity; exact?: boolean };
const NAV: NavItem[] = [
  { to: "/", label: "Overview", icon: Activity, exact: true },
  { to: "/routes", label: "Routes", icon: Network },
  { to: "/keys", label: "API Keys", icon: KeyRound },
  { to: "/rate-limits", label: "Rate Limits", icon: ShieldAlert },
  { to: "/circuits", label: "Circuits", icon: Waves },
  { to: "/logs", label: "Live Logs", icon: ScrollText },
];

export function AppSidebar() {
  const { pathname } = useLocation();

  return (
    <aside className="w-60 shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground flex flex-col">
      <div className="h-14 flex items-center gap-2.5 px-4 border-b border-sidebar-border">
        <div className="relative">
          <div className="size-7 rounded-md bg-primary/15 border border-primary/30 grid place-items-center">
            <span className="font-mono-num text-[11px] text-primary font-bold">GW</span>
          </div>
          <span className="status-dot pulse-ring absolute -top-0.5 -right-0.5 bg-primary text-primary" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold tracking-tight">api-gateway</span>
          <span className="font-mono-num text-[10px] text-muted-foreground">v1.0.0 · prod</span>
        </div>
      </div>

      <nav className="flex-1 p-2 space-y-0.5">
        <div className="px-2 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground/70 font-medium">
          Operations
        </div>
        {NAV.map((item) => {
          const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "group flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors",
                "hover:bg-sidebar-accent",
                active && "bg-sidebar-accent text-sidebar-accent-foreground",
              )}
            >
              <Icon
                className={cn(
                  "size-4 text-muted-foreground group-hover:text-foreground transition-colors",
                  active && "text-primary",
                )}
              />
              <span>{item.label}</span>
              {active && <span className="ml-auto size-1.5 rounded-full bg-primary" />}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-sidebar-border space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Redis</span>
          <span className="flex items-center gap-1.5">
            <span className="status-dot bg-success" />
            <span className="font-mono-num">connected</span>
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Postgres</span>
          <span className="flex items-center gap-1.5">
            <span className="status-dot bg-success" />
            <span className="font-mono-num">connected</span>
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Uptime</span>
          <span className="font-mono-num text-foreground">14d 3h</span>
        </div>
      </div>
    </aside>
  );
}
