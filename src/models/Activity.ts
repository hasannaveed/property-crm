import mongoose, { Document, Model } from "mongoose";

export type ActivityType =
  | "lead_created"
  | "status_updated"
  | "assigned"
  | "reassigned"
  | "notes_updated"
  | "follow_up_set"
  | "priority_changed"
  | "lead_deleted";

export interface IActivity extends Document {
  _id: mongoose.Types.ObjectId;
  lead: mongoose.Types.ObjectId;
  performedBy: mongoose.Types.ObjectId;
  type: ActivityType;
  description: string;
  metadata: Record<string, unknown>;
}

const activitySchema = new mongoose.Schema<IActivity>(
  {
    lead: { type: mongoose.Schema.Types.ObjectId, ref: "Lead", required: true, index: true },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: ["lead_created", "status_updated", "assigned", "reassigned", "notes_updated", "follow_up_set", "priority_changed", "lead_deleted"],
      required: true,
    },
    description: { type: String, required: true, maxlength: 500 },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

activitySchema.index({ lead: 1, createdAt: -1 });

const Activity: Model<IActivity> = mongoose.models.Activity ?? mongoose.model<IActivity>("Activity", activitySchema);
export default Activity;
