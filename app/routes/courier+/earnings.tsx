import { useEffect, useState } from "react";
import { DollarSign, Package, Star } from "lucide-react";
import { RoleGate } from "~/components/delivery/guards";
import { AppShell } from "~/components/delivery/app-shell";
import { courierNav } from "~/components/delivery/nav-configs";
import { DeliveryCard } from "~/components/delivery/delivery-card";
import { RatingStars } from "~/components/delivery/rating-stars";
import { useBrand } from "~/components/delivery/brand";
import { deliveryApi } from "~/lib/delivery/delivery.api";
import { formatMoney } from "~/lib/delivery/delivery.shared";
import { SkeletonList, EmptyState } from "../app+/_index";

export default function CourierEarnings() {
  return (
    <RoleGate allow={["courier"]}>
      <AppShell nav={courierNav} title="Earnings & history">
        <EarningsContent />
      </AppShell>
    </RoleGate>
  );
}

function EarningsContent() {
  const { currencySymbol } = useBrand();
  const [profile, setProfile] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [ratings, setRatings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([deliveryApi.courierProfile(), deliveryApi.myJobs(), deliveryApi.courierRatings()]).then(
      ([p, j, r]) => {
        if (p.success) setProfile(p.data);
        if (j.success) setJobs(j.data as any[]);
        if (r.success) setRatings(r.data as any[]);
        setLoading(false);
      },
    );
  }, []);

  if (loading) return <SkeletonList />;

  const completed = jobs.filter((j) => j.status === "Delivered");

  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-gradient-to-br from-primary to-[#5b4bff] p-5 text-primary-foreground shadow-md">
        <p className="text-sm text-primary-foreground/80">Total earnings</p>
        <p className="mt-1 text-3xl font-extrabold tabular-nums">
          {formatMoney(profile?.total_earnings ?? 0, currencySymbol)}
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-white/10 p-3">
            <p className="flex items-center gap-1 text-xs text-primary-foreground/80">
              <Package className="size-3.5" /> Completed
            </p>
            <p className="text-lg font-bold tabular-nums">{profile?.completed_deliveries ?? 0}</p>
          </div>
          <div className="rounded-xl bg-white/10 p-3">
            <p className="flex items-center gap-1 text-xs text-primary-foreground/80">
              <Star className="size-3.5" /> Rating
            </p>
            <p className="text-lg font-bold tabular-nums">
              {(profile?.rating_avg ?? 0).toFixed(1)}{" "}
              <span className="text-xs font-normal">({profile?.rating_count ?? 0})</span>
            </p>
          </div>
        </div>
      </div>

      <section>
        <h2 className="mb-2 text-sm font-bold text-foreground">Recent reviews</h2>
        {ratings.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border bg-card/50 px-4 py-6 text-center text-sm text-muted-foreground">
            No reviews yet.
          </p>
        ) : (
          <div className="space-y-2">
            {ratings.slice(0, 4).map((r) => (
              <div key={r._id} className="rounded-2xl border border-border bg-card p-3">
                <RatingStars value={r.stars} readOnly size="sm" />
                {r.comment && <p className="mt-1 text-sm text-muted-foreground">{r.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-sm font-bold text-foreground">Completed deliveries</h2>
        {completed.length === 0 ? (
          <EmptyState icon={<DollarSign className="size-7" />} title="No completed deliveries" sub="Finished jobs and their earnings appear here." />
        ) : (
          <div className="space-y-3">
            {completed.map((j) => (
              <DeliveryCard key={j._id} delivery={j} to={`/courier/job/${j._id}`} currencySymbol={currencySymbol} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
