import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Activity from "@/models/Activity";
import { requireAdmin } from "@/lib/middleware";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  await connectDB();

  const activities = await Activity.find()
    .populate("performedBy", "name role")
    .populate("lead", "name")
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  return NextResponse.json({ activities });
}
