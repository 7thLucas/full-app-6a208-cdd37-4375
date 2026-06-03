import { useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { MapPin, Camera, PenLine, Zap, ArrowRight, ShieldCheck } from "lucide-react";
import { useConfigurables } from "~/modules/configurables";
import { useAccount } from "~/lib/delivery/use-account";
import { BrandMark } from "~/components/delivery/brand";
import { Button } from "~/components/ui/button";
import { LiveMap } from "~/components/delivery/live-map";

const ICONS = [MapPin, Camera, PenLine, Zap];

export default function IndexPage() {
  const { config } = useConfigurables();
  const { account, loading } = useAccount();
  const navigate = useNavigate();

  // Logged-in users go straight to their workspace.
  useEffect(() => {
    if (loading || !account) return;
    const home =
      account.appRole === "courier" ? "/courier" : account.appRole === "admin" ? "/admin" : "/app";
    navigate(home, { replace: true });
  }, [account, loading, navigate]);

  const features = config?.trustFeatures ?? [];

  return (
    <div className="min-h-dvh bg-background">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
        <BrandMark />
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link to="/login">Log in</Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/register">Get started</Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-5 pb-8 pt-6 sm:pt-12">
        <div className="grid items-center gap-8 sm:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/10 px-3 py-1 text-xs font-semibold text-secondary">
              <ShieldCheck className="size-3.5" /> {config?.tagline ?? "Verifiable delivery"}
            </span>
            <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-4xl">
              {config?.heroTitle ?? "Send packages with a live trust layer."}
            </h1>
            <p className="mt-3 text-base text-muted-foreground">
              {config?.heroSubtitle ??
                "Real-time tracking, photo proof at pickup and drop-off, and e-signature on receipt."}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild size="lg" className="gap-2">
                <Link to="/register">
                  {config?.heroCtaLabel ?? "Send a package"} <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/register?role=courier">Become a courier</Link>
              </Button>
            </div>
          </div>
          <div className="relative">
            <LiveMap
              pickup={{ lat: 40.7411, lng: -73.9897 }}
              dropoff={{ lat: 40.7794, lng: -73.9632 }}
              courier={{ lat: 40.7601, lng: -73.972 }}
              className="aspect-square w-full shadow-lg sm:aspect-[4/5]"
            />
            <div className="absolute bottom-3 left-3 right-3 rounded-2xl bg-card/95 p-3 shadow-md backdrop-blur">
              <p className="text-xs font-semibold text-secondary">In Transit · 2.4 km to go</p>
              <p className="text-sm font-medium text-foreground">Courier is on the move</p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust features */}
      <section className="mx-auto max-w-5xl px-5 py-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => {
            const Icon = ICONS[i % ICONS.length];
            return (
              <div key={i} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-3 text-sm font-bold text-foreground">{f.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{f.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-5xl px-5 py-8">
        <h2 className="text-center text-xl font-bold text-foreground">How it works</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {[
            { n: "1", t: "Request", d: "Enter pickup & drop-off, package details, and see your estimated cost instantly." },
            { n: "2", t: "Track", d: "A nearby courier accepts and you watch the handoff happen on a live map." },
            { n: "3", t: "Verify", d: "Photo proof at both ends and an e-signature on receipt close the loop." },
          ].map((s) => (
            <div key={s.n} className="rounded-2xl bg-card p-5 shadow-sm">
              <span className="flex size-8 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground">
                {s.n}
              </span>
              <h3 className="mt-3 font-bold text-foreground">{s.t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        {config?.footerText ?? "Pakettt! — verifiable package delivery."}
      </footer>
    </div>
  );
}
