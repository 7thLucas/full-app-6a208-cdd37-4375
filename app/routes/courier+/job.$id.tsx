import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import {
  ArrowLeft,
  MessageCircle,
  Navigation,
  ChevronRight,
  Camera,
  Loader2,
  Phone,
  XCircle,
  CheckCircle2,
} from "lucide-react";
import { RoleGate, FullScreenLoader } from "~/components/delivery/guards";
import { LiveMap } from "~/components/delivery/live-map";
import { StatusPill } from "~/components/delivery/status-pill";
import { StatusTimeline } from "~/components/delivery/status-timeline";
import { ChatPanel } from "~/components/delivery/chat-panel";
import { PhotoUploader } from "~/components/delivery/photo-uploader";
import { SignaturePad } from "~/components/delivery/signature-pad";
import { useAccount } from "~/lib/delivery/use-account";
import { useBrand } from "~/components/delivery/brand";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Avatar } from "~/components/ui/avatar";
import { deliveryApi } from "~/lib/delivery/delivery.api";
import { formatMoney, nextStatus, isTerminalStatus, type DeliveryStatus } from "~/lib/delivery/delivery.shared";

export default function CourierJobPage() {
  return (
    <RoleGate allow={["courier"]}>
      <JobContent />
    </RoleGate>
  );
}

function JobContent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { account } = useAccount();
  const { currencySymbol } = useBrand();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"job" | "chat">("job");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    const res = await deliveryApi.getDelivery(id);
    if (res.success) setJob(res.data);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [load]);

  if (loading) return <FullScreenLoader />;
  if (!job) return <div className="flex min-h-dvh items-center justify-center text-sm text-muted-foreground">Job not found.</div>;

  const status = job.status as DeliveryStatus;
  const next = nextStatus(status);
  const courierLoc = job.courier_lat != null ? { lat: job.courier_lat, lng: job.courier_lng } : null;

  // Determine which proof is required at this stage
  const needsPickupProof = status === "Package Picked Up" && !job.pickup_proof?.photo_url;
  const needsDeliveryProof = status === "Arriving Soon" && !job.delivery_proof?.photo_url;

  const advance = async () => {
    setBusy(true);
    const res = await deliveryApi.advanceJob(job._id);
    setBusy(false);
    if (!res.success) alert(res.message || "Could not advance status.");
    load();
  };

  // Simulate moving the courier toward the relevant target (demo GPS update).
  const simulateMove = async () => {
    const target =
      status === "Courier En Route to Pickup" || status === "Courier Assigned"
        ? job.pickup
        : job.dropoff;
    const from = courierLoc ?? { lat: job.pickup.lat - 0.01, lng: job.pickup.lng - 0.01 };
    const lat = from.lat + (target.lat - from.lat) * 0.4;
    const lng = from.lng + (target.lng - from.lng) * 0.4;
    await deliveryApi.updateLocation(job._id, lat, lng);
    load();
  };

  const cancel = async () => {
    if (!confirm("Cancel this job?")) return;
    await deliveryApi.cancel(job._id, "Cancelled by courier");
    navigate("/courier/active");
  };

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background sm:my-4 sm:min-h-[calc(100dvh-2rem)] sm:rounded-3xl sm:border sm:border-border sm:shadow-sm">
      <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-border bg-card/90 px-3 py-3 backdrop-blur sm:rounded-t-3xl">
        <button onClick={() => navigate(-1)} className="flex size-9 items-center justify-center rounded-full hover:bg-muted">
          <ArrowLeft className="size-5" />
        </button>
        <div className="flex-1">
          <p className="text-sm font-bold text-foreground">Delivery job</p>
          <p className="text-xs text-muted-foreground">{formatMoney(job.estimated_cost, currencySymbol)} · {job.distance_km?.toFixed(1)} km</p>
        </div>
        <StatusPill status={job.status} />
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar">
        <LiveMap
          pickup={{ lat: job.pickup.lat, lng: job.pickup.lng }}
          dropoff={{ lat: job.dropoff.lat, lng: job.dropoff.lng }}
          courier={courierLoc}
          className="h-52 w-full rounded-none"
        />

        <div className="sticky top-[57px] z-20 flex gap-1 border-b border-border bg-card px-3 py-2">
          <TabBtn active={tab === "job"} onClick={() => setTab("job")}>
            Job
          </TabBtn>
          <TabBtn active={tab === "chat"} onClick={() => setTab("chat")}>
            <span className="flex items-center gap-1.5">
              <MessageCircle className="size-4" /> Chat
            </span>
          </TabBtn>
        </div>

        {tab === "job" ? (
          <div className="space-y-4 p-4">
            {/* Customer */}
            {job.customer && (
              <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
                <Avatar name={job.customer.username} />
                <div className="flex-1">
                  <p className="text-sm font-bold text-foreground">{job.customer.username}</p>
                  <p className="text-xs text-muted-foreground">Customer</p>
                </div>
                {job.dropoff?.contact_phone && (
                  <a href={`tel:${job.dropoff.contact_phone}`} className="flex size-9 items-center justify-center rounded-full bg-secondary/10 text-secondary">
                    <Phone className="size-4" />
                  </a>
                )}
              </div>
            )}

            {/* Route */}
            <div className="rounded-2xl border border-border bg-card p-4 text-sm">
              <RouteRow label="Pickup" addr={job.pickup} tone="primary" />
              <div className="my-2 ml-3 h-4 border-l-2 border-dashed border-border" />
              <RouteRow label="Drop-off" addr={job.dropoff} tone="accent" />
              <div className="mt-3 grid grid-cols-3 gap-2 border-t border-border/60 pt-3 text-center text-xs">
                <Meta label="Size" value={job.package_size} />
                <Meta label="Weight" value={`${job.package_weight} kg`} />
                <Meta label="Category" value={job.package_category} />
              </div>
              {job.special_instructions && (
                <p className="mt-3 rounded-lg bg-muted p-2.5 text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">Note:</span> {job.special_instructions}
                </p>
              )}
            </div>

            {/* Proof capture when required */}
            {needsPickupProof && (
              <ProofCapture jobId={job._id} kind="pickup" title="Confirm pickup" onSaved={load} />
            )}
            {needsDeliveryProof && (
              <ProofCapture jobId={job._id} kind="delivery" title="Confirm delivery" requireSignature onSaved={load} />
            )}

            {/* Timeline */}
            <div className="rounded-2xl border border-border bg-card p-4">
              <h3 className="mb-3 text-sm font-bold text-foreground">Progress</h3>
              <StatusTimeline current={job.status} events={job.timeline} />
            </div>

            {/* Actions */}
            {!isTerminalStatus(status) && (
              <div className="space-y-2">
                {(status === "Courier En Route to Pickup" || status === "In Transit" || status === "Courier Assigned") && (
                  <Button variant="outline" className="w-full gap-2" onClick={simulateMove}>
                    <Navigation className="size-4" /> Update my location
                  </Button>
                )}
                {next && (
                  <Button className="w-full gap-2" size="lg" onClick={advance} disabled={busy || needsPickupProof || needsDeliveryProof}>
                    {busy ? <Loader2 className="size-4 animate-spin" /> : <ChevronRight className="size-4" />}
                    {advanceLabel(status)}
                  </Button>
                )}
                <Button variant="ghost" className="w-full gap-2 text-destructive" onClick={cancel}>
                  <XCircle className="size-4" /> Cancel job
                </Button>
              </div>
            )}
            {status === "Delivered" && (
              <div className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
                <CheckCircle2 className="size-5" /> Delivered — {formatMoney(job.estimated_cost, currencySymbol)} earned
              </div>
            )}
          </div>
        ) : (
          <div className="p-4">
            <ChatPanel deliveryId={job._id} meId={account?.id ?? ""} className="h-[calc(100dvh-22rem)] min-h-[360px]" />
          </div>
        )}
      </main>
    </div>
  );
}

