import { useEffect, useState } from "react";
import { Link } from "react-router";
import { PlusCircle, PackageSearch, Truck } from "lucide-react";
import { RoleGate } from "~/components/delivery/guards";
import { AppShell } from "~/components/delivery/app-shell";
import { customerNav } from "~/components/delivery/nav-configs";
import { DeliveryCard } from "~/components/delivery/delivery-card";
import { useBrand } from "~/components/delivery/brand";
import { Button } from "~/components/ui/button";
import { deliveryApi } from "~/lib/delivery/delivery.api";
import { isActiveStatus, type DeliveryStatus } from "~/lib/delivery/delivery.shared";

export default function CustomerHome() {
  return (
    <RoleGate allow={["customer", "admin"]}>
      <AppShell nav={customerNav} title="My Deliveries">
        <CustomerHomeContent />
      </AppShell>
    </RoleGate>
  );
}

function CustomerHomeContent() {
  const { currencySymbol } = useBrand();
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true;
    const load = async () => {
      const res = await deliveryApi.myDeliveries();
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

  return (
    <div className="space-y-5">
      <Link
        to="/app/new"
        className="flex items-center gap-3 rounded-2xl bg-primary p-4 text-primary-foreground shadow-md transition-transform active:scale-[0.99]"
      >
        <span className="flex size-11 items-center justify-center rounded-xl bg-white/15">
          <PlusCircle className="size-6" />
        </span>
        <div className="flex-1">
          <p className="font-bold">Send a package</p>
          <p className="text-sm text-primary-foreground/80">Pickup to drop-off in a few taps</p>
        </div>
      </Link>

      <section>
        <h2 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-foreground">
          <Truck className="size-4 text-secondary" /> Active deliveries
        </h2>
        {loading ? (
          <SkeletonList />
        ) : active.length === 0 ? (
          <EmptyState
            icon={<PackageSearch className="size-7" />}
            title="No active deliveries"
            sub="Your in-progress packages will appear here."
          />
        ) : (
          <div className="space-y-3">
            {active.map((d) => (
              <DeliveryCard key={d._id} delivery={d} to={`/app/track/${d._id}`} currencySymbol={currencySymbol} />
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-bold text-foreground">Recent</h2>
          <Link to="/app/history" className="text-xs font-semibold text-primary hover:underline">
            See all
          </Link>
        </div>
        {!loading && deliveries.length === 0 ? (
          <EmptyState icon={<PackageSearch className="size-7" />} title="Nothing yet" sub="Create your first delivery to get started." />
        ) : (
          <div className="space-y-3">
            {deliveries.slice(0, 3).map((d) => (
              <DeliveryCard key={d._id} delivery={d} to={`/app/track/${d._id}`} currencySymbol={currencySymbol} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export function SkeletonList() {
  return (
    <div className="space-y-3">
      {[0, 1].map((i) => (
        <div key={i} className="h-32 animate-pulse rounded-2xl bg-muted" />
      ))}
    </div>
  );
}

export function EmptyState({ icon, title, sub, action }: { icon: React.ReactNode; title: string; sub: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-border bg-card/50 px-6 py-10 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">{icon}</span>
      <p className="mt-3 font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{sub}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
