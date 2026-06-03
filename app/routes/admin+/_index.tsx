import { useEffect, useState } from "react";
import { Link } from "react-router";
import {
  Package,
  CheckCircle2,
  XCircle,
  Truck,
  Users,
  ShieldCheck,
  Power,
  AlertTriangle,
  DollarSign,
  ArrowRight,
} from "lucide-react";
import { RoleGate } from "~/components/delivery/guards";
import { AppShell } from "~/components/delivery/app-shell";
import { adminNav } from "~/components/delivery/nav-configs";
import { useBrand } from "~/components/delivery/brand";
import { deliveryApi } from "~/lib/delivery/delivery.api";
import { formatMoney } from "~/lib/delivery/delivery.shared";
import { SkeletonList } from "../app+/_index";

export default function AdminOverview() {
  return (
    <RoleGate allow={["admin"]}>
      <AppShell nav={adminNav} title="Operations">
        <OverviewContent />
      </AppShell>
    </RoleGate>
  );
}

function OverviewContent() {
  const { currencySymbol } = useBrand();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const res = await deliveryApi.adminAnalytics();
      if (res.success) setStats(res.data);
      setLoading(false);
    };
    load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, []);

  if (loading) return <SkeletonList />;

  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-gradient-to-br from-primary to-[#5b4bff] p-5 text-primary-foreground shadow-md">
        <p className="text-sm text-primary-foreground/80">Total revenue (completed)</p>
        <p className="mt-1 text-3xl font-extrabold tabular-nums">
          {formatMoney(stats?.revenue ?? 0, currencySymbol)}
        </p>
        <p className="mt-1 text-xs text-primary-foreground/80">
          {stats?.delivered ?? 0} completed of {stats?.totalDeliveries ?? 0} total deliveries
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Stat icon={<Truck className="size-4" />} label="Active now" value={stats?.active ?? 0} tone="secondary" />
        <Stat icon={<Package className="size-4" />} label="All deliveries" value={stats?.totalDeliveries ?? 0} tone="primary" />
        <Stat icon={<CheckCircle2 className="size-4" />} label="Delivered" value={stats?.delivered ?? 0} tone="secondary" />
        <Stat icon={<XCircle className="size-4" />} label="Cancelled" value={stats?.cancelled ?? 0} tone="muted" />
      </div>

      <section>
        <h2 className="mb-2 text-sm font-bold text-foreground">People</h2>
        <div className="grid grid-cols-2 gap-3">
          <Stat icon={<Users className="size-4" />} label="Customers" value={stats?.totalCustomers ?? 0} tone="primary" />
          <Stat icon={<Truck className="size-4" />} label="Couriers" value={stats?.totalCouriers ?? 0} tone="primary" />
          <Stat icon={<ShieldCheck className="size-4" />} label="Verified" value={stats?.verifiedCouriers ?? 0} tone="secondary" />
          <Stat icon={<Power className="size-4" />} label="Online" value={stats?.onlineCouriers ?? 0} tone="accent" />
        </div>
      </section>

      <div className="space-y-2">
        <ActionRow to="/admin/deliveries" icon={<Truck className="size-4" />} label="Monitor live deliveries" />
        <ActionRow
          to="/admin/disputes"
          icon={<AlertTriangle className="size-4" />}
          label="Review disputes"
          badge={stats?.openDisputes ?? 0}
        />
        <ActionRow to="/admin/couriers" icon={<Users className="size-4" />} label="Verify couriers" />
        <ActionRow to="/admin/settings" icon={<DollarSign className="size-4" />} label="Pricing rules" />
      </div>
    </div>
  );
}

function Stat({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: number; tone: "primary" | "secondary" | "accent" | "muted" }) {
  const toneCls: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    secondary: "bg-secondary/10 text-secondary",
    accent: "bg-accent/15 text-accent-foreground",
    muted: "bg-muted text-muted-foreground",
  };
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <span className={`flex size-8 items-center justify-center rounded-lg ${toneCls[tone]}`}>{icon}</span>
      <p className="mt-2 text-2xl font-extrabold tabular-nums text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function ActionRow({ to, icon, label, badge }: { to: string; icon: React.ReactNode; label: string; badge?: number }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5 shadow-sm transition-shadow hover:shadow-md"
    >
      <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">{icon}</span>
      <span className="flex-1 text-sm font-semibold text-foreground">{label}</span>
      {badge && badge > 0 ? (
        <span className="flex size-6 items-center justify-center rounded-full bg-destructive text-xs font-bold text-destructive-foreground">
          {badge}
        </span>
      ) : null}
      <ArrowRight className="size-4 text-muted-foreground" />
    </Link>
  );
}
