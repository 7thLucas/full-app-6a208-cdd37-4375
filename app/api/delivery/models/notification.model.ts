import { prop, getModelForClass, modelOptions } from "@typegoose/typegoose";
import { CommonTypegooseEntity } from "~/api/models/base/common-typegoose.entity";

@modelOptions({
  schemaOptions: {
    collection: "tbl_notifications",
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
  },
})
export class Notification extends CommonTypegooseEntity {
  @prop({ type: String, required: true, index: true })
  user_id!: string;

  @prop({ type: String, required: true })
  title!: string;

  @prop({ type: String, default: "" })
  body!: string;

  @prop({ type: String, default: "" })
  delivery_id!: string;

  @prop({ type: Boolean, default: false })
  read!: boolean;
}

export const NotificationModel = getModelForClass(Notification);
