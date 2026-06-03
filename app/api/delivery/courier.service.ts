import { CourierProfileModel } from "./models/courier-profile.model";
import { DeliveryRatingModel } from "./models/rating.model";

function err(message: string, statusCode = 400): Error {
  return Object.assign(new Error(message), { statusCode });
}

export class CourierService {
  static async getOrCreateProfile(userId: string) {
    let profile = await CourierProfileModel.findOne({ user_id: userId });
    if (!profile) {
      profile = await CourierProfileModel.create({ user_id: userId });
    }
    return profile.toObject();
  }

  static async getProfile(userId: string) {
    return CourierProfileModel.findOne({ user_id: userId }).lean();
  }

  static async updateProfile(userId: string, body: any) {
    const profile =
      (await CourierProfileModel.findOne({ user_id: userId })) ??
      (await CourierProfileModel.create({ user_id: userId }));
    const fields = ["full_name", "phone", "vehicle_type", "vehicle_plate", "vehicle_model"];
    for (const f of fields) if (body[f] !== undefined) (profile as any)[f] = body[f];
    // Submitting/updating verification details resets to pending unless already verified
    if (profile.verification_status === "rejected") profile.verification_status = "pending";
    await profile.save();
    return profile.toObject();
  }

  static async setOnline(userId: string, online: boolean) {
    const profile = await CourierProfileModel.findOne({ user_id: userId });
    if (!profile) throw err("Complete your courier profile first");
    if (online && profile.verification_status !== "verified")
      throw err("Your account must be verified before going online", 403);
    profile.is_online = !!online;
    await profile.save();
    return profile.toObject();
  }

  static async ratingsFor(courierId: string) {
    return DeliveryRatingModel.find({ courier_id: courierId }).sort({ createdAt: -1 }).limit(50).lean();
  }
}
