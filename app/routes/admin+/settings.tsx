import { useEffect, useState } from "react";
import { DollarSign, Loader2, Check, Calculator } from "lucide-react";
import { RoleGate } from "~/components/delivery/guards";
import { AppShell } from "~/components/delivery/app-shell";
import { adminNav } from "~/components/delivery/nav-configs";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { deliveryApi } from "~/lib/delivery/delivery.api";
import { PACKAGE_SIZES, SIZE_MULTIPLIER, estimatePrice, formatMoney } from "~/lib/delivery/delivery.shared";
import { SkeletonList } from "../app+/_index";

export default function AdminSettings() {
  return (
    <RoleGate allow={["admin"]}>
      <AppShell nav={adminNav} title="Pricing rules">
        <SettingsContent />
      </AppShell>
    </RoleGate>
  );
}

function SettingsContent() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({ base_fare: 3.5, per_km_rate: 1.2, currency_symbol: "$" });

  useEffect(() => {
    deliveryApi.adminPricing().then((res) => {
      if (res.success && res.data) {
        setForm({
          base_fare: res.data.base_fare ?? 3.5,
          per_km_rate: res.data.per_km_rate ?? 1.2,
          currency_symbol: res.data.currency_symbol ?? "$",
        });
      }
      setLoading(false);
    });
  }, []);

  const save = async () => {
    setSaving(true);
    const res = await deliveryApi.updatePricing({
      base_fare: Number(form.base_fare),
      per_km_rate: Number(form.per_km_rate),
      currency_symbol: form.currency_symbol,
    });
    setSaving(false);
    if (res.success) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  };

  if (loading) return <SkeletonList />;

  const rules = {
    baseFare: Number(form.base_fare) || 0,
    perKmRate: Number(form.per_km_rate) || 0,
    currencySymbol: form.currency_symbol,
  };
  const sampleKm = 5;

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-primary">
            <DollarSign className="size-4" />
          </span>
          <h3 className="text-sm font-bold text-foreground">Fare structure</h3>
        </div>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Currency symbol</Label>
            <Input
              value={form.currency_symbol}
              onChange={(e) => setForm({ ...form, currency_symbol: e.target.value.slice(0, 3) })}
              placeholder="$"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Base fare</Label>
              <Input
                type="number"
                step="0.1"
                min="0"
                value={form.base_fare}
                onChange={(e) => setForm({ ...form, base_fare: e.target.value as any })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Per km rate</Label>
              <Input
                type="number"
                step="0.1"
                min="0"
                value={form.per_km_rate}
                onChange={(e) => setForm({ ...form, per_km_rate: e.target.value as any })}
              />
            </div>
          </div>
        </div>
        <Button className="mt-4 w-full gap-1.5" onClick={save} disabled={saving}>
          {saving ? <Loader2 className="size-4 animate-spin" /> : saved ? <Check className="size-4" /> : null}
          {saved ? "Saved!" : "Save pricing"}
        </Button>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <Calculator className="size-4 text-secondary" />
          <h3 className="text-sm font-bold text-foreground">Live preview · {sampleKm} km trip</h3>
        </div>
        <p className="mb-3 text-xs text-muted-foreground">
          Price = base fare + (distance × per-km rate × size multiplier)
        </p>
        <div className="space-y-2">
          {PACKAGE_SIZES.map((size) => (
            <div key={size} className="flex items-center justify-between rounded-xl bg-muted/60 px-3 py-2 text-sm">
              <span className="text-foreground">
                {size} <span className="text-xs text-muted-foreground">×{SIZE_MULTIPLIER[size]}</span>
              </span>
              <span className="font-bold tabular-nums text-foreground">
                {formatMoney(estimatePrice(sampleKm, size, rules), rules.currencySymbol)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
