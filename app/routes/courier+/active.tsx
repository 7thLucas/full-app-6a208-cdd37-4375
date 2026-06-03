import { useEffect, useState } from "react";
import { Home } from "lucide-react";
import { RoleGate } from "~/components/delivery/guards";
import { AppShell } from "~/components/delivery/app-shell";
import { courierNav } from "~/components/delivery/nav-configs";
import { DeliveryCard } from "~/components/delivery/delivery-card";
import { useBrand } from "~/components/delivery/brand";
import { deliveryApi } from "~/lib/delivery/delivery.api";
import { isActiveStatus, type DeliveryStatus } from "~/lib/delivery/delivery.shared";
import { EmptyState, SkeletonList } from "../app+/_index";

export default function CourierActive() {
  return (
    <RoleGate allow={["courier"]}>
      <AppShell nav={courierNav} title="My active jobs">
        <ActiveContent />
      </AppShell>
    </RoleGate>
  );
}

function ActiveContent() {
  const { currencySymbol } = useBrand();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true;
    const load = async () => {
      const res = await deliveryApi.myJobs();
      if (live && res.success) setJobs(res.data as any[]);
      if (live) setLoading(false);
    };
    load();
    const t = setInterval(load, 6000);
    return () => {
      live = false;
      clearInterval(t);
    };
  }, []);

  const active = jobs.filter((j) => isActiveStatus(j.status as DeliveryStatus));

  if (loading) return <SkeletonList />;
  if (active.length === 0)
    return <EmptyState icon={<Home className="size-7" />} title="No active jobs" sub="Accept a job from the Jobs tab to get started." />;

  return (
    <div className="space-y-3">
      {active.map((j) => (
        <DeliveryCard key={j._id} delivery={j} to={`/courier/job/${j._id}`} currencySymbol={currencySymbol} />
      ))}
    </div>
  );
}
