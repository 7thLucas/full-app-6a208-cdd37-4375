import { prop, getModelForClass, modelOptions, Severity } from "@typegoose/typegoose";
import { CommonTypegooseEntity } from "~/api/models/base/common-typegoose.entity";

@modelOptions({
  schemaOptions: {
    collection: "tbl_courier_profiles",
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
  },
  options: { allowMixed: Severity.ALLOW },
})
export class CourierProfile extends CommonTypegooseEntity {
  @prop({ type: String, required: true, unique: true })
  user_id!: string;

  @prop({ type: String, default: "" })
  full_name!: string;

  @prop({ type: String, default: "" })
  phone!: string;

  @prop({ type: String, default: "Motorcycle" })
  vehicle_type!: string;

  @prop({ type: String, default: "" })
  vehicle_plate!: string;

  @prop({ type: String, default: "" })
  vehicle_model!: string;

  /** Verification: pending | verified | rejected */
  @prop({ type: String, default: "pending" })
  verification_status!: string;

  @prop({ type: Boolean, default: false })
  is_online!: boolean;

  @prop({ type: Number, default: 0 })
  rating_avg!: number;

  @prop({ type: Number, default: 0 })
  rating_count!: number;

  @prop({ type: Number, default: 0 })
  total_earnings!: number;

  @prop({ type: Number, default: 0 })
  completed_deliveries!: number;

  // Last known location
  @prop({ type: Number, default: null })
  last_lat?: number | null;

  @prop({ type: Number, default: null })
  last_lng?: number | null;
}

export const CourierProfileModel = getModelForClass(CourierProfile);
