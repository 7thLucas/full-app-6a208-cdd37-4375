import { DeliveryModel } from "./models/delivery.model";
import { CourierProfileModel } from "./models/courier-profile.model";
import { DeliveryMessageModel } from "./models/message.model";
import { DeliveryRatingModel } from "./models/rating.model";
import { PricingRuleModel } from "./models/pricing-rule.model";
import { NotificationModel } from "./models/notification.model";
import { UserModel } from "~/modules/authentication/authentication.model";
import {
  DELIVERY_STATUSES,
  FORWARD_STATUS_FLOW,
  estimatePrice,
  haversineKm,
  nextStatus,
  type DeliveryStatus,
  type PackageSize,
  type PricingRules,
} from "~/lib/delivery/delivery.shared";

function err(message: string, statusCode = 400): Error {
  return Object.assign(new Error(message), { statusCode });
}

async function notify(userId: string, title: string, body: string, deliveryId = "") {
  if (!userId) return;
  await NotificationModel.create({ user_id: userId, title, body, delivery_id: deliveryId });
}

export class DeliveryService {
  // ── Pricing ───────────────────────────────────────────────────────────────
  static async getPricing(): Promise<PricingRules> {
    let doc = await PricingRuleModel.findOne({ _singleton: true });
    if (!doc) {
      doc = await PricingRuleModel.create({ _singleton: true });
    }
    return {
      baseFare: doc.base_fare,
      perKmRate: doc.per_km_rate,
      currencySymbol: doc.currency_symbol,
    };
  }

  static async updatePricing(input: Partial<PricingRules>): Promise<PricingRules> {
    const doc =
      (await PricingRuleModel.findOne({ _singleton: true })) ??
      (await PricingRuleModel.create({ _singleton: true }));
    if (typeof input.baseFare === "number") doc.base_fare = input.baseFare;
    if (typeof input.perKmRate === "number") doc.per_km_rate = input.perKmRate;
    if (typeof input.currencySymbol === "string") doc.currency_symbol = input.currencySymbol;
    await doc.save();
    return {
      baseFare: doc.base_fare,
      perKmRate: doc.per_km_rate,
      currencySymbol: doc.currency_symbol,
    };
  }

  static async quote(input: {
    pickup: { lat: number; lng: number };
    dropoff: { lat: number; lng: number };
    package_size: PackageSize;
  }): Promise<{ distance_km: number; estimated_cost: number; pricing: PricingRules }> {
    const pricing = await this.getPricing();
    const distance_km = Math.round(haversineKm(input.pickup, input.dropoff) * 100) / 100;
    const estimated_cost = estimatePrice(distance_km, input.package_size, pricing);
    return { distance_km, estimated_cost, pricing };
  }

  // ── Customer: create + read ─────────────────────────────────────────────────
  static async createDelivery(customerId: string, body: any) {
    const { pickup, dropoff, package_size, package_weight, package_category, special_instructions } =
      body;
    if (!pickup?.address || !dropoff?.address) throw err("Pickup and drop-off addresses are required");
    if (typeof pickup.lat !== "number" || typeof dropoff.lat !== "number")
      throw err("Pickup and drop-off coordinates are required");

    const { distance_km, estimated_cost } = await this.quote({
      pickup,
      dropoff,
      package_size: package_size ?? "Medium",
    });

    const now = new Date();
    const delivery = await DeliveryModel.create({
      customer_id: customerId,
      status: "Searching for Courier",
      pickup,
      dropoff,
      package_size: package_size ?? "Medium",
      package_weight: package_weight ?? 1,
      package_category: package_category ?? "Other",
      special_instructions: special_instructions ?? "",
      distance_km,
      estimated_cost,
      timeline: [
        { status: "Pending", at: now, note: "Request created" },
        { status: "Searching for Courier", at: now, note: "Looking for a nearby courier" },
      ],
    });
    return delivery.toObject();
  }

  static async listForCustomer(customerId: string) {
    return DeliveryModel.find({ customer_id: customerId, deletedAt: null }).sort({ createdAt: -1 }).lean();
  }

  static async getById(id: string) {
    const d = await DeliveryModel.findById(id).lean();
    if (!d) throw err("Delivery not found", 404);
    return d;
  }

