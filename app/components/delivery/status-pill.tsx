import { Badge } from "~/components/ui/badge";
import { statusTone, type DeliveryStatus } from "~/lib/delivery/delivery.shared";
import { cn } from "~/lib/utils";

export function StatusPill({ status, className }: { status: DeliveryStatus | string; className?: string }) {
  const tone = statusTone(status as DeliveryStatus);
  return (
    <Badge variant={tone} className={cn("font-semibold", className)}>
      {tone === "secondary" && (
        <span className="relative mr-0.5 inline-flex size-1.5 text-secondary-foreground">
          <span className="size-1.5 rounded-full bg-current" />
        </span>
      )}
      {status}
    </Badge>
  );
}
