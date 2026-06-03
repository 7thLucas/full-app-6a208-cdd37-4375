import { useEffect, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { Loader2 } from "lucide-react";
import { useAccount } from "~/lib/delivery/use-account";
import type { AppRole } from "~/lib/delivery/delivery.shared";

export function FullScreenLoader() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background">
      <Loader2 className="size-7 animate-spin text-primary" />
    </div>
  );
}

/**
 * Gate a page by app-role. Redirects unauthenticated users to /login and
 * wrong-role users to their own home.
 */
export function RoleGate({ allow, children }: { allow: AppRole[]; children: ReactNode }) {
  const { account, loading } = useAccount();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!account) {
      navigate("/login", { replace: true });
      return;
    }
    if (!allow.includes(account.appRole)) {
      const home =
        account.appRole === "courier" ? "/courier" : account.appRole === "admin" ? "/admin" : "/app";
      navigate(home, { replace: true });
    }
  }, [account, loading, allow, navigate]);

  if (loading) return <FullScreenLoader />;
  if (!account || !allow.includes(account.appRole)) return <FullScreenLoader />;
  return <>{children}</>;
}
