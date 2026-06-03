import bcrypt from "bcryptjs";
import { createLogger } from "~/lib/logger";
import { UserModel } from "~/modules/authentication/authentication.model";
import { UserRole } from "~/modules/authentication/authentication.types";
import { CourierProfileModel } from "./models/courier-profile.model";
import { DeliveryModel } from "./models/delivery.model";
import { DeliveryMessageModel } from "./models/message.model";
import { PricingRuleModel } from "./models/pricing-rule.model";
import { NotificationModel } from "./models/notification.model";
import { DisputeModel } from "./models/dispute.model";
import { estimatePrice, haversineKm } from "~/lib/delivery/delivery.shared";

const logger = createLogger("DeliverySeed");

const DEMO_PASSWORD = "Password123!";

// Manhattan-area coordinates for believable short-distance demo deliveries.
const PLACES = {
  flatiron: { address: "175 5th Ave, Flatiron, New York", lat: 40.7411, lng: -73.9897 },
  soho: { address: "120 Greene St, SoHo, New York", lat: 40.7250, lng: -74.0009 },
  midtown: { address: "30 Rockefeller Plaza, Midtown, New York", lat: 40.7587, lng: -73.9787 },
  ues: { address: "1000 5th Ave, Upper East Side, New York", lat: 40.7794, lng: -73.9632 },
  chelsea: { address: "601 W 26th St, Chelsea, New York", lat: 40.7506, lng: -74.0055 },
  village: { address: "1 Washington Sq, Greenwich Village, New York", lat: 40.7308, lng: -73.9973 },
};

async function ensureUser(opts: {
  username: string;
  email: string;
  appRole?: "customer" | "courier";
  role?: UserRole;
}) {
  let user = await UserModel.findOne({ email: opts.email });
  if (user) return user;
  const password_hash = await bcrypt.hash(DEMO_PASSWORD, 12);
  user = await UserModel.create({
    username: opts.username,
    email: opts.email,
    password_hash,
    role: opts.role ?? UserRole.Authenticated,
    is_active: true,
    email_verified: true,
    profile: opts.appRole ? { appRole: opts.appRole } : {},
  });
  return user;
}

function buildAddress(place: { address: string; lat: number; lng: number }, label: string, name: string, phone: string) {
  return { ...place, label, contact_name: name, contact_phone: phone };
}

