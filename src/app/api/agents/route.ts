import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { requireAdmin } from "@/lib/middleware";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  await connectDB();
  const agents = await User.find({ role: "agent", isActive: true }).select("name email phone createdAt").lean();
  return NextResponse.json({ agents });
}
