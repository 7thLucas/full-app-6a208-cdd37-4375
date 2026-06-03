import { prop, getModelForClass, modelOptions } from "@typegoose/typegoose";
import { CommonTypegooseEntity } from "~/api/models/base/common-typegoose.entity";

@modelOptions({
  schemaOptions: {
    collection: "tbl_disputes",
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
  },
})
export class Dispute extends CommonTypegooseEntity {
  @prop({ type: String, required: true, index: true })
  delivery_id!: string;

  @prop({ type: String, required: true })
  raised_by!: string;

  @prop({ type: String, default: "customer" })
  raised_by_role!: string;

  @prop({ type: String, required: true })
  reason!: string;

  /** open | resolved */
  @prop({ type: String, default: "open" })
  status!: string;

  @prop({ type: String, default: "" })
  resolution!: string;
}

export const DisputeModel = getModelForClass(Dispute);
