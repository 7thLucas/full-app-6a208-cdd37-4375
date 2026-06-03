import { Router } from "express";
import { requireAuth, requireAdmin } from "~/modules/authentication/authentication.middleware";
import { attachAppRole, requireAppRole } from "./delivery.guards";
import { ok, created, fail } from "~/api/lib/api-response";
import { DeliveryService } from "./delivery.service";
import { CourierService } from "./courier.service";
import { AdminService } from "./admin.service";
import { AccountService } from "./account.service";
import type { DeliveryStatus, PackageSize } from "~/lib/delivery/delivery.shared";

const router = Router();

function handle(fn: (req: any, res: any) => Promise<void>) {
  return async (req: any, res: any) => {
    try {
      await fn(req, res);
    } catch (e: any) {
      fail(res, e.message ?? "Something went wrong", e.statusCode ?? 500);
    }
  };
}

// ── Account / role ────────────────────────────────────────────────────────────
router.get("/account/me", requireAuth, handle(async (req, res) => {
  ok(res, await AccountService.me(req.user.id));
}));

router.post("/account/role", requireAuth, handle(async (req, res) => {
  const role = req.body?.role;
  if (role !== "customer" && role !== "courier") return fail(res, "Invalid role");
  ok(res, await AccountService.setAppRole(req.user.id, role));
}));

// ── Pricing quote (any authenticated user) ──────────────────────────────────────
router.post("/deliveries/quote", requireAuth, handle(async (req, res) => {
  const { pickup, dropoff, package_size } = req.body ?? {};
  if (!pickup || !dropoff) return fail(res, "pickup and dropoff are required");
  ok(res, await DeliveryService.quote({ pickup, dropoff, package_size: (package_size ?? "Medium") as PackageSize }));
}));

router.get("/pricing", requireAuth, handle(async (_req, res) => {
  ok(res, await DeliveryService.getPricing());
}));

// ── Customer ────────────────────────────────────────────────────────────────────
router.post(
  "/deliveries",
  requireAuth,
  requireAppRole("customer", "admin"),
  handle(async (req, res) => {
    created(res, await DeliveryService.createDelivery(req.user.id, req.body));
  }),
);

router.get(
  "/deliveries/mine",
  requireAuth,
  requireAppRole("customer", "admin"),
  handle(async (req, res) => {
    const list = await DeliveryService.listForCustomer(req.user.id);
    ok(res, await DeliveryService.enrich(list));
  }),
);

router.post(
  "/deliveries/:id/rate",
  requireAuth,
  requireAppRole("customer", "admin"),
  handle(async (req, res) => {
    const { stars, comment } = req.body ?? {};
    ok(res, await DeliveryService.rate(req.params.id, req.user.id, Number(stars), comment ?? ""));
  }),
);

// ── Courier: profile & availability ───────────────────────────────────────────────
router.get("/courier/profile", requireAuth, handle(async (req, res) => {
  ok(res, await CourierService.getOrCreateProfile(req.user.id));
}));

router.put("/courier/profile", requireAuth, handle(async (req, res) => {
  await AccountService.setAppRole(req.user.id, "courier");
  ok(res, await CourierService.updateProfile(req.user.id, req.body));
}));

router.post("/courier/online", requireAuth, handle(async (req, res) => {
  ok(res, await CourierService.setOnline(req.user.id, !!req.body?.online));
}));

router.get("/courier/ratings", requireAuth, handle(async (req, res) => {
  ok(res, await CourierService.ratingsFor(req.user.id));
}));

// ── Courier: jobs ────────────────────────────────────────────────────────────────
router.get("/courier/jobs/available", requireAuth, handle(async (_req, res) => {
  const list = await DeliveryService.availableJobs();
  ok(res, await DeliveryService.enrich(list));
}));

router.get("/courier/jobs/mine", requireAuth, handle(async (req, res) => {
  const list = await DeliveryService.listForCourier(req.user.id);
  ok(res, await DeliveryService.enrich(list));
}));

router.post("/courier/jobs/:id/accept", requireAuth, handle(async (req, res) => {
  ok(res, await DeliveryService.acceptJob(req.params.id, req.user.id));
}));

router.post("/courier/jobs/:id/advance", requireAuth, handle(async (req, res) => {
  ok(res, await DeliveryService.advanceStatus(req.params.id, req.user.id));
}));

