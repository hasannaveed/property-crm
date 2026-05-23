import mongoose, { Document, Model } from "mongoose";

export type PropertyType = "plot" | "house" | "apartment";
export type PropertyStatus = "available" | "reserved" | "sold";
export type AreaUnit = "marla" | "sqft";

export interface IProperty extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  type: PropertyType;
  status: PropertyStatus;
  price: number;
  area: number;
  areaUnit: AreaUnit;
  location: string;
  description?: string;
  bedrooms?: number;
  bathrooms?: number;
  floor?: number;
  facing?: string;
  features: string[];
  images: string[];
  assignedAgent?: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const propertySchema = new mongoose.Schema<IProperty>(
  {
    title: { type: String, required: true, trim: true },
    type: { type: String, enum: ["plot", "house", "apartment"], required: true },
    status: { type: String, enum: ["available", "reserved", "sold"], default: "available" },
    price: { type: Number, required: true },
    area: { type: Number, required: true },
    areaUnit: { type: String, enum: ["marla", "sqft"], default: "marla" },
    location: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    bedrooms: { type: Number },
    bathrooms: { type: Number },
    floor: { type: Number },
    facing: { type: String, trim: true },
    features: [{ type: String }],
    images: [{ type: String }],
    assignedAgent: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

propertySchema.index({ type: 1 });
propertySchema.index({ status: 1 });
propertySchema.index({ price: 1 });
propertySchema.index({ location: 1 });
propertySchema.index({ createdAt: -1 });

const Property: Model<IProperty> =
  mongoose.models.Property ?? mongoose.model<IProperty>("Property", propertySchema);
export default Property;