  static async cancel(id: string, userId: string, reason: string) {
    const d = await DeliveryModel.findById(id);
    if (!d) throw err("Delivery not found", 404);
    if (d.customer_id !== userId && d.courier_id !== userId) throw err("Forbidden", 403);
    if (d.status === "Delivered" || d.status === "Cancelled")
      throw err("Delivery can no longer be cancelled");
    d.status = "Cancelled";
    d.cancel_reason = reason ?? "";
    d.timeline.push({ status: "Cancelled", at: new Date(), note: reason ?? "" } as any);
    await d.save();
    if (d.courier_id) await notify(d.courier_id, "Delivery cancelled", "A delivery was cancelled.", id);
    await notify(d.customer_id, "Delivery cancelled", "Your delivery was cancelled.", id);
    return d.toObject();
  }

  // ── Courier: jobs ────────────────────────────────────────────────────────────
  static async availableJobs() {
    return DeliveryModel.find({ status: "Searching for Courier", courier_id: null, deletedAt: null })
      .sort({ createdAt: -1 })
      .lean();
  }

  static async listForCourier(courierId: string) {
    return DeliveryModel.find({ courier_id: courierId, deletedAt: null }).sort({ createdAt: -1 }).lean();
  }

  static async acceptJob(deliveryId: string, courierId: string) {
    const profile = await CourierProfileModel.findOne({ user_id: courierId });
    if (!profile) throw err("Complete your courier profile first", 400);
    if (profile.verification_status !== "verified")
      throw err("Your courier account is awaiting verification", 403);

    const d = await DeliveryModel.findOneAndUpdate(
      { _id: deliveryId, status: "Searching for Courier", courier_id: null },
      {
        $set: { courier_id: courierId, status: "Courier Assigned" },
        $push: { timeline: { status: "Courier Assigned", at: new Date(), note: "Courier accepted the job" } },
      },
      { new: true },
    );
    if (!d) throw err("This job is no longer available");
    await notify(d.customer_id, "Courier found", "A courier accepted your delivery.", deliveryId);
    return d.toObject();
  }

  static async advanceStatus(deliveryId: string, courierId: string) {
    const d = await DeliveryModel.findById(deliveryId);
    if (!d) throw err("Delivery not found", 404);
    if (d.courier_id !== courierId) throw err("Forbidden", 403);
    const next = nextStatus(d.status as DeliveryStatus);
    if (!next) throw err("No further status to advance to");

    // Gate proof requirements
    if (next === "In Transit" && !d.pickup_proof?.photo_url)
      throw err("Upload pickup proof photo before starting transit");
    if (d.status === "Arriving Soon" && next === "Delivered" && !d.delivery_proof?.photo_url)
      throw err("Upload delivery proof photo before marking delivered");

    d.status = next;
    d.timeline.push({ status: next, at: new Date(), note: "" } as any);
    if (next === "Delivered" && d.delivery_proof) d.delivery_proof.at = new Date();
    await d.save();

    await notify(d.customer_id, `Delivery update: ${next}`, `Your package is now: ${next}.`, deliveryId);

    if (next === "Delivered" && d.courier_id) {
      const profile = await CourierProfileModel.findOne({ user_id: d.courier_id });
      if (profile) {
        profile.total_earnings = Math.round((profile.total_earnings + d.estimated_cost) * 100) / 100;
        profile.completed_deliveries += 1;
        await profile.save();
      }
    }
    return d.toObject();
  }

  static async setStatus(deliveryId: string, courierId: string, status: DeliveryStatus) {
    if (!FORWARD_STATUS_FLOW.includes(status)) throw err("Invalid status");
    const d = await DeliveryModel.findById(deliveryId);
    if (!d) throw err("Delivery not found", 404);
    if (d.courier_id !== courierId) throw err("Forbidden", 403);
    d.status = status;
    d.timeline.push({ status, at: new Date(), note: "" } as any);
    await d.save();
    await notify(d.customer_id, `Delivery update: ${status}`, `Your package is now: ${status}.`, deliveryId);
    return d.toObject();
  }

  static async updateCourierLocation(deliveryId: string, courierId: string, lat: number, lng: number) {
    const d = await DeliveryModel.findById(deliveryId);
    if (!d) throw err("Delivery not found", 404);
    if (d.courier_id !== courierId) throw err("Forbidden", 403);
    d.courier_lat = lat;
    d.courier_lng = lng;
    await d.save();
    await CourierProfileModel.updateOne({ user_id: courierId }, { last_lat: lat, last_lng: lng });
    return { lat, lng };
  }

