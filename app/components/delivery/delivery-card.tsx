import { Link } from "react-router";
import { ArrowRight, Package, MapPin, Flag } from "lucide-react";
import { StatusPill } from "./status-pill";
import { formatMoney } from "~/lib/delivery/delivery.shared";

interface DeliveryCardProps {
  delivery: any;
  to: string;
  currencySymbol?: string;
  subtitle?: string;
}

export function DeliveryCard({ delivery, to, currencySymbol = "$", subtitle }: DeliveryCardProps) {
  return (
    <Link
      to={to}
      className="block rounded-2xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Package className="size-4.5" />
          </span>
          <div>
            <p className="text-sm font-bold text-foreground">
              {delivery.package_category} · {delivery.package_size}
            </p>
            <p className="text-xs text-muted-foreground tabular-nums">
              {subtitle ?? new Date(delivery.createdAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
        </div>
        <StatusPill status={delivery.status} />
      </div>

      <div className="space-y-1.5 text-sm">
        <div className="flex items-center gap-2">
          <MapPin className="size-3.5 shrink-0 text-primary" />
          <span className="truncate text-muted-foreground">{delivery.pickup?.address}</span>
        </div>
        <div className="flex items-center gap-2">
          <Flag className="size-3.5 shrink-0 text-accent" />
          <span className="truncate text-muted-foreground">{delivery.dropoff?.address}</span>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-3">
        <span className="text-sm font-bold tabular-nums text-foreground">
          {formatMoney(delivery.estimated_cost ?? 0, currencySymbol)}
          <span className="ml-1.5 text-xs font-normal text-muted-foreground">
            {(delivery.distance_km ?? 0).toFixed(1)} km
          </span>
        </span>
        <span className="flex items-center gap-1 text-xs font-semibold text-primary">
          View <ArrowRight className="size-3.5" />
        </span>
      </div>
    </Link>
  );
}