export async function seedDeliveryDemo(): Promise<void> {
  try {
    // Pricing singleton
    if (!(await PricingRuleModel.findOne({ _singleton: true }))) {
      await PricingRuleModel.create({ _singleton: true, base_fare: 3.5, per_km_rate: 1.2, currency_symbol: "$" });
    }

    // Idempotency guard
    if (await DeliveryModel.countDocuments({})) {
      logger.info("Deliveries already seeded, skipping.");
      return;
    }

    logger.info("Seeding Pakettt! demo data...");

    // Customers
    const alice = await ensureUser({ username: "alice", email: "alice@demo.pakettt", appRole: "customer" });
    const bob = await ensureUser({ username: "bob", email: "bob@demo.pakettt", appRole: "customer" });

    // Couriers
    const carlos = await ensureUser({ username: "carlos", email: "carlos@demo.pakettt", appRole: "courier" });
    const dana = await ensureUser({ username: "dana", email: "dana@demo.pakettt", appRole: "courier" });
    const evan = await ensureUser({ username: "evan", email: "evan@demo.pakettt", appRole: "courier" });

    async function ensureCourierProfile(userId: string, data: any) {
      let p = await CourierProfileModel.findOne({ user_id: userId });
      if (!p) p = await CourierProfileModel.create({ user_id: userId, ...data });
      else {
        Object.assign(p, data);
        await p.save();
      }
      return p;
    }

    const carlosProfile = await ensureCourierProfile(carlos._id.toString(), {
      full_name: "Carlos Rivera",
      phone: "+1 212 555 0142",
      vehicle_type: "Motorcycle",
      vehicle_plate: "NYC-8842",
      vehicle_model: "Honda PCX",
      verification_status: "verified",
      is_online: true,
      last_lat: PLACES.midtown.lat,
      last_lng: PLACES.midtown.lng,
      rating_avg: 4.8,
      rating_count: 27,
      completed_deliveries: 31,
      total_earnings: 642.5,
    });

    const danaProfile = await ensureCourierProfile(dana._id.toString(), {
      full_name: "Dana Lee",
      phone: "+1 212 555 0199",
      vehicle_type: "Bicycle",
      vehicle_plate: "—",
      vehicle_model: "Trek FX",
      verification_status: "verified",
      is_online: true,
      last_lat: PLACES.soho.lat,
      last_lng: PLACES.soho.lng,
      rating_avg: 4.6,
      rating_count: 12,
      completed_deliveries: 14,
      total_earnings: 289.0,
    });

    // Pending-verification courier (for admin demo)
    await ensureCourierProfile(evan._id.toString(), {
      full_name: "Evan Brooks",
      phone: "+1 212 555 0123",
      vehicle_type: "Car",
      vehicle_plate: "NYC-1199",
      vehicle_model: "Toyota Corolla",
      verification_status: "pending",
      is_online: false,
    });

    function makeDelivery(opts: {
      customer: string;
      courier?: string;
      status: string;
      pickup: any;
      dropoff: any;
      size: string;
      category: string;
      weight: number;
      instructions?: string;
      courierLoc?: { lat: number; lng: number };
      timeline: { status: string; minsAgo: number; note?: string }[];
      pickupProof?: any;
      deliveryProof?: any;
      rated?: boolean;
    }) {
      const distance_km = Math.round(haversineKm(opts.pickup, opts.dropoff) * 100) / 100;
      const estimated_cost = estimatePrice(distance_km, opts.size as any, {
        baseFare: 3.5,
        perKmRate: 1.2,
        currencySymbol: "$",
      });
      const now = Date.now();
      return {
        customer_id: opts.customer,
        courier_id: opts.courier ?? null,
        status: opts.status,
        pickup: opts.pickup,
        dropoff: opts.dropoff,
        package_size: opts.size,
        package_weight: opts.weight,
        package_category: opts.category,
        special_instructions: opts.instructions ?? "",
        distance_km,
        estimated_cost,
        courier_lat: opts.courierLoc?.lat ?? null,
        courier_lng: opts.courierLoc?.lng ?? null,
        timeline: opts.timeline.map((t) => ({
          status: t.status,
          at: new Date(now - t.minsAgo * 60000),
          note: t.note ?? "",
        })),
        pickup_proof: opts.pickupProof ?? {},
        delivery_proof: opts.deliveryProof ?? {},
        customer_rated: !!opts.rated,
      };
    }

    const deliveries = [
      // 1) In Transit — live tracking demo
      makeDelivery({
        customer: alice._id.toString(),
        courier: carlos._id.toString(),
        status: "In Transit",
        pickup: buildAddress(PLACES.flatiron, "Office", "Alice Nguyen", "+1 212 555 0101"),
        dropoff: buildAddress(PLACES.ues, "Home", "Margaret Cole", "+1 212 555 0177"),
        size: "Medium",
        category: "Electronics",
        weight: 2.5,
        instructions: "Handle with care — laptop inside.",
        courierLoc: { lat: 40.7601, lng: -73.972 },
        timeline: [
          { status: "Pending", minsAgo: 58 },
          { status: "Searching for Courier", minsAgo: 57 },
          { status: "Courier Assigned", minsAgo: 50, note: "Carlos accepted" },
          { status: "Courier En Route to Pickup", minsAgo: 44 },
          { status: "Package Picked Up", minsAgo: 30, note: "Photo proof captured" },
          { status: "In Transit", minsAgo: 22 },
        ],
        pickupProof: {
          photo_url: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=70",
          signed_by: "Alice Nguyen",
          at: new Date(now() - 30 * 60000),
        },
      }),
      // 2) Searching for Courier — available job
      makeDelivery({
        customer: bob._id.toString(),
        status: "Searching for Courier",
        pickup: buildAddress(PLACES.chelsea, "Studio", "Bob Tan", "+1 212 555 0102"),
        dropoff: buildAddress(PLACES.village, "Friend", "Priya Shah", "+1 212 555 0188"),
        size: "Small",
        category: "Documents",
        weight: 0.5,
        instructions: "Ring buzzer 4B.",
        timeline: [
          { status: "Pending", minsAgo: 6 },
          { status: "Searching for Courier", minsAgo: 5 },
        ],
      }),
      // 3) Delivered + rated — history demo
      makeDelivery({
        customer: alice._id.toString(),
        courier: dana._id.toString(),
        status: "Delivered",
        pickup: buildAddress(PLACES.soho, "Boutique", "Alice Nguyen", "+1 212 555 0101"),
        dropoff: buildAddress(PLACES.midtown, "Office", "Reception", "+1 212 555 0150"),
        size: "Large",
        category: "Clothing",
        weight: 4,
        timeline: [
          { status: "Pending", minsAgo: 1440 },
          { status: "Searching for Courier", minsAgo: 1438 },
          { status: "Courier Assigned", minsAgo: 1430 },
          { status: "Courier En Route to Pickup", minsAgo: 1425 },
          { status: "Package Picked Up", minsAgo: 1410 },
          { status: "In Transit", minsAgo: 1405 },
          { status: "Arriving Soon", minsAgo: 1390 },
          { status: "Delivered", minsAgo: 1385 },
        ],
        pickupProof: {
          photo_url: "https://images.unsplash.com/photo-1607344645866-009c320b63e0?w=800&q=70",
          signed_by: "Alice Nguyen",
          at: new Date(now() - 1410 * 60000),
        },
        deliveryProof: {
          photo_url: "https://images.unsplash.com/photo-1601598851547-4302969d0614?w=800&q=70",
          signed_by: "Reception Desk",
          at: new Date(now() - 1385 * 60000),
        },
        rated: true,
      }),
      // 4) Courier En Route to Pickup
      makeDelivery({
        customer: bob._id.toString(),
        courier: carlos._id.toString(),
        status: "Courier En Route to Pickup",
        pickup: buildAddress(PLACES.midtown, "Lobby", "Bob Tan", "+1 212 555 0102"),
        dropoff: buildAddress(PLACES.chelsea, "Home", "Bob Tan", "+1 212 555 0102"),
        size: "Medium",
        category: "Food",
        weight: 1.5,
        instructions: "Keep upright — soup.",
        courierLoc: { lat: 40.755, lng: -73.982 },
        timeline: [
          { status: "Pending", minsAgo: 18 },
          { status: "Searching for Courier", minsAgo: 17 },
          { status: "Courier Assigned", minsAgo: 12 },
          { status: "Courier En Route to Pickup", minsAgo: 8 },
        ],
      }),
      // 5) Cancelled
      makeDelivery({
        customer: alice._id.toString(),
        status: "Cancelled",
        pickup: buildAddress(PLACES.village, "Home", "Alice Nguyen", "+1 212 555 0101"),
        dropoff: buildAddress(PLACES.ues, "Mom", "Linda Nguyen", "+1 212 555 0166"),
        size: "Small",
        category: "Other",
        weight: 1,
        timeline: [
          { status: "Pending", minsAgo: 320 },
          { status: "Searching for Courier", minsAgo: 319 },
          { status: "Cancelled", minsAgo: 300, note: "Changed plans" },
        ],
      }),
    ];

    const created = await DeliveryModel.insertMany(deliveries);

    // Chat on the active in-transit delivery (#1)
    const live = created[0];
    await DeliveryMessageModel.insertMany([
      { delivery_id: live._id.toString(), sender_id: alice._id.toString(), sender_role: "customer", body: "Hi! Any ETA?" },
      { delivery_id: live._id.toString(), sender_id: carlos._id.toString(), sender_role: "courier", body: "On my way — about 10 minutes out." },
      { delivery_id: live._id.toString(), sender_id: alice._id.toString(), sender_role: "customer", body: "Great, thank you!" },
    ]);

    // A dispute for admin demo (on the cancelled delivery)
    const cancelled = created[4];
    await DisputeModel.create({
      delivery_id: cancelled._id.toString(),
      raised_by: alice._id.toString(),
      raised_by_role: "customer",
      reason: "Charged a cancellation fee I did not expect.",
      status: "open",
    });

    // A couple of notifications
    await NotificationModel.insertMany([
      { user_id: alice._id.toString(), title: "Delivery update: In Transit", body: "Your package is on the move.", delivery_id: live._id.toString() },
      { user_id: carlos._id.toString(), title: "New message", body: "Hi! Any ETA?", delivery_id: live._id.toString() },
    ]);

    void carlosProfile;
    void danaProfile;
    logger.info(`✅ Seeded ${created.length} deliveries and demo accounts.`);
  } catch (error) {
    logger.error("❌ Failed to seed delivery demo:", error);
  }
}

function now() {
  return Date.now();
}
