import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { RoleGate } from "~/components/delivery/guards";
import { AppShell } from "~/components/delivery/app-shell";
import { customerNav } from "~/components/delivery/nav-configs";
import { DeliveryCard } from "~/components/delivery/delivery-card";
import { useBrand } from "~/components/delivery/brand";
import { deliveryApi } from "~/lib/delivery/delivery.api";
import { SkeletonList, EmptyState } from "./_index";

export default function CustomerHistory() {
  return (
    <RoleGate allow={["customer", "admin"]}>
      <AppShell nav={customerNav} title="Delivery history">
        <HistoryContent />
      </AppShell>
    </RoleGate>
  );
}

function HistoryContent() {
  const { currencySymbol } = useBrand();
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    deliveryApi.myDeliveries().then((res) => {
      if (res.success) setDeliveries(res.data as any[]);
      setLoading(false);
    });
  }, []);

  if (loading) return <SkeletonList />;
  if (deliveries.length === 0)
    return <EmptyState icon={<Clock className="size-7" />} title="No history yet" sub="Completed and past deliveries will show up here." />;

  return (
    <div className="space-y-3">
      {deliveries.map((d) => (
        <DeliveryCard key={d._id} delivery={d} to={`/app/track/${d._id}`} currencySymbol={currencySymbol} />
      ))}
    </div>
  );
}