router.post("/courier/jobs/:id/status", requireAuth, handle(async (req, res) => {
  ok(res, await DeliveryService.setStatus(req.params.id, req.user.id, req.body?.status as DeliveryStatus));
}));

router.post("/courier/jobs/:id/location", requireAuth, handle(async (req, res) => {
  const { lat, lng } = req.body ?? {};
  ok(res, await DeliveryService.updateCourierLocation(req.params.id, req.user.id, Number(lat), Number(lng)));
}));

router.post("/courier/jobs/:id/proof/:kind", requireAuth, handle(async (req, res) => {
  const kind = req.params.kind === "delivery" ? "delivery" : "pickup";
  ok(res, await DeliveryService.saveProof(req.params.id, req.user.id, kind, req.body ?? {}));
}));

// ── Shared: single delivery, cancel, chat, disputes ──────────────────────────────────
router.get("/deliveries/:id", requireAuth, handle(async (req, res) => {
  const d = await DeliveryService.getById(req.params.id);
  const [enriched] = await DeliveryService.enrich([d]);
  ok(res, enriched);
}));

router.post("/deliveries/:id/cancel", requireAuth, handle(async (req, res) => {
  ok(res, await DeliveryService.cancel(req.params.id, req.user.id, req.body?.reason ?? ""));
}));

router.get("/deliveries/:id/messages", requireAuth, handle(async (req, res) => {
  ok(res, await DeliveryService.listMessages(req.params.id, req.user.id));
}));

router.post("/deliveries/:id/messages", requireAuth, handle(async (req, res) => {
  created(res, await DeliveryService.sendMessage(req.params.id, req.user.id, req.body?.body ?? ""));
}));

router.post("/deliveries/:id/dispute", requireAuth, attachAppRole, handle(async (req, res) => {
  created(
    res,
    await AdminService.createDispute(req.params.id, req.user.id, req.appRole ?? "customer", req.body?.reason ?? ""),
  );
}));

// ── Notifications ─────────────────────────────────────────────────────────────────
router.get("/notifications", requireAuth, handle(async (req, res) => {
  ok(res, await DeliveryService.listNotifications(req.user.id));
}));

router.post("/notifications/read", requireAuth, handle(async (req, res) => {
  ok(res, await DeliveryService.markNotificationsRead(req.user.id));
}));

// ── Admin ──────────────────────────────────────────────────────────────────────────
router.get("/admin/users", requireAdmin, handle(async (req, res) => {
  ok(res, await AdminService.listUsers(req.query.role as any));
}));

router.get("/admin/couriers", requireAdmin, handle(async (_req, res) => {
  ok(res, await AdminService.listCouriers());
}));

router.post("/admin/couriers/:userId/verify", requireAdmin, handle(async (req, res) => {
  ok(res, await AdminService.setCourierVerification(req.params.userId, req.body?.status));
}));

router.post("/admin/users/:id/active", requireAdmin, handle(async (req, res) => {
  ok(res, await AdminService.setUserActive(req.params.id, !!req.body?.active));
}));

router.get("/admin/deliveries", requireAdmin, handle(async (_req, res) => {
  const list = await AdminService.allDeliveries();
  ok(res, await DeliveryService.enrich(list));
}));

router.get("/admin/deliveries/active", requireAdmin, handle(async (_req, res) => {
  const list = await AdminService.activeDeliveries();
  ok(res, await DeliveryService.enrich(list));
}));

router.get("/admin/disputes", requireAdmin, handle(async (_req, res) => {
  ok(res, await AdminService.listDisputes());
}));

router.post("/admin/disputes/:id/resolve", requireAdmin, handle(async (req, res) => {
  ok(res, await AdminService.resolveDispute(req.params.id, req.body?.resolution ?? ""));
}));

router.get("/admin/pricing", requireAdmin, handle(async (_req, res) => {
  ok(res, await DeliveryService.getPricing());
}));

router.put("/admin/pricing", requireAdmin, handle(async (req, res) => {
  ok(res, await DeliveryService.updatePricing(req.body ?? {}));
}));

router.get("/admin/analytics", requireAdmin, handle(async (_req, res) => {
  ok(res, await AdminService.analytics());
}));

export default router;
