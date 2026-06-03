import { MapPin } from "lucide-react";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Select } from "~/components/ui/select";

export interface AddressValue {
  address: string;
  lat: number;
  lng: number;
  contact_name: string;
  contact_phone: string;
}

/** Curated demo locations so addresses resolve to real coordinates without a maps API. */
export const DEMO_LOCATIONS: { label: string; address: string; lat: number; lng: number }[] = [
  { label: "Flatiron", address: "175 5th Ave, Flatiron, New York", lat: 40.7411, lng: -73.9897 },
  { label: "SoHo", address: "120 Greene St, SoHo, New York", lat: 40.725, lng: -74.0009 },
  { label: "Midtown / Rockefeller", address: "30 Rockefeller Plaza, Midtown, New York", lat: 40.7587, lng: -73.9787 },
  { label: "Upper East Side", address: "1000 5th Ave, Upper East Side, New York", lat: 40.7794, lng: -73.9632 },
  { label: "Chelsea", address: "601 W 26th St, Chelsea, New York", lat: 40.7506, lng: -74.0055 },
  { label: "Greenwich Village", address: "1 Washington Sq, Greenwich Village, New York", lat: 40.7308, lng: -73.9973 },
  { label: "Williamsburg", address: "240 Kent Ave, Williamsburg, Brooklyn", lat: 40.7197, lng: -73.9627 },
  { label: "Financial District", address: "11 Wall St, Financial District, New York", lat: 40.7069, lng: -74.0113 },
];

export function AddressField({
  title,
  tone,
  value,
  onChange,
}: {
  title: string;
  tone: "primary" | "accent";
  value: AddressValue;
  onChange: (v: AddressValue) => void;
}) {
  const selectedIdx = DEMO_LOCATIONS.findIndex((l) => l.address === value.address);

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center gap-2">
        <span
          className={
            tone === "primary"
              ? "flex size-7 items-center justify-center rounded-full bg-primary/10 text-primary"
              : "flex size-7 items-center justify-center rounded-full bg-accent/15 text-accent-foreground"
          }
        >
          <MapPin className="size-4" />
        </span>
        <h3 className="text-sm font-bold text-foreground">{title}</h3>
      </div>

      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Location</Label>
          <Select
            value={selectedIdx >= 0 ? String(selectedIdx) : ""}
            onChange={(e) => {
              const loc = DEMO_LOCATIONS[Number(e.target.value)];
              if (loc) onChange({ ...value, address: loc.address, lat: loc.lat, lng: loc.lng });
            }}
          >
            <option value="" disabled>
              Choose a location
            </option>
            {DEMO_LOCATIONS.map((l, i) => (
              <option key={l.address} value={i}>
                {l.label} — {l.address}
              </option>
            ))}
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Contact name</Label>
            <Input
              value={value.contact_name}
              onChange={(e) => onChange({ ...value, contact_name: e.target.value })}
              placeholder="Full name"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Contact phone</Label>
            <Input
              value={value.contact_phone}
              onChange={(e) => onChange({ ...value, contact_phone: e.target.value })}
              placeholder="Phone"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
