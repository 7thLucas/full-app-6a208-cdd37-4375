import { UserModel } from "~/modules/authentication/authentication.model";
import { UserRole } from "~/modules/authentication/authentication.types";
import { CourierProfileModel } from "./models/courier-profile.model";
import { DeliveryModel } from "./models/delivery.model";
import { DisputeModel } from "./models/dispute.model";
import { isActiveStatus, type DeliveryStatus } from "~/lib/delivery/delivery.shared";

function err(message: string, statusCode = 400): Error {
  return Object.assign(new Error(message), { statusCode });
}

export class AdminService {
  static async listUsers(role?: "customer" | "courier") {
    const query: any = { role: { $ne: UserRole.Admin } };
    if (role) query["profile.appRole"] = role;
    const users = await UserModel.find(query).select("-password_hash").sort({ createdAt: -1 }).lean();
    const courierIds = users.filter((u: any) => u.profile?.appRole === "courier").map((u: any) => u._id.toString());
    const profiles = await CourierProfileModel.find({ user_id: { $in: courierIds } }).lean();
    const pmap = new Map(profiles.map((p: any) => [p.user_id, p]));
    return users.map((u: any) => ({
      ...u,
      id: u._id.toString(),
      appRole: u.profile?.appRole ?? "customer",
      courierProfile: pmap.get(u._id.toString()) ?? null,
    }));
  }

  static async listCouriers() {
    const profiles = await CourierProfileModel.find().sort({ createdAt: -1 }).lean();
    const ids = profiles.map((p: any) => p.user_id);
    const users = await UserModel.find({ _id: { $in: ids } }).select("username email is_active").lean();
    const umap = new Map(users.map((u: any) => [u._id.toString(), u]));
    return profiles.map((p: any) => ({ ...p, user: umap.get(p.user_id) ?? null }));
  }

  static async setCourierVerification(courierUserId: string, status: "verified" | "rejected" | "pending") {
    const profile = await CourierProfileModel.findOne({ user_id: courierUserId });
    if (!profile) throw err("Courier profile not found", 404);
    profile.verification_status = status;
    if (status !== "verified") profile.is_online = false;
    await profile.save();
    return profile.toObject();
  }

  static async setUserActive(userId: string, active: boolean) {
    const user = await UserModel.findById(userId);
    if (!user) throw err("User not found", 404);
    user.is_active = !!active;
    await user.save();
    return { id: user._id.toString(), is_active: user.is_active };
  }

  static async activeDeliveries() {
    const all = await DeliveryModel.find({ deletedAt: null }).sort({ updatedAt: -1 }).lean();
    return all.filter((d: any) => isActiveStatus(d.status as DeliveryStatus));
  }

  static async allDeliveries() {
    return DeliveryModel.find({ deletedAt: null }).sort({ createdAt: -1 }).limit(200).lean();
  }

  // ── Disputes ───────────────────────────────────────────────────────────────────
  static async listDisputes() {
    return DisputeModel.find().sort({ createdAt: -1 }).lean();
  }

  static async resolveDispute(id: string, resolution: string) {
    const dispute = await DisputeModel.findById(id);
    if (!dispute) throw err("Dispute not found", 404);
    dispute.status = "resolved";
    dispute.resolution = resolution ?? "";
    await dispute.save();
    return dispute.toObject();
  }

  static async createDispute(deliveryId: string, raisedBy: string, role: string, reason: string) {
    if (!reason?.trim()) throw err("Reason is required");
    const dispute = await DisputeModel.create({
      delivery_id: deliveryId,
      raised_by: raisedBy,
      raised_by_role: role,
      reason: reason.trim(),
    });
    return dispute.toObject();
  }

  // ── Analytics ─────────────────────────────────────────────────────────────────
  static async analytics() {
    const [totalDeliveries, delivered, cancelled, totalCustomers, totalCouriers, verifiedCouriers, onlineCouriers, openDisputes] =
      await Promise.all([
        DeliveryModel.countDocuments({ deletedAt: null }),
        DeliveryModel.countDocuments({ status: "Delivered", deletedAt: null }),
        DeliveryModel.countDocuments({ status: "Cancelled", deletedAt: null }),
        UserModel.countDocuments({ "profile.appRole": "customer" }),
        CourierProfileModel.countDocuments({}),
        CourierProfileModel.countDocuments({ verification_status: "verified" }),
        CourierProfileModel.countDocuments({ is_online: true }),
        DisputeModel.countDocuments({ status: "open" }),
      ]);

    const deliveredDocs = await DeliveryModel.find({ status: "Delivered", deletedAt: null })
      .select("estimated_cost")
      .lean();
    const revenue =
      Math.round(deliveredDocs.reduce((sum: number, d: any) => sum + (d.estimated_cost || 0), 0) * 100) / 100;

    const active = await this.activeDeliveries();

    return {
      totalDeliveries,
      delivered,
      cancelled,
      active: active.length,
      totalCustomers,
      totalCouriers,
      verifiedCouriers,
      onlineCouriers,
      openDisputes,
      revenue,
    };
  }
}
