import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import {
  ArrowLeft,
  MessageCircle,
  Phone,
  XCircle,
  Star,
  Camera,
  PenLine,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { RoleGate, FullScreenLoader } from "~/components/delivery/guards";
import { LiveMap } from "~/components/delivery/live-map";
import { StatusPill } from "~/components/delivery/status-pill";
import { StatusTimeline } from "~/components/delivery/status-timeline";
import { ChatPanel } from "~/components/delivery/chat-panel";
import { RatingStars } from "~/components/delivery/rating-stars";
import { useBrand } from "~/components/delivery/brand";
import { useAccount } from "~/lib/delivery/use-account";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { Avatar } from "~/components/ui/avatar";
import { deliveryApi } from "~/lib/delivery/delivery.api";
import { formatMoney, isTerminalStatus } from "~/lib/delivery/delivery.shared";

export default function TrackPage() {
  return (
    <RoleGate allow={["customer", "admin"]}>
      <TrackContent />
    </RoleGate>
  );
}

function TrackContent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { account } = useAccount();
  const { currencySymbol } = useBrand();
  const [delivery, setDelivery] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"track" | "chat">("track");
  const [showRate, setShowRate] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    const res = await deliveryApi.getDelivery(id);
    if (res.success) setDelivery(res.data);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [load]);

  if (loading) return <FullScreenLoader />;
  if (!delivery)
    return (
      <div className="flex min-h-dvh items-center justify-center text-sm text-muted-foreground">Delivery not found.</div>
    );

  const courierLoc =
    delivery.courier_lat != null && delivery.courier_lng != null
      ? { lat: delivery.courier_lat, lng: delivery.courier_lng }
      : null;
  const canCancel = !isTerminalStatus(delivery.status);
  const canRate = delivery.status === "Delivered" && !delivery.customer_rated;

  const cancel = async () => {
    if (!confirm("Cancel this delivery?")) return;
    await deliveryApi.cancel(delivery._id, "Cancelled by customer");
    load();
  };

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background sm:my-4 sm:min-h-[calc(100dvh-2rem)] sm:rounded-3xl sm:border sm:border-border sm:shadow-sm">
      {/* Header */}
      <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-border bg-card/90 px-3 py-3 backdrop-blur sm:rounded-t-3xl">
        <button onClick={() => navigate(-1)} className="flex size-9 items-center justify-center rounded-full hover:bg-muted">
          <ArrowLeft className="size-5" />
        </button>
        <div className="flex-1">
          <p className="text-sm font-bold text-foreground">Track delivery</p>
          <p className="text-xs text-muted-foreground">
            {delivery.package_category} · {formatMoney(delivery.estimated_cost, currencySymbol)}
          </p>
        </div>
        <StatusPill status={delivery.status} />
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar">
        {/* Map */}
        <div className="relative">
          <LiveMap
            pickup={{ lat: delivery.pickup.lat, lng: delivery.pickup.lng }}
            dropoff={{ lat: delivery.dropoff.lat, lng: delivery.dropoff.lng }}
            courier={courierLoc}
            className="h-56 w-full rounded-none sm:rounded-none"
          />
        </div>

        {/* Tabs */}
        <div className="sticky top-[57px] z-20 flex gap-1 border-b border-border bg-card px-3 py-2">
          <TabBtn active={tab === "track"} onClick={() => setTab("track")}>
            Tracking
          </TabBtn>
          <TabBtn active={tab === "chat"} onClick={() => setTab("chat")} disabled={!delivery.courier_id}>
            <span className="flex items-center gap-1.5">
              <MessageCircle className="size-4" /> Chat
            </span>
          </TabBtn>
        </div>

        {tab === "track" ? (
          <div className="space-y-4 p-4">
            {/* Courier card */}
            {delivery.courier ? (
              <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
                <Avatar name={delivery.courier.profile?.full_name || delivery.courier.user?.username} />
                <div className="flex-1">
                  <p className="text-sm font-bold text-foreground">
                    {delivery.courier.profile?.full_name || delivery.courier.user?.username || "Courier"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {delivery.courier.profile?.vehicle_type} · ★ {(delivery.courier.profile?.rating_avg ?? 0).toFixed(1)}
                  </p>
                </div>
                {delivery.courier.profile?.phone && (
                  <a
                    href={`tel:${delivery.courier.profile.phone}`}
                    className="flex size-9 items-center justify-center rounded-full bg-secondary/10 text-secondary"
                  >
                    <Phone className="size-4" />
                  </a>
                )}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border bg-card/50 p-4 text-center text-sm text-muted-foreground">
                Searching for a nearby courier…
              </div>
            )}

            {/* Proof */}
            {(delivery.pickup_proof?.photo_url || delivery.delivery_proof?.photo_url) && (
              <ProofSection delivery={delivery} />
            )}

            {/* Timeline */}
            <div className="rounded-2xl border border-border bg-card p-4">
              <h3 className="mb-3 text-sm font-bold text-foreground">Status timeline</h3>
              <StatusTimeline current={delivery.status} events={delivery.timeline} />
            </div>

            {/* Route detail */}
            <div className="rounded-2xl border border-border bg-card p-4 text-sm">
              <RouteRow label="Pickup" addr={delivery.pickup} tone="primary" />
              <div className="my-2 ml-3 h-4 border-l-2 border-dashed border-border" />
              <RouteRow label="Drop-off" addr={delivery.dropoff} tone="accent" />
              {delivery.special_instructions && (
                <p className="mt-3 rounded-lg bg-muted p-2.5 text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">Note:</span> {delivery.special_instructions}
                </p>
              )}
            </div>

            {/* Actions */}
            {canRate && (
              <Button className="w-full gap-2" onClick={() => setShowRate(true)}>
                <Star className="size-4" /> Rate this delivery
              </Button>
            )}
            {canCancel && (
              <Button variant="outline" className="w-full gap-2 text-destructive" onClick={cancel}>
                <XCircle className="size-4" /> Cancel delivery
              </Button>
            )}
            {isTerminalStatus(delivery.status) && (
              <DisputeButton deliveryId={delivery._id} />
            )}
          </div>
        ) : (
          <div className="p-4">
            <ChatPanel deliveryId={delivery._id} meId={account?.id ?? ""} className="h-[calc(100dvh-22rem)] min-h-[360px]" />
          </div>
        )}
      </main>

      {showRate && (
        <RateSheet
          deliveryId={delivery._id}
          courierName={delivery.courier?.profile?.full_name || delivery.courier?.user?.username || "your courier"}
          onClose={() => setShowRate(false)}
          onDone={() => {
            setShowRate(false);
            load();
          }}
        />
      )}
    </div>
  );
}

