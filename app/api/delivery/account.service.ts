import { UserModel } from "~/modules/authentication/authentication.model";
import { CourierProfileModel } from "./models/courier-profile.model";
import type { AppRole } from "~/lib/delivery/delivery.shared";

function err(message: string, statusCode = 400): Error {
  return Object.assign(new Error(message), { statusCode });
}

export class AccountService {
  /**
   * Resolve the application-level role for a user.
   * Admins (auth role) map to "admin"; others read profile.appRole (default customer).
   */
  static async getAppRole(userId: string): Promise<AppRole> {
    const user = await UserModel.findById(userId).lean();
    if (!user) throw err("User not found", 404);
    if (user.role === "admin") return "admin";
    return (user.profile?.appRole as AppRole) ?? "customer";
  }

  /** Set the app role the first time (used right after registration). */
  static async setAppRole(userId: string, role: "customer" | "courier") {
    const user = await UserModel.findById(userId);
    if (!user) throw err("User not found", 404);
    if (user.role === "admin") return { appRole: "admin" as AppRole };
    user.profile = { ...(user.profile ?? {}), appRole: role };
    user.markModified("profile");
    await user.save();
    if (role === "courier") {
      const existing = await CourierProfileModel.findOne({ user_id: userId });
      if (!existing) await CourierProfileModel.create({ user_id: userId });
    }
    return { appRole: role };
  }

  static async me(userId: string) {
    const user = await UserModel.findById(userId).select("-password_hash").lean();
    if (!user) throw err("User not found", 404);
    const appRole = user.role === "admin" ? "admin" : (user.profile?.appRole ?? "customer");
    return {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      role: user.role,
      appRole,
      is_active: user.is_active,
    };
  }
}
