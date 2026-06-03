import { useEffect, useState, useCallback, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { Bell, LogOut } from "lucide-react";
import { BrandMark } from "./brand";
import { deliveryApi } from "~/lib/delivery/delivery.api";
import { apiRequest } from "~/lib/api.client";
import { cn } from "~/lib/utils";

export interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
}

interface NotificationItem {
  _id: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

export function AppShell({
  nav,
  title,
  children,
  headerRight,
}: {
  nav: NavItem[];
  title?: string;
  children: ReactNode;
  headerRight?: ReactNode;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const [notifs, setNotifs] = useState<NotificationItem[]>([]);
  const [open, setOpen] = useState(false);

  const loadNotifs = useCallback(async () => {
    const res = await deliveryApi.notifications();
    if (res.success && Array.isArray(res.data)) setNotifs(res.data as NotificationItem[]);
  }, []);

  useEffect(() => {
    loadNotifs();
    const t = setInterval(loadNotifs, 8000);
    return () => clearInterval(t);
  }, [loadNotifs]);

  const unread = notifs.filter((n) => !n.read).length;

  const toggleNotifs = async () => {
    const next = !open;
    setOpen(next);
    if (next && unread > 0) {
      await deliveryApi.markRead();
      setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
    }
  };

  const logout = async () => {
    await apiRequest("/api/auth/logout", { method: "POST" });
    navigate("/login");
    if (typeof window !== "undefined") window.location.href = "/login";
  };

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background shadow-sm sm:my-4 sm:min-h-[calc(100dvh-2rem)] sm:rounded-3xl sm:border sm:border-border">
      {/* Top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-border bg-card/90 px-4 py-3 backdrop-blur sm:rounded-t-3xl">
        <div className="flex items-center gap-2">
          <BrandMark iconOnly className="sm:hidden" />
          {title ? (
            <span className="text-base font-bold text-foreground">{title}</span>
          ) : (
            <BrandMark className="hidden sm:flex" />
          )}
        </div>
        <div className="flex items-center gap-1">
          {headerRight}
          <div className="relative">
            <button
              onClick={toggleNotifs}
              className="relative flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
              aria-label="Notifications"
            >
              <Bell className="size-5" />
              {unread > 0 && (
                <span className="absolute right-1.5 top-1.5 flex size-2 rounded-full bg-accent ring-2 ring-card" />
              )}
            </button>
            {open && (
              <div className="absolute right-0 top-11 z-40 w-72 overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
                <div className="border-b border-border px-4 py-2.5 text-sm font-semibold">Notifications</div>
                <div className="max-h-80 overflow-y-auto no-scrollbar">
                  {notifs.length === 0 && (
                    <p className="px-4 py-6 text-center text-sm text-muted-foreground">You're all caught up.</p>
                  )}
                  {notifs.map((n) => (
                    <div key={n._id} className="border-b border-border/60 px-4 py-2.5 last:border-0">
                      <p className="text-sm font-medium text-foreground">{n.title}</p>
                      {n.body && <p className="text-xs text-muted-foreground">{n.body}</p>}
                      <p className="mt-0.5 text-[10px] text-muted-foreground tabular-nums">
                        {new Date(n.createdAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <button
            onClick={logout}
            className="flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
            aria-label="Log out"
          >
            <LogOut className="size-5" />
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto px-4 pb-28 pt-4 no-scrollbar">{children}</main>

      {/* Bottom nav */}
      <nav className="sticky bottom-0 z-30 grid border-t border-border bg-card/95 backdrop-blur sm:rounded-b-3xl"
        style={{ gridTemplateColumns: `repeat(${nav.length}, minmax(0, 1fr))` }}
      >
        {nav.map((item) => {
          const active = location.pathname === item.to || location.pathname.startsWith(item.to + "/");
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <span className={cn("flex items-center justify-center", active && "[&_svg]:stroke-[2.4]")}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
