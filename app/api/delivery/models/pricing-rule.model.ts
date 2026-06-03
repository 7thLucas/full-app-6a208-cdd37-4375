import { prop, getModelForClass, modelOptions } from "@typegoose/typegoose";
import { CommonTypegooseEntity } from "~/api/models/base/common-typegoose.entity";

/** Singleton pricing rules document, managed by Admin. */
@modelOptions({
  schemaOptions: {
    collection: "tbl_pricing_rules",
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
  },
})
export class PricingRule extends CommonTypegooseEntity {
  @prop({ type: Boolean, default: true, unique: true })
  _singleton!: boolean;

  @prop({ type: Number, default: 3.5 })
  base_fare!: number;

  @prop({ type: Number, default: 1.2 })
  per_km_rate!: number;

  @prop({ type: String, default: "$" })
  currency_symbol!: string;
}

export const PricingRuleModel = getModelForClass(PricingRule);
