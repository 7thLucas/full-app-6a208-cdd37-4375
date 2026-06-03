import { prop, getModelForClass, modelOptions } from "@typegoose/typegoose";
import { CommonTypegooseEntity } from "~/api/models/base/common-typegoose.entity";

@modelOptions({
  schemaOptions: {
    collection: "tbl_delivery_ratings",
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
  },
})
export class DeliveryRating extends CommonTypegooseEntity {
  @prop({ type: String, required: true, index: true })
  delivery_id!: string;

  @prop({ type: String, required: true })
  courier_id!: string;

  @prop({ type: String, required: true })
  customer_id!: string;

  @prop({ type: Number, required: true })
  stars!: number;

  @prop({ type: String, default: "" })
  comment!: string;
}

export const DeliveryRatingModel = getModelForClass(DeliveryRating);
