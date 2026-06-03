import { prop, getModelForClass, modelOptions, Severity } from "@typegoose/typegoose";
import { CommonTypegooseEntity } from "~/api/models/base/common-typegoose.entity";

class Address {
  @prop({ type: String, default: "" })
  label!: string;

  @prop({ type: String, required: true })
  address!: string;

  @prop({ type: Number, required: true })
  lat!: number;

  @prop({ type: Number, required: true })
  lng!: number;

  @prop({ type: String, default: "" })
  contact_name!: string;

  @prop({ type: String, default: "" })
  contact_phone!: string;
}

class StatusEvent {
  @prop({ type: String, required: true })
  status!: string;

  @prop({ type: Date, default: () => new Date() })
  at!: Date;

  @prop({ type: String, default: "" })
  note!: string;
}

class ProofRecord {
  @prop({ type: String, default: "" })
  photo_url!: string;

  @prop({ type: String, default: "" })
  signature_url!: string;

  @prop({ type: String, default: "" })
  signed_by!: string;

  @prop({ type: Date, default: null })
  at?: Date | null;
}

@modelOptions({
  schemaOptions: {
    collection: "tbl_deliveries",
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
  },
  options: { allowMixed: Severity.ALLOW },
})
export class Delivery extends CommonTypegooseEntity {
  @prop({ type: String, required: true })
  customer_id!: string;

  @prop({ type: String, default: null })
  courier_id?: string | null;

  @prop({ type: String, required: true })
  status!: string;

  @prop({ type: () => Address, required: true })
  pickup!: Address;

  @prop({ type: () => Address, required: true })
  dropoff!: Address;

  // Package details
  @prop({ type: String, default: "Medium" })
  package_size!: string;

  @prop({ type: Number, default: 1 })
  package_weight!: number;

  @prop({ type: String, default: "Other" })
  package_category!: string;

  @prop({ type: String, default: "" })
  special_instructions!: string;

  @prop({ type: Number, default: 0 })
  distance_km!: number;

  @prop({ type: Number, default: 0 })
  estimated_cost!: number;

  // Live courier location (updated while job is active)
  @prop({ type: Number, default: null })
  courier_lat?: number | null;

  @prop({ type: Number, default: null })
  courier_lng?: number | null;

  @prop({ type: () => [StatusEvent], default: [] })
  timeline!: StatusEvent[];

  @prop({ type: () => ProofRecord, default: {} })
  pickup_proof!: ProofRecord;

  @prop({ type: () => ProofRecord, default: {} })
  delivery_proof!: ProofRecord;

  @prop({ type: Boolean, default: false })
  customer_rated!: boolean;

  @prop({ type: String, default: "" })
  cancel_reason!: string;
}

export const DeliveryModel = getModelForClass(Delivery);
