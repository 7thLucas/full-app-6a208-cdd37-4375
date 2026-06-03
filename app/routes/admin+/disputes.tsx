import { useEffect, useState } from "react";
import { Link } from "react-router";
import { AlertTriangle, CheckCircle2, Loader2, ExternalLink } from "lucide-react";
import { RoleGate } from "~/components/delivery/guards";
import { AppShell } from "~/components/delivery/app-shell";
import { adminNav } from "~/components/delivery/nav-configs";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { deliveryApi } from "~/lib/delivery/delivery.api";
import { cn } from "~/lib/utils";
import { SkeletonList, EmptyState } from "../app+/_index";

export default function AdminDisputes() {
  return (
    <RoleGate allow={["admin"]}>
      <AppShell nav={adminNav} title="Disputes">
        <DisputesContent />
      </AppShell>
    </RoleGate>
  );
}

function DisputesContent() {
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"open" | "resolved" | "all">("open");

  const load = async () => {
    const res = await deliveryApi.adminDisputes();
    if (res.success) setDisputes(res.data as any[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const shown = disputes.filter((d) => filter === "all" || d.status === filter);
  const openCount = disputes.filter((d) => d.status === "open").length;

  return (
    <div className="space-y-4">
      <div className="flex gap-1 rounded-xl bg-muted p-1">
        {(["open", "resolved", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "flex-1 rounded-lg py-2 text-xs font-bold capitalize transition-colors",
              filter === f ? "bg-card text-foreground shadow-sm" : "text-muted-foreground",
            )}
          >
            {f}
            {f === "open" && openCount > 0 ? ` (${openCount})` : ""}
          </button>
        ))}
      </div>

      {loading ? (
        <SkeletonList />
      ) : shown.length === 0 ? (
        <EmptyState
          icon={<AlertTriangle className="size-7" />}
          title={filter === "open" ? "No open disputes" : "No disputes"}
          sub="Disputes raised by customers or couriers will appear here for review."
        />
      ) : (
        <div className="space-y-3">
          {shown.map((d) => (
            <DisputeCard key={d._id} d={d} onResolved={load} />
          ))}
        </div>
      )}
    </div>
  );
}

function DisputeCard({ d, onResolved }: { d: any; onResolved: () => void }) {
  const [resolution, setResolution] = useState("");
  const [busy, setBusy] = useState(false);
  const open = d.status === "open";

  const resolve = async () => {
    setBusy(true);
    await deliveryApi.resolveDispute(d._id, resolution.trim());
    setBusy(false);
    onResolved();
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <Badge variant={open ? "destructive" : "success"} className="gap-1">
          {open ? <AlertTriangle className="size-3.5" /> : <CheckCircle2 className="size-3.5" />}
          {open ? "Open" : "Resolved"}
        </Badge>
        <span className="text-xs capitalize text-muted-foreground">Raised by {d.raised_by_role}</span>
      </div>

      <p className="mt-2 text-sm text-foreground">{d.reason}</p>

      <Link
        to={`/admin/deliveries`}
        className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
      >
        Delivery #{String(d.delivery_id).slice(-6)} <ExternalLink className="size-3" />
      </Link>

      {!open && d.resolution && (
        <div className="mt-3 rounded-xl bg-secondary/10 p-3 text-sm text-foreground">
          <p className="text-xs font-bold text-secondary">Resolution</p>
          <p className="mt-0.5 text-muted-foreground">{d.resolution}</p>
        </div>
      )}

      {open && (
        <div className="mt-3 space-y-2">
          <Textarea
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
            placeholder="Resolution notes (e.g. refund issued, courier warned)…"
            rows={2}
          />
          <Button className="w-full gap-1.5" onClick={resolve} disabled={busy || !resolution.trim()}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />} Mark resolved
          </Button>
        </div>
      )}
    </div>
  );
}