function advanceLabel(status: DeliveryStatus): string {
  switch (status) {
    case "Courier Assigned":
      return "Head to pickup";
    case "Courier En Route to Pickup":
      return "Mark package picked up";
    case "Package Picked Up":
      return "Start transit";
    case "In Transit":
      return "Arriving soon";
    case "Arriving Soon":
      return "Mark as delivered";
    default:
      return "Advance status";
  }
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={
        "flex-1 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors " +
        (active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")
      }
    >
      {children}
    </button>
  );
}

function RouteRow({ label, addr, tone }: { label: string; addr: any; tone: "primary" | "accent" }) {
  return (
    <div className="flex gap-3">
      <span className={"mt-0.5 size-3 shrink-0 rounded-full " + (tone === "primary" ? "bg-primary" : "bg-accent")} />
      <div>
        <p className="text-xs font-semibold text-muted-foreground">{label}</p>
        <p className="text-sm text-foreground">{addr.address}</p>
        {(addr.contact_name || addr.contact_phone) && (
          <p className="text-xs text-muted-foreground">
            {addr.contact_name} {addr.contact_phone && `· ${addr.contact_phone}`}
          </p>
        )}
      </div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-muted-foreground">{label}</p>
      <p className="font-semibold text-foreground">{value}</p>
    </div>
  );
}

function ProofCapture({
  jobId,
  kind,
  title,
  requireSignature,
  onSaved,
}: {
  jobId: string;
  kind: "pickup" | "delivery";
  title: string;
  requireSignature?: boolean;
  onSaved: () => void;
}) {
  const [photo, setPhoto] = useState("");
  const [signature, setSignature] = useState<string | null>(null);
  const [signedBy, setSignedBy] = useState("");
  const [saving, setSaving] = useState(false);

  const canSave = !!photo && (!requireSignature || (!!signature && !!signedBy.trim()));

  const save = async () => {
    setSaving(true);
    let signature_url: string | undefined;
    if (signature) {
      // Convert data URL → File → upload
      const blob = await (await fetch(signature)).blob();
      const file = new File([blob], "signature.png", { type: "image/png" });
      const up = await deliveryApi.upload(file);
      signature_url = up?.url;
    }
    await deliveryApi.saveProof(jobId, kind, { photo_url: photo, signature_url, signed_by: signedBy });
    setSaving(false);
    onSaved();
  };

  return (
    <div className="rounded-2xl border-2 border-accent/40 bg-accent/5 p-4">
      <h3 className="mb-3 flex items-center gap-1.5 text-sm font-bold text-foreground">
        <Camera className="size-4 text-accent-foreground" /> {title}
      </h3>
      <PhotoUploader label={kind === "pickup" ? "Photo of package at pickup" : "Photo of delivered package"} value={photo} onUploaded={setPhoto} />

      {requireSignature && (
        <div className="mt-3 space-y-2">
          <p className="text-xs font-semibold text-foreground">Recipient e-signature</p>
          <SignaturePad onChange={setSignature} />
          <Input value={signedBy} onChange={(e) => setSignedBy(e.target.value)} placeholder="Recipient name" />
        </div>
      )}

      <Button className="mt-3 w-full" onClick={save} disabled={!canSave || saving}>
        {saving && <Loader2 className="size-4 animate-spin" />} Save proof
      </Button>
    </div>
  );
}
