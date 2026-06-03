import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Loader2, ShieldCheck, ShieldAlert, ShieldX, Truck } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Select } from "~/components/ui/select";
import { deliveryApi } from "~/lib/delivery/delivery.api";
import { VEHICLE_TYPES } from "~/lib/delivery/delivery.shared";

export function CourierProfileForm({ redirectOnSave }: { redirectOnSave?: string }) {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    vehicle_type: "Motorcycle",
    vehicle_plate: "",
    vehicle_model: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    deliveryApi.courierProfile().then((res) => {
      if (res.success && res.data) {
        setProfile(res.data);
        setForm({
          full_name: res.data.full_name || "",
          phone: res.data.phone || "",
          vehicle_type: res.data.vehicle_type || "Motorcycle",
          vehicle_plate: res.data.vehicle_plate || "",
          vehicle_model: res.data.vehicle_model || "",
        });
      }
      setLoading(false);
    });
  }, []);

  const save = async () => {
    setSaving(true);
    const res = await deliveryApi.updateCourierProfile(form);
    setSaving(false);
    if (res.success) {
      setProfile(res.data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      if (redirectOnSave) navigate(redirectOnSave, { replace: true });
    }
  };

  if (loading)
    return <div className="h-64 animate-pulse rounded-2xl bg-muted" />;

  const vs = profile?.verification_status ?? "pending";

  return (
    <div className="space-y-4">
      <VerificationBanner status={vs} />

      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="mb-3 flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Truck className="size-4" />
          </span>
          <h3 className="text-sm font-bold text-foreground">Courier & vehicle details</h3>
        </div>
        <div className="space-y-3">
          <Field label="Full name" value={form.full_name} onChange={(v) => setForm({ ...form, full_name: v })} placeholder="Your full name" />
          <Field label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} placeholder="+1 …" />
          <div className="space-y-1.5">
            <Label className="text-xs">Vehicle type</Label>
            <Select value={form.vehicle_type} onChange={(e) => setForm({ ...form, vehicle_type: e.target.value })}>
              {VEHICLE_TYPES.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Plate / ID" value={form.vehicle_plate} onChange={(v) => setForm({ ...form, vehicle_plate: v })} placeholder="Plate" />
            <Field label="Model" value={form.vehicle_model} onChange={(v) => setForm({ ...form, vehicle_model: v })} placeholder="Model" />
          </div>
        </div>
        <Button className="mt-4 w-full" onClick={save} disabled={saving}>
          {saving && <Loader2 className="size-4 animate-spin" />} {saved ? "Saved!" : "Save profile"}
        </Button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}

function VerificationBanner({ status }: { status: string }) {
  const map: Record<string, { icon: React.ReactNode; title: string; sub: string; cls: string }> = {
    verified: {
      icon: <ShieldCheck className="size-6" />,
      title: "Verified courier",
      sub: "You can go online and accept jobs.",
      cls: "border-secondary/40 bg-secondary/10 text-secondary",
    },
    pending: {
      icon: <ShieldAlert className="size-6" />,
      title: "Verification pending",
      sub: "Our team is reviewing your details. You'll be notified once approved.",
      cls: "border-accent/40 bg-accent/10 text-accent-foreground",
    },
    rejected: {
      icon: <ShieldX className="size-6" />,
      title: "Verification rejected",
      sub: "Please update your details and resubmit for review.",
      cls: "border-destructive/40 bg-destructive/10 text-destructive",
    },
  };
  const m = map[status] ?? map.pending;
  return (
    <div className={`flex items-center gap-3 rounded-2xl border p-4 ${m.cls}`}>
      {m.icon}
      <div>
        <p className="font-bold">{m.title}</p>
        <p className="text-sm opacity-90">{m.sub}</p>
      </div>
    </div>
  );
}
