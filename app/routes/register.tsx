import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { Loader2, Package, Bike } from "lucide-react";
import { apiRequest } from "~/lib/api.client";
import { deliveryApi } from "~/lib/delivery/delivery.api";
import { BrandMark } from "~/components/delivery/brand";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { cn } from "~/lib/utils";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [role, setRole] = useState<"customer" | "courier">(
    params.get("role") === "courier" ? "courier" : "customer",
  );
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiRequest("/api/auth/me").then(async (res) => {
      if (res.success) {
        const me = await deliveryApi.me();
        const r = me.data?.appRole;
        navigate(r === "courier" ? "/courier" : r === "admin" ? "/admin" : "/app", { replace: true });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await apiRequest("/api/auth/register", {
      method: "POST",
      data: { username, email, password },
    });
    if (!res.success) {
      setLoading(false);
      setError(res.message || "Registration failed");
      return;
    }
    await deliveryApi.setRole(role);
    setLoading(false);
    navigate(role === "courier" ? "/courier/verify" : "/app", { replace: true });
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <BrandMark />
          <p className="mt-2 text-sm text-muted-foreground">Create your account in seconds.</p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <Label className="text-xs">I want to</Label>
          <div className="mb-4 mt-1.5 grid grid-cols-2 gap-2">
            <RoleOption
              active={role === "customer"}
              onClick={() => setRole("customer")}
              icon={<Package className="size-5" />}
              title="Send packages"
              subtitle="I'm a customer"
            />
            <RoleOption
              active={role === "courier"}
              onClick={() => setRole("courier")}
              icon={<Bike className="size-5" />}
              title="Deliver & earn"
              subtitle="I'm a courier"
            />
          </div>

          <form onSubmit={submit} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="username">Name</Label>
              <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} required placeholder="Your name" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="At least 6 characters" minLength={6} />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="size-4 animate-spin" />} Create account
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-primary hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function RoleOption({
  active,
  onClick,
  icon,
  title,
  subtitle,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-start gap-1 rounded-2xl border-2 p-3 text-left transition-colors",
        active ? "border-primary bg-primary/5" : "border-border bg-card hover:bg-muted",
      )}
    >
      <span className={cn("flex size-9 items-center justify-center rounded-xl", active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
        {icon}
      </span>
      <span className="text-sm font-bold text-foreground">{title}</span>
      <span className="text-xs text-muted-foreground">{subtitle}</span>
    </button>
  );
}
