import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Check, Copy, Plus, Trash2 } from "lucide-react";
import { createApiKey, getApiKeys, revokeApiKey } from "@/lib/gateway-client";
import { PageHeader, StatusPill, formatNumber } from "@/components/dashboard-ui";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";

export const Route = createFileRoute("/keys")({
  head: () => ({
    meta: [
      { title: "API Keys · API Gateway" },
      { name: "description", content: "Create, list, and revoke API keys." },
    ],
  }),
  component: KeysPage,
});

const SCOPE_OPTIONS = ["public:read", "user:read", "order:read", "order:write", "billing:read", "billing:write", "admin:*"];

function KeysPage() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["keys"], queryFn: getApiKeys });

  return (
    <div className="px-6 py-6 flex flex-col gap-4">
      <PageHeader
        title="API Keys"
        description="Service-to-service credentials. Keys are shown once on creation."
        actions={<CreateKeyDialog onCreated={() => qc.invalidateQueries({ queryKey: ["keys"] })} />}
      />

      <div className="rounded-lg border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 border-b border-border">
            <tr className="text-left text-[10px] uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-2.5 font-medium">Label</th>
              <th className="px-4 py-2.5 font-medium">Key</th>
              <th className="px-4 py-2.5 font-medium">Scopes</th>
              <th className="px-4 py-2.5 font-medium text-right">Reqs 24h</th>
              <th className="px-4 py-2.5 font-medium text-right">Rate / min</th>
              <th className="px-4 py-2.5 font-medium">Last used</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5 font-medium" />
            </tr>
          </thead>
          <tbody>
            {data?.map((k) => (
              <tr key={k.id} className="border-b border-border/60 last:border-0 hover:bg-accent/40 transition-colors">
                <td className="px-4 py-3">{k.label}</td>
                <td className="px-4 py-3 font-mono-num text-xs text-muted-foreground">{k.prefix}…••••••••</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {k.scopes.map((s) => (
                      <span key={s} className="font-mono-num text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                        {s}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-right font-mono-num">{formatNumber(k.requests24h)}</td>
                <td className="px-4 py-3 text-right font-mono-num text-muted-foreground">{formatNumber(k.rateLimitPerMin)}</td>
                <td className="px-4 py-3 font-mono-num text-xs text-muted-foreground">
                  {k.lastUsedAt ? format(new Date(k.lastUsedAt), "MMM d HH:mm") : "never"}
                </td>
                <td className="px-4 py-3">
                  <StatusPill state={k.revoked ? "danger" : "ok"} label={k.revoked ? "revoked" : "active"} />
                </td>
                <td className="px-4 py-3 text-right">
                  {!k.revoked && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs text-muted-foreground hover:text-destructive"
                      onClick={async () => {
                        await revokeApiKey(k.id);
                        qc.invalidateQueries({ queryKey: ["keys"] });
                      }}
                    >
                      <Trash2 className="size-3.5" />
                      Revoke
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CreateKeyDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [rate, setRate] = useState("600");
  const [scopes, setScopes] = useState<string[]>(["public:read"]);
  const [secret, setSecret] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const reset = () => {
    setLabel("");
    setRate("600");
    setScopes(["public:read"]);
    setSecret(null);
    setCopied(false);
  };

  async function submit() {
    if (!label.trim()) return;
    const { secret } = await createApiKey({
      label: label.trim(),
      scopes,
      rateLimitPerMin: parseInt(rate, 10) || 60,
    });
    setSecret(secret);
    onCreated();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-8 gap-1.5">
          <Plus className="size-3.5" /> New key
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        {!secret ? (
          <>
            <DialogHeader>
              <DialogTitle>Create API key</DialogTitle>
              <DialogDescription>The secret will be shown once. Store it somewhere safe.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="label">Label</Label>
                <Input id="label" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. orders-sync-bot" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rate">Rate limit (req/min)</Label>
                <Input id="rate" type="number" value={rate} onChange={(e) => setRate(e.target.value)} className="font-mono-num" />
              </div>
              <div className="space-y-1.5">
                <Label>Scopes</Label>
                <div className="flex flex-wrap gap-1.5">
                  {SCOPE_OPTIONS.map((s) => {
                    const active = scopes.includes(s);
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setScopes((prev) => active ? prev.filter((p) => p !== s) : [...prev, s])}
                        className={
                          "font-mono-num text-[11px] px-2 py-1 rounded border transition-colors " +
                          (active
                            ? "bg-primary/15 border-primary/40 text-primary"
                            : "bg-muted border-border text-muted-foreground hover:text-foreground")
                        }
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={submit} disabled={!label.trim()}>Create</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Key created</DialogTitle>
              <DialogDescription>Copy this secret now — you won't see it again.</DialogDescription>
            </DialogHeader>
            <div className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-2.5">
              <code className="font-mono-num text-xs flex-1 break-all">{secret}</code>
              <Button
                size="sm"
                variant="ghost"
                className="h-7"
                onClick={() => { navigator.clipboard.writeText(secret); setCopied(true); }}
              >
                {copied ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
              </Button>
            </div>
            <DialogFooter>
              <Button onClick={() => setOpen(false)}>Done</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
