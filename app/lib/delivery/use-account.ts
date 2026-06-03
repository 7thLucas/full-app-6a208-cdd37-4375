import { useEffect, useState, useCallback } from "react";
import { useAuth } from "~/modules/authentication";
import { deliveryApi } from "./delivery.api";
import type { AppRole } from "./delivery.shared";

export interface AccountInfo {
  id: string;
  username: string;
  email: string;
  appRole: AppRole;
  is_active: boolean;
}

export function useAccount() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setAccount(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const res = await deliveryApi.me();
    setAccount(res.success && res.data ? (res.data as AccountInfo) : null);
    setLoading(false);
  }, [isAuthenticated]);

  useEffect(() => {
    if (authLoading) return;
    refresh();
  }, [authLoading, refresh]);

  return { account, loading: loading || authLoading, refresh };
}
