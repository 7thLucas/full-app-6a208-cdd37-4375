import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { Loader2 } from "lucide-react";
import { apiRequest } from "~/lib/api.client";
import { deliveryApi } from "~/lib/delivery/delivery.api";
import { BrandMark } from "~/components/delivery/brand";
import { useBrand } from "~/components/delivery/brand";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

const DEMO = [
  { label: "Customer", email: "alice@demo.pakettt" },
  { label: "Courier", email: "carlos@demo.pakettt" },
  { label: "Admin", email: "admin@example.com" },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiRequest("/api/auth/me").then((res) => {
      if (res.success) routeHome();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const routeHome = async () => {
    const me = await deliveryApi.me();
    const role = me.data?.appRole;
    navigate(role === "courier" ? "/courier" : role === "admin" ? "/admin" : "/app", { replace: true });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await apiRequest("/api/auth/login", { method: "POST", data: { email, password } });
    setLoading(false);
    if (res.success) {
      await routeHome();
    } else {
      setError(res.message || "Invalid credentials");
    }
  };

  const { tagline } = useBrand();

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <BrandMark />
          <p className="mt-2 text-sm text-muted-foreground">{tagline}</p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <h1 className="text-lg font-bold text-foreground">Welcome back</h1>
          <p className="mb-4 text-sm text-muted-foreground">Log in to your account.</p>

          <form onSubmit={submit} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="size-4 animate-spin" />} Log in
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            New here?{" "}
            <Link to="/register" className="font-semibold text-primary hover:underline">
              Create an account
            </Link>
          </p>
        </div>

        <div className="mt-5 rounded-2xl border border-dashed border-border bg-muted/40 p-4">
          <p className="mb-2 text-xs font-semibold text-foreground">Demo accounts (password: Password123!)</p>
          <div className="flex flex-wrap gap-2">
            {DEMO.map((d) => (
              <button
                key={d.email}
                type="button"
                onClick={() => {
                  setEmail(d.email);
                  setPassword(d.email === "admin@example.com" ? "ChangeMe123!" : "Password123!");
                }}
                className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-foreground hover:bg-muted"
              >
                {d.label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">Admin password: ChangeMe123!</p>
        </div>
      </div>
    </div>
  );
}