function TabBtn({ active, onClick, disabled, children }: { active: boolean; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={
        "flex-1 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors disabled:opacity-40 " +
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

function ProofSection({ delivery }: { delivery: any }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <h3 className="mb-3 flex items-center gap-1.5 text-sm font-bold text-foreground">
        <Camera className="size-4 text-accent-foreground" /> Proof of delivery
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {delivery.pickup_proof?.photo_url && (
          <Proof title="Pickup" url={delivery.pickup_proof.photo_url} signed={delivery.pickup_proof.signed_by} />
        )}
        {delivery.delivery_proof?.photo_url && (
          <Proof title="Drop-off" url={delivery.delivery_proof.photo_url} signed={delivery.delivery_proof.signed_by} sig={delivery.delivery_proof.signature_url} />
        )}
      </div>
    </div>
  );
}

function Proof({ title, url, signed, sig }: { title: string; url: string; signed?: string; sig?: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold text-muted-foreground">{title}</p>
      <img src={url} alt={title} className="aspect-[4/3] w-full rounded-lg object-cover" />
      {sig && (
        <div className="rounded-lg border border-border bg-white p-1">
          <img src={sig} alt="signature" className="h-10 w-full object-contain" />
        </div>
      )}
      {signed && (
        <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <PenLine className="size-3" /> {signed}
        </p>
      )}
    </div>
  );
}

function RateSheet({ deliveryId, courierName, onClose, onDone }: { deliveryId: string; courierName: string; onClose: () => void; onDone: () => void }) {
  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    await deliveryApi.rate(deliveryId, stars, comment);
    setSaving(false);
    onDone();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-t-3xl bg-card p-6 shadow-xl sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-foreground">Rate {courierName}</h3>
        <p className="mb-4 text-sm text-muted-foreground">How was your delivery experience?</p>
        <div className="flex justify-center py-2">
          <RatingStars value={stars} onChange={setStars} size="lg" />
        </div>
        <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add a comment (optional)" className="mt-3" />
        <div className="mt-4 flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button className="flex-1" onClick={submit} disabled={saving}>
            {saving && <Loader2 className="size-4 animate-spin" />} Submit
          </Button>
        </div>
      </div>
    </div>
  );
}

function DisputeButton({ deliveryId }: { deliveryId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [sent, setSent] = useState(false);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!reason.trim()) return;
    setSaving(true);
    await deliveryApi.raiseDispute(deliveryId, reason);
    setSaving(false);
    setSent(true);
  };

  if (sent) return <p className="text-center text-sm text-secondary">Your report was submitted. Our team will review it.</p>;

  return (
    <>
      <Button variant="ghost" className="w-full gap-2 text-muted-foreground" onClick={() => setOpen(!open)}>
        <AlertTriangle className="size-4" /> Report an issue
      </Button>
      {open && (
        <div className="space-y-2 rounded-2xl border border-border bg-card p-3">
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Describe the issue…" rows={3} />
          <Button size="sm" className="w-full" onClick={submit} disabled={saving || !reason.trim()}>
            {saving && <Loader2 className="size-4 animate-spin" />} Submit report
          </Button>
        </div>
      )}
    </>
  );
}
