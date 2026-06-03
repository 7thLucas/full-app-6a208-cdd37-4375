import { useMemo } from "react";
import { MapPin, Flag, Navigation } from "lucide-react";
import type { GeoPoint } from "~/lib/delivery/delivery.shared";
import { cn } from "~/lib/utils";

interface LiveMapProps {
  pickup: GeoPoint;
  dropoff: GeoPoint;
  courier?: GeoPoint | null;
  className?: string;
}

/**
 * Dependency-free interactive-style map. Projects real lat/lng into an SVG
 * viewport with a route line, pickup/drop-off pins and an animated courier
 * marker. Good enough for an MVP live-tracking visual without an API key.
 */
export function LiveMap({ pickup, dropoff, courier, className }: LiveMapProps) {
  const pts = useMemo(() => {
    const all = [pickup, dropoff, ...(courier ? [courier] : [])];
    const lats = all.map((p) => p.lat);
    const lngs = all.map((p) => p.lng);
    let minLat = Math.min(...lats);
    let maxLat = Math.max(...lats);
    let minLng = Math.min(...lngs);
    let maxLng = Math.max(...lngs);
    // pad bounds
    const padLat = Math.max((maxLat - minLat) * 0.25, 0.004);
    const padLng = Math.max((maxLng - minLng) * 0.25, 0.004);
    minLat -= padLat;
    maxLat += padLat;
    minLng -= padLng;
    maxLng += padLng;

    const W = 100;
    const H = 100;
    const project = (p: GeoPoint) => ({
      x: ((p.lng - minLng) / (maxLng - minLng || 1)) * W,
      y: (1 - (p.lat - minLat) / (maxLat - minLat || 1)) * H,
    });
    return {
      pickup: project(pickup),
      dropoff: project(dropoff),
      courier: courier ? project(courier) : null,
    };
  }, [pickup, dropoff, courier]);

  return (
    <div className={cn("relative overflow-hidden rounded-2xl bg-[#eef1fb]", className)}>
      {/* grid / terrain backdrop */}
      <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 size-full">
        <defs>
          <pattern id="map-grid" width="8" height="8" patternUnits="userSpaceOnUse">
            <path d="M8 0H0V8" fill="none" stroke="#dfe4f5" strokeWidth="0.4" />
          </pattern>
          <linearGradient id="map-bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f3f5fd" />
            <stop offset="100%" stopColor="#e7ecfb" />
          </linearGradient>
        </defs>
        <rect width="100" height="100" fill="url(#map-bg)" />
        <rect width="100" height="100" fill="url(#map-grid)" />
        {/* faux roads */}
        <path d="M-5 30 L120 38" stroke="#d4dbf2" strokeWidth="2.4" fill="none" />
        <path d="M20 -5 L34 120" stroke="#d4dbf2" strokeWidth="2.4" fill="none" />
        <path d="M-5 70 L120 64" stroke="#d4dbf2" strokeWidth="1.8" fill="none" />
        <path d="M72 -5 L66 120" stroke="#d4dbf2" strokeWidth="1.8" fill="none" />

        {/* route line */}
        <path
          d={`M ${pts.pickup.x} ${pts.pickup.y} L ${pts.dropoff.x} ${pts.dropoff.y}`}
          stroke="#3D2BFF"
          strokeWidth="1.1"
          strokeDasharray="2.4 2"
          strokeLinecap="round"
          fill="none"
          opacity="0.55"
        />
      </svg>

      {/* markers (HTML overlay for crisp icons) */}
      <Pin x={pts.pickup.x} y={pts.pickup.y} tone="primary" icon={<MapPin className="size-3.5" />} />
      <Pin x={pts.dropoff.x} y={pts.dropoff.y} tone="accent" icon={<Flag className="size-3.5" />} />
      {pts.courier && (
        <div
          className="absolute z-20 -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${pts.courier.x}%`, top: `${pts.courier.y}%` }}
        >
          <span className="relative flex items-center justify-center">
            <span className="pakettt-pulse absolute size-4 rounded-full text-secondary" />
            <span className="relative flex size-7 items-center justify-center rounded-full bg-secondary text-secondary-foreground shadow-lg ring-2 ring-white">
              <Navigation className="size-3.5" strokeWidth={2.5} />
            </span>
          </span>
        </div>
      )}
    </div>
  );
}

function Pin({
  x,
  y,
  tone,
  icon,
}: {
  x: number;
  y: number;
  tone: "primary" | "accent";
  icon: React.ReactNode;
}) {
  return (
    <div
      className="absolute z-10 -translate-x-1/2 -translate-y-full"
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      <span
        className={cn(
          "flex size-7 items-center justify-center rounded-full rounded-bl-none shadow-md ring-2 ring-white",
          tone === "primary" ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground",
        )}
        style={{ transform: "rotate(45deg)" }}
      >
        <span style={{ transform: "rotate(-45deg)" }}>{icon}</span>
      </span>
    </div>
  );
}
