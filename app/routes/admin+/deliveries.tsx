import { useEffect, useState } from "react";
import { Truck, MapPin, Flag, User, PackageSearch } from "lucide-react";
import { RoleGate } from "~/components/delivery/guards";
import { AppShell } from "~/components/delivery/app-shell";
import { adminNav } from "~/components/delivery/nav-configs";
import { StatusPill } from "~/components/delivery/status-pill";
import { LiveMap } from "~/components/delivery/live-map";
import { useBrand } from "~/components/delivery/brand";
import { deliveryApi } from "~/lib/delivery/delivery.api";
import { formatMoney, isActiveStatus, type DeliveryStatus } from "~/lib/delivery/delivery.shared";
import { cn } from "~/lib/utils";
import { SkeletonList, EmptyState } from "../app+/_index";

export default function AdminDeliveries() {
  return (
    <RoleGate allow={["admin"]}>
      <AppShell nav={adminNav} title="Live deliveries">
        <DeliveriesContent />
      </AppShell>
    </RoleGate>
  );
}

function DeliveriesContent() {
  const { currencySymbol } = useBrand();
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"active" | "all">("active");

  useEffect(() => {
    let live = true;
    const load = async () => {
      const res = await deliveryApi.adminDeliveries();
      if (live && res.success) setDeliveries(res.data as any[]);
      if (live) setLoading(false);
    };
    load();
    const t = setInterval(load, 6000);
    return () => {
      live = false;
      clearInterval(t);
    };
  }, []);

  const active = deliveries.filter((d) => isActiveStatus(d.status as DeliveryStatus));
  const shown = tab === "active" ? active : deliveries;

  return (
    <div className="space-y-4">
      <div className="flex gap-1 rounded-xl bg-muted p-1">
        <TabBtn active={tab === "active"} onClick={() => setTab("active")}>
          Active ({active.length})
        </TabBtn>
        <TabBtn active={tab === "all"} onClick={() => setTab("all")}>
          All ({deliveries.length})
        </TabBtn>
      </div>

      {loading ? (
        <SkeletonList />
      ) : shown.length === 0 ? (
        <EmptyState
          icon={<PackageSearch className="size-7" />}
          title={tab === "active" ? "No active deliveries" : "No deliveries"}
          sub="Deliveries created on the platform appear here in real time."
        />
      ) : (
        <div className="space-y-3">
          {shown.map((d) => (
            <AdminDeliveryCard key={d._id} d={d} currencySymbol={currencySymbol} />
          ))}
        </div>
      )}
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-1 rounded-lg py-2 text-xs font-bold transition-colors",
        active ? "bg-card text-foreground shadow-sm" : "text-muted-foreground",
      )}
    >
      {children}
    </button>
  );
}

function AdminDeliveryCard({ d, currencySymbol }: { d: any; currencySymbol: string }) {
  const live = isActiveStatus(d.status as DeliveryStatus);
  const courierPos =
    d.courier_lat != null && d.courier_lng != null ? { lat: d.courier_lat, lng: d.courier_lng } : undefined;

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between gap-2 px-4 pt-3.5">
        <p className="text-sm font-bold text-foreground">
          {d.package_category} · {d.package_size}
        </p>
        <StatusPill status={d.status} />
      </div>

      {live && (
        <div className="mt-3 px-4">
          <LiveMap pickup={d.pickup} dropoff={d.dropoff} courier={courierPos} className="h-32" />
        </div>
      )}

      <div className="space-y-1.5 px-4 py-3 text-sm">
        <div className="flex items-center gap-2">
          <MapPin className="size-3.5 shrink-0 text-primary" />
          <span className="truncate text-muted-foreground">{d.pickup?.address}</span>
        </div>
        <div className="flex items-center gap-2">
          <Flag className="size-3.5 shrink-0 text-accent" />
          <span className="truncate text-muted-foreground">{d.dropoff?.address}</span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-border/60 px-4 py-2.5 text-xs">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <User className="size-3.5" /> {d.customer?.username ?? "—"}
        </span>
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Truck className="size-3.5" /> {d.courier?.user?.username ?? "Unassigned"}
        </span>
        <span className="font-bold tabular-nums text-foreground">
          {formatMoney(d.estimated_cost ?? 0, currencySymbol)}
        </span>
      </div>
    </div>
  );
}
