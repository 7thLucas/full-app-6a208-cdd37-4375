import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router";
import { Briefcase, Power, MapPin, Flag, Loader2, ShieldAlert, PackageSearch } from "lucide-react";
import { RoleGate } from "~/components/delivery/guards";
import { AppShell } from "~/components/delivery/app-shell";
import { courierNav } from "~/components/delivery/nav-configs";
import { useBrand } from "~/components/delivery/brand";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { deliveryApi } from "~/lib/delivery/delivery.api";
import { formatMoney, haversineKm } from "~/lib/delivery/delivery.shared";
import { EmptyState, SkeletonList } from "../app+/_index";
import { cn } from "~/lib/utils";

export default function CourierJobs() {
  return (
    <RoleGate allow={["courier"]}>
      <CourierJobsInner />
    </RoleGate>
  );
}

function CourierJobsInner() {
  const navigate = useNavigate();
  const { currencySymbol } = useBrand();
  const [profile, setProfile] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [accepting, setAccepting] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    const res = await deliveryApi.courierProfile();
    if (res.success) setProfile(res.data);
  }, []);

  const loadJobs = useCallback(async () => {
    const res = await deliveryApi.availableJobs();
    if (res.success) setJobs(res.data as any[]);
  }, []);

  useEffect(() => {
    Promise.all([loadProfile(), loadJobs()]).then(() => setLoading(false));
    const t = setInterval(loadJobs, 6000);
    return () => clearInterval(t);
  }, [loadProfile, loadJobs]);

  const verified = profile?.verification_status === "verified";

  const toggleOnline = async () => {
    setToggling(true);
    const res = await deliveryApi.setOnline(!profile?.is_online);
    if (res.success) setProfile(res.data);
    setToggling(false);
  };

  const accept = async (jobId: string) => {
    setAccepting(jobId);
    const res = await deliveryApi.acceptJob(jobId);
    setAccepting(null);
    if (res.success) navigate(`/courier/job/${jobId}`);
    else {
      await loadJobs();
      alert(res.message || "This job is no longer available.");
    }
  };

  const headerRight = (
    <button
      onClick={toggleOnline}
      disabled={toggling || !verified}
      className={cn(
        "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-colors disabled:opacity-50",
        profile?.is_online ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground",
      )}
    >
      <Power className="size-3.5" />
      {profile?.is_online ? "Online" : "Offline"}
    </button>
  );

  return (
    <AppShell nav={courierNav} title="Available jobs" headerRight={headerRight}>
      {loading ? (
        <SkeletonList />
      ) : !verified ? (
        <div className="rounded-2xl border border-accent/40 bg-accent/10 p-5 text-center">
          <ShieldAlert className="mx-auto size-8 text-accent-foreground" />
          <p className="mt-2 font-bold text-foreground">Verification {profile?.verification_status ?? "required"}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Complete your profile and wait for admin verification before you can accept jobs.
          </p>
          <Button className="mt-4" onClick={() => navigate("/courier/profile")}>
            Complete profile
          </Button>
        </div>
      ) : !profile?.is_online ? (
        <EmptyState
          icon={<Power className="size-7" />}
          title="You're offline"
          sub="Go online to start receiving delivery jobs."
          action={
            <Button onClick={toggleOnline} disabled={toggling} className="gap-2">
              {toggling ? <Loader2 className="size-4 animate-spin" /> : <Power className="size-4" />} Go online
            </Button>
          }
        />
      ) : jobs.length === 0 ? (
        <EmptyState icon={<PackageSearch className="size-7" />} title="No jobs right now" sub="New delivery requests will appear here automatically." />
      ) : (
        <div className="space-y-3">
          <p className="flex items-center gap-1.5 text-sm font-bold text-foreground">
            <Briefcase className="size-4 text-primary" /> {jobs.length} job{jobs.length > 1 ? "s" : ""} nearby
          </p>
          {jobs.map((j) => {
            const dist = haversineKm(j.pickup, j.dropoff);
            return (
              <div key={j._id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                <div className="mb-2 flex items-center justify-between">
                  <Badge variant="muted">{j.package_category} · {j.package_size}</Badge>
                  <span className="text-base font-extrabold tabular-nums text-secondary">
                    {formatMoney(j.estimated_cost, currencySymbol)}
                  </span>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="size-3.5 shrink-0 text-primary" />
                    <span className="truncate text-muted-foreground">{j.pickup.address}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Flag className="size-3.5 shrink-0 text-accent" />
                    <span className="truncate text-muted-foreground">{j.dropoff.address}</span>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground tabular-nums">{dist.toFixed(1)} km route · {j.package_weight} kg</span>
                </div>
                <Button className="mt-3 w-full" onClick={() => accept(j._id)} disabled={accepting === j._id}>
                  {accepting === j._id && <Loader2 className="size-4 animate-spin" />} Accept job
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
