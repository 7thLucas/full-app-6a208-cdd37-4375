import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Loader2, Package, ArrowRight } from "lucide-react";
import { RoleGate } from "~/components/delivery/guards";
import { AppShell } from "~/components/delivery/app-shell";
import { customerNav } from "~/components/delivery/nav-configs";
import { AddressField, DEMO_LOCATIONS, type AddressValue } from "~/components/delivery/address-field";
import { useBrand } from "~/components/delivery/brand";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Select } from "~/components/ui/select";
import { Textarea } from "~/components/ui/textarea";
import { deliveryApi } from "~/lib/delivery/delivery.api";
import {
  PACKAGE_SIZES,
  PACKAGE_CATEGORIES,
  formatMoney,
  type PackageSize,
} from "~/lib/delivery/delivery.shared";

const emptyAddr = (loc?: (typeof DEMO_LOCATIONS)[number]): AddressValue => ({
  address: loc?.address ?? "",
  lat: loc?.lat ?? 0,
  lng: loc?.lng ?? 0,
  contact_name: "",
  contact_phone: "",
});

export default function NewDeliveryPage() {
  return (
    <RoleGate allow={["customer", "admin"]}>
      <AppShell nav={customerNav} title="Send a package">
        <NewDeliveryForm />
      </AppShell>
    </RoleGate>
  );
}

function NewDeliveryForm() {
  const navigate = useNavigate();
  const { currencySymbol } = useBrand();
  const [pickup, setPickup] = useState<AddressValue>(emptyAddr(DEMO_LOCATIONS[0]));
  const [dropoff, setDropoff] = useState<AddressValue>(emptyAddr(DEMO_LOCATIONS[3]));
  const [size, setSize] = useState<PackageSize>("Medium");
  const [weight, setWeight] = useState("1");
  const [category, setCategory] = useState<string>("Other");
  const [instructions, setInstructions] = useState("");
  const [quote, setQuote] = useState<{ distance_km: number; estimated_cost: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ready = pickup.address && dropoff.address && pickup.lat !== 0 && dropoff.lat !== 0;

  useEffect(() => {
    if (!ready) {
      setQuote(null);
      return;
    }
    let live = true;
    deliveryApi
      .quote({ pickup, dropoff, package_size: size })
      .then((res) => {
        if (live && res.success) setQuote(res.data as any);
      });
    return () => {
      live = false;
    };
  }, [pickup, dropoff, size, ready]);

  const submit = async () => {
    setError(null);
    if (!ready) {
      setError("Choose both pickup and drop-off locations.");
      return;
    }
    setSubmitting(true);
    const res = await deliveryApi.createDelivery({
      pickup,
      dropoff,
      package_size: size,
      package_weight: Number(weight) || 1,
      package_category: category,
      special_instructions: instructions,
    });
    setSubmitting(false);
    if (res.success && res.data?._id) navigate(`/app/track/${res.data._id}`, { replace: true });
    else setError(res.message || "Could not create the delivery.");
  };

  return (
    <div className="space-y-4 pb-4">
      <AddressField title="Pickup from" tone="primary" value={pickup} onChange={setPickup} />
      <AddressField title="Deliver to" tone="accent" value={dropoff} onChange={setDropoff} />

      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="mb-3 flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-full bg-secondary/15 text-secondary">
            <Package className="size-4" />
          </span>
          <h3 className="text-sm font-bold text-foreground">Package details</h3>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Size</Label>
            <Select value={size} onChange={(e) => setSize(e.target.value as PackageSize)}>
              {PACKAGE_SIZES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Weight (kg)</Label>
            <Input type="number" min="0.1" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} />
          </div>
        </div>
        <div className="mt-2 space-y-1.5">
          <Label className="text-xs">Category</Label>
          <Select value={category} onChange={(e) => setCategory(e.target.value)}>
            {PACKAGE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </div>
        <div className="mt-2 space-y-1.5">
          <Label className="text-xs">Special instructions</Label>
          <Textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Fragile, ring buzzer, leave with concierge…"
            rows={2}
          />
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Estimate + submit (sticky bottom action) */}
      <div className="sticky bottom-0 -mx-4 border-t border-border bg-card/95 px-4 py-3 backdrop-blur">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Estimated cost</span>
          <span className="text-xl font-extrabold tabular-nums text-foreground">
            {quote ? formatMoney(quote.estimated_cost, currencySymbol) : "—"}
            {quote && (
              <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                {quote.distance_km.toFixed(1)} km
              </span>
            )}
          </span>
        </div>
        <Button className="w-full gap-2" size="lg" onClick={submit} disabled={submitting || !ready}>
          {submitting ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
          Request delivery
        </Button>
      </div>
    </div>
  );
}
