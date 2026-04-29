import mongoose, { Document, Model } from "mongoose";
import { calculateLeadScore } from "@/lib/scoring";

export type LeadStatus = "new" | "contacted" | "in-progress" | "site-visit" | "negotiation" | "closed-won" | "closed-lost";
export type LeadPriority = "high" | "medium" | "low";
export type LeadSource = "facebook-ads" | "walk-in" | "website" | "referral" | "other";

export interface ILead extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  phone: string;
  propertyInterest: string;
  budget: number;
  status: LeadStatus;
  priority: LeadPriority;
  score: number;
  notes: string;
  source: LeadSource;
  assignedTo?: mongoose.Types.ObjectId;
  followUpDate?: Date;
  lastActivityAt: Date;
}

const leadSchema = new mongoose.Schema<ILead>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    propertyInterest: { type: String, required: true, trim: true },
    budget: { type: Number, required: true },
    status: {
      type: String,
      enum: ["new", "contacted", "in-progress", "site-visit", "negotiation", "closed-won", "closed-lost"],
      default: "new",
    },
    priority: { type: String, enum: ["high", "medium", "low"], default: "low" },
    score: { type: Number, default: 0, min: 0, max: 100 },
    notes: { type: String, default: "" },
    source: { type: String, enum: ["facebook-ads", "walk-in", "website", "referral", "other"] },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    followUpDate: { type: Date, default: null },
    lastActivityAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

leadSchema.pre("save", async function () {
  if (this.isModified("budget") || this.isNew) {
    const { score, priority } = calculateLeadScore(this.budget as number);
    this.score = score;
    this.priority = priority as "high" | "medium" | "low";
  }
});

leadSchema.index({ assignedTo: 1 });
leadSchema.index({ status: 1 });
leadSchema.index({ priority: 1 });
leadSchema.index({ createdAt: -1 });
leadSchema.index({ followUpDate: 1 });

const Lead: Model<ILead> = mongoose.models.Lead ?? mongoose.model<ILead>("Lead", leadSchema);
export default Lead;
