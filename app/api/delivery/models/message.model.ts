import { prop, getModelForClass, modelOptions } from "@typegoose/typegoose";
import { CommonTypegooseEntity } from "~/api/models/base/common-typegoose.entity";

@modelOptions({
  schemaOptions: {
    collection: "tbl_delivery_messages",
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
  },
})
export class DeliveryMessage extends CommonTypegooseEntity {
  @prop({ type: String, required: true, index: true })
  delivery_id!: string;

  @prop({ type: String, required: true })
  sender_id!: string;

  /** customer | courier */
  @prop({ type: String, required: true })
  sender_role!: string;

  @prop({ type: String, required: true })
  body!: string;
}

export const DeliveryMessageModel = getModelForClass(DeliveryMessage);
