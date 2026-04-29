import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Activity from "@/models/Activity";
import Lead from "@/models/Lead";
import { requireSession } from "@/lib/middleware";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
  const { session, error } = await requireSession();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const since = searchParams.get("since");
  const sinceDate = since ? new Date(since) : new Date(Date.now() - 15_000);

  await connectDB();

  const activityQuery: Record<string, unknown> = { createdAt: { $gt: sinceDate } };

  if (session!.user.role === "agent") {
    const assignedLeads = await Lead.find({ assignedTo: new mongoose.Types.ObjectId(session!.user.id) }).select("_id").lean();
    const leadIds = assignedLeads.map((l) => l._id);
    activityQuery.lead = { $in: leadIds };
  }

  const activities = await Activity.find(activityQuery)
    .populate("performedBy", "name")
    .populate("lead", "name")
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  const leadCountQuery: Record<string, unknown> = {};
  if (session!.user.role === "agent") leadCountQuery.assignedTo = new mongoose.Types.ObjectId(session!.user.id);

  const totalLeads = await Lead.countDocuments(leadCountQuery);

  return NextResponse.json({ activities, totalLeads, timestamp: new Date().toISOString() });
}