  static async saveProof(
    deliveryId: string,
    courierId: string,
    kind: "pickup" | "delivery",
    payload: { photo_url?: string; signature_url?: string; signed_by?: string },
  ) {
    const d = await DeliveryModel.findById(deliveryId);
    if (!d) throw err("Delivery not found", 404);
    if (d.courier_id !== courierId) throw err("Forbidden", 403);
    const target = kind === "pickup" ? d.pickup_proof : d.delivery_proof;
    if (payload.photo_url !== undefined) target.photo_url = payload.photo_url;
    if (payload.signature_url !== undefined) target.signature_url = payload.signature_url;
    if (payload.signed_by !== undefined) target.signed_by = payload.signed_by;
    target.at = new Date();
    await d.save();
    return d.toObject();
  }

  // ── Chat ─────────────────────────────────────────────────────────────────────
  static async listMessages(deliveryId: string, userId: string) {
    const d = await DeliveryModel.findById(deliveryId).lean();
    if (!d) throw err("Delivery not found", 404);
    if (d.customer_id !== userId && d.courier_id !== userId) throw err("Forbidden", 403);
    return DeliveryMessageModel.find({ delivery_id: deliveryId }).sort({ createdAt: 1 }).lean();
  }

  static async sendMessage(deliveryId: string, userId: string, body: string) {
    const d = await DeliveryModel.findById(deliveryId).lean();
    if (!d) throw err("Delivery not found", 404);
    const isCustomer = d.customer_id === userId;
    const isCourier = d.courier_id === userId;
    if (!isCustomer && !isCourier) throw err("Forbidden", 403);
    if (!body?.trim()) throw err("Message cannot be empty");
    const msg = await DeliveryMessageModel.create({
      delivery_id: deliveryId,
      sender_id: userId,
      sender_role: isCustomer ? "customer" : "courier",
      body: body.trim(),
    });
    const recipient = isCustomer ? d.courier_id : d.customer_id;
    if (recipient) await notify(recipient, "New message", body.trim().slice(0, 80), deliveryId);
    return msg.toObject();
  }

  // ── Ratings ───────────────────────────────────────────────────────────────────
  static async rate(deliveryId: string, customerId: string, stars: number, comment: string) {
    const d = await DeliveryModel.findById(deliveryId);
    if (!d) throw err("Delivery not found", 404);
    if (d.customer_id !== customerId) throw err("Forbidden", 403);
    if (d.status !== "Delivered") throw err("You can only rate completed deliveries");
    if (d.customer_rated) throw err("You already rated this delivery");
    if (!d.courier_id) throw err("No courier to rate");
    if (stars < 1 || stars > 5) throw err("Rating must be between 1 and 5");

    await DeliveryRatingModel.create({
      delivery_id: deliveryId,
      courier_id: d.courier_id,
      customer_id: customerId,
      stars,
      comment: comment ?? "",
    });
    d.customer_rated = true;
    await d.save();

    const profile = await CourierProfileModel.findOne({ user_id: d.courier_id });
    if (profile) {
      const total = profile.rating_avg * profile.rating_count + stars;
      profile.rating_count += 1;
      profile.rating_avg = Math.round((total / profile.rating_count) * 100) / 100;
      await profile.save();
    }
    return d.toObject();
  }

  // ── Notifications ──────────────────────────────────────────────────────────────
  static async listNotifications(userId: string) {
    return NotificationModel.find({ user_id: userId }).sort({ createdAt: -1 }).limit(50).lean();
  }

  static async markNotificationsRead(userId: string) {
    await NotificationModel.updateMany({ user_id: userId, read: false }, { read: true });
    return { ok: true };
  }

  // ── Enriched lookups (attach customer/courier display info) ──────────────────────
  static async enrich(deliveries: any[]) {
    const ids = new Set<string>();
    for (const d of deliveries) {
      if (d.customer_id) ids.add(d.customer_id);
      if (d.courier_id) ids.add(d.courier_id);
    }
    const users = await UserModel.find({ _id: { $in: [...ids] } })
      .select("username email")
      .lean();
    const map = new Map(users.map((u: any) => [u._id.toString(), u]));
    const profiles = await CourierProfileModel.find({ user_id: { $in: [...ids] } }).lean();
    const pmap = new Map(profiles.map((p: any) => [p.user_id, p]));
    return deliveries.map((d) => ({
      ...d,
      customer: map.get(d.customer_id) ?? null,
      courier: d.courier_id
        ? { user: map.get(d.courier_id) ?? null, profile: pmap.get(d.courier_id) ?? null }
        : null,
    }));
  }
}

export { DELIVERY_STATUSES };
