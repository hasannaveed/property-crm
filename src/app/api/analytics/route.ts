import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Lead from "@/models/Lead";
import { requireAdmin } from "@/lib/middleware";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  await connectDB();

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const now = new Date();
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  const [
    totalLeads,
    byStatus,
    byPriority,
    byAgent,
    recentLeads,
    overdueCount,
    weeklyTrend,
  ] = await Promise.all([
    Lead.countDocuments(),
    Lead.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Lead.aggregate([{ $group: { _id: "$priority", count: { $sum: 1 } } }]),
    Lead.aggregate([
      { $match: { assignedTo: { $ne: null } } },
      {
        $group: {
          _id: "$assignedTo",
          totalLeads: { $sum: 1 },
          closedWon: { $sum: { $cond: [{ $eq: ["$status", "closed-won"] }, 1, 0] } },
          highPriority: { $sum: { $cond: [{ $eq: ["$priority", "high"] }, 1, 0] } },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "agent",
        },
      },
      { $unwind: "$agent" },
      { $project: { name: "$agent.name", email: "$agent.email", totalLeads: 1, closedWon: 1, highPriority: 1 } },
      { $sort: { totalLeads: -1 } },
    ]),
    Lead.find().sort({ createdAt: -1 }).limit(5).populate("assignedTo", "name").lean(),
    Lead.countDocuments({ followUpDate: { $lt: now }, status: { $nin: ["closed-won", "closed-lost"] } }),
    Lead.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  const highPriorityCount = (byPriority.find((p) => p._id === "high") ?? { count: 0 }).count;
  const closedWonCount = (byStatus.find((s) => s._id === "closed-won") ?? { count: 0 }).count;

  return NextResponse.json({
    totalLeads,
    highPriorityCount,
    closedWonCount,
    overdueCount,
    byStatus,
    byPriority,
    byAgent,
    recentLeads,
    weeklyTrend,
  });
}
