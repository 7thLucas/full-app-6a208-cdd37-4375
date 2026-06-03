import { Check } from "lucide-react";
import { FORWARD_STATUS_FLOW, type DeliveryStatus } from "~/lib/delivery/delivery.shared";
import { cn } from "~/lib/utils";

interface TimelineEvent {
  status: string;
  at: string | Date;
  note?: string;
}

function fmt(at: string | Date) {
  const d = new Date(at);
  return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function StatusTimeline({
  current,
  events = [],
}: {
  current: DeliveryStatus | string;
  events?: TimelineEvent[];
}) {
  if (current === "Cancelled") {
    const cancelEvent = events.find((e) => e.status === "Cancelled");
    return (
      <ol className="space-y-4">
        {events.map((e, i) => (
          <li key={i} className="flex gap-3">
            <span
              className={cn(
                "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full",
                e.status === "Cancelled" ? "bg-destructive text-white" : "bg-primary text-primary-foreground",
              )}
            >
              <Check className="size-3" strokeWidth={3} />
            </span>
            <div>
              <p className="text-sm font-semibold text-foreground">{e.status}</p>
              <p className="text-xs text-muted-foreground tabular-nums">{fmt(e.at)}</p>
              {e.note && <p className="text-xs text-muted-foreground">{e.note}</p>}
            </div>
          </li>
        ))}
        {!cancelEvent && <li className="text-sm text-destructive">Cancelled</li>}
      </ol>
    );
  }

  const currentIdx = FORWARD_STATUS_FLOW.indexOf(current as DeliveryStatus);
  const eventMap = new Map(events.map((e) => [e.status, e]));

  return (
    <ol className="relative space-y-0">
      {FORWARD_STATUS_FLOW.map((s, i) => {
        const done = i < currentIdx;
        const active = i === currentIdx;
        const event = eventMap.get(s);
        const last = i === FORWARD_STATUS_FLOW.length - 1;
        return (
          <li key={s} className="flex gap-3 pb-5 last:pb-0">
            <div className="relative flex flex-col items-center">
              <span
                className={cn(
                  "relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                  done && "border-primary bg-primary text-primary-foreground",
                  active && "border-secondary bg-secondary text-secondary-foreground",
                  !done && !active && "border-border bg-card text-muted-foreground",
                )}
              >
                {done ? (
                  <Check className="size-3.5" strokeWidth={3} />
                ) : active ? (
                  <span className="pakettt-pulse relative size-2 rounded-full bg-current text-secondary-foreground" />
                ) : (
                  <span className="size-1.5 rounded-full bg-current" />
                )}
              </span>
              {!last && (
                <span
                  className={cn(
                    "absolute top-6 h-full w-0.5",
                    done ? "bg-primary" : "bg-border",
                  )}
                />
              )}
            </div>
            <div className={cn("pt-0.5", !done && !active && "opacity-60")}>
              <p
                className={cn(
                  "text-sm font-semibold",
                  active ? "text-secondary" : "text-foreground",
                )}
              >
                {s}
              </p>
              {event && <p className="text-xs text-muted-foreground tabular-nums">{fmt(event.at)}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
