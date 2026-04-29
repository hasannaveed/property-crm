import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Lead from "@/models/Lead";
import { requireSession } from "@/lib/middleware";
import mongoose from "mongoose";

export async function GET() {
  const { session, error } = await requireSession();
  if (error) return error;

  await connectDB();

  const baseQuery: Record<string, unknown> = { status: { $nin: ["closed-won", "closed-lost"] } };
  if (session!.user.role === "agent") {
    baseQuery.assignedTo = new mongoose.Types.ObjectId(session!.user.id);
  }

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  const [overdueLeads, staleLeads, upcomingFollowUps] = await Promise.all([
    Lead.find({ ...baseQuery, followUpDate: { $lt: now, $ne: null } })
      .populate("assignedTo", "name email")
      .sort({ followUpDate: 1 })
      .limit(20)
      .lean(),
    Lead.find({ ...baseQuery, lastActivityAt: { $lt: sevenDaysAgo }, followUpDate: null })
      .populate("assignedTo", "name email")
      .sort({ lastActivityAt: 1 })
      .limit(20)
      .lean(),
    Lead.find({ ...baseQuery, followUpDate: { $gte: now, $lte: threeDaysFromNow } })
      .populate("assignedTo", "name email")
      .sort({ followUpDate: 1 })
      .limit(20)
      .lean(),
  ]);

  return NextResponse.json({
    overdueLeads,
    staleLeads,
    upcomingFollowUps,
    counts: { overdue: overdueLeads.length, stale: staleLeads.length, upcoming: upcomingFollowUps.length },
  });
}
