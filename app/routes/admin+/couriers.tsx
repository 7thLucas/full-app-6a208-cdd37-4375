import { useEffect, useState } from "react";
import {
  ShieldCheck,
  ShieldX,
  ShieldAlert,
  Star,
  Power,
  Truck,
  Loader2,
  Users,
} from "lucide-react";
import { RoleGate } from "~/components/delivery/guards";
import { AppShell } from "~/components/delivery/app-shell";
import { adminNav } from "~/components/delivery/nav-configs";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { deliveryApi } from "~/lib/delivery/delivery.api";
import { formatMoney } from "~/lib/delivery/delivery.shared";
import { useBrand } from "~/components/delivery/brand";
import { cn } from "~/lib/utils";
import { SkeletonList, EmptyState } from "../app+/_index";

export default function AdminCouriers() {
  return (
    <RoleGate allow={["admin"]}>
      <AppShell nav={adminNav} title="Couriers">
        <CouriersContent />
      </AppShell>
    </RoleGate>
  );
}

function CouriersContent() {
  const { currencySymbol } = useBrand();
  const [couriers, setCouriers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "verified" | "rejected">("all");
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    const res = await deliveryApi.adminCouriers();
    if (res.success) setCouriers(res.data as any[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const setStatus = async (userId: string, status: "verified" | "rejected" | "pending") => {
    setBusy(userId);
    await deliveryApi.verifyCourier(userId, status);
    await load();
    setBusy(null);
  };

  const shown = couriers.filter((c) => filter === "all" || c.verification_status === filter);
  const counts = {
    pending: couriers.filter((c) => c.verification_status === "pending").length,
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-1 rounded-xl bg-muted p-1">
        {(["all", "pending", "verified", "rejected"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "flex-1 rounded-lg py-2 text-xs font-bold capitalize transition-colors",
              filter === f ? "bg-card text-foreground shadow-sm" : "text-muted-foreground",
            )}
          >
            {f}
            {f === "pending" && counts.pending > 0 ? ` (${counts.pending})` : ""}
          </button>
        ))}
      </div>

      {loading ? (
        <SkeletonList />
      ) : shown.length === 0 ? (
        <EmptyState icon={<Users className="size-7" />} title="No couriers" sub="Couriers who register will appear here for verification." />
      ) : (
        <div className="space-y-3">
          {shown.map((c) => (
            <CourierRow
              key={c._id}
              c={c}
              currencySymbol={currencySymbol}
              busy={busy === c.user_id}
              onSetStatus={(s) => setStatus(c.user_id, s)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CourierRow({
  c,
  currencySymbol,
  busy,
  onSetStatus,
}: {
  c: any;
  currencySymbol: string;
  busy: boolean;
  onSetStatus: (s: "verified" | "rejected" | "pending") => void;
}) {
  const status = c.verification_status ?? "pending";
  const statusMeta: Record<string, { icon: React.ReactNode; variant: any; label: string }> = {
    verified: { icon: <ShieldCheck className="size-3.5" />, variant: "success", label: "Verified" },
    pending: { icon: <ShieldAlert className="size-3.5" />, variant: "accent", label: "Pending" },
    rejected: { icon: <ShieldX className="size-3.5" />, variant: "destructive", label: "Rejected" },
  };
  const meta = statusMeta[status] ?? statusMeta.pending;

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-bold text-foreground">{c.full_name || c.user?.username || "Courier"}</p>
          <p className="text-xs text-muted-foreground">{c.user?.email}</p>
        </div>
        <Badge variant={meta.variant} className="gap-1">
          {meta.icon} {meta.label}
        </Badge>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
        <Metric icon={<Truck className="size-3.5" />} label={c.vehicle_type || "—"} sub={c.vehicle_plate || "no plate"} />
        <Metric
          icon={<Star className="size-3.5 text-accent-foreground" />}
          label={`${(c.rating_avg ?? 0).toFixed(1)}`}
          sub={`${c.rating_count ?? 0} reviews`}
        />
        <Metric
          icon={<Power className={cn("size-3.5", c.is_online ? "text-secondary" : "text-muted-foreground")} />}
          label={c.is_online ? "Online" : "Offline"}
          sub={`${c.completed_deliveries ?? 0} done`}
        />
      </div>

      <p className="mt-2 text-xs text-muted-foreground">
        Lifetime earnings: <span className="font-bold text-foreground">{formatMoney(c.total_earnings ?? 0, currencySymbol)}</span>
      </p>

      <div className="mt-3 flex gap-2">
        {status !== "verified" && (
          <Button size="sm" className="flex-1 gap-1.5" onClick={() => onSetStatus("verified")} disabled={busy}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />} Verify
          </Button>
        )}
        {status !== "rejected" && (
          <Button
            size="sm"
            variant="outline"
            className="flex-1 gap-1.5 border-destructive/40 text-destructive hover:bg-destructive/10"
            onClick={() => onSetStatus("rejected")}
            disabled={busy}
          >
            <ShieldX className="size-4" /> Reject
          </Button>
        )}
        {status !== "pending" && (
          <Button size="sm" variant="outline" className="flex-1" onClick={() => onSetStatus("pending")} disabled={busy}>
            Reset
          </Button>
        )}
      </div>
    </div>
  );
}

function Metric({ icon, label, sub }: { icon: React.ReactNode; label: string; sub: string }) {
  return (
    <div className="rounded-xl bg-muted/60 p-2 text-center">
      <span className="flex justify-center text-muted-foreground">{icon}</span>
      <p className="mt-0.5 font-bold text-foreground">{label}</p>
      <p className="text-[10px] text-muted-foreground">{sub}</p>
    </div>
  );
}
