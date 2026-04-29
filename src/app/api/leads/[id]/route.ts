import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Lead from "@/models/Lead";
import Activity from "@/models/Activity";
import User from "@/models/User";
import { requireSession, requireAdmin, rateLimitMiddleware } from "@/lib/middleware";
import { sendLeadAssignmentEmail } from "@/lib/email";
import mongoose from "mongoose";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { session, error } = await requireSession();
  if (error) return error;

  const { id } = await ctx.params;
  if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  await connectDB();

  const lead = await Lead.findById(id).populate("assignedTo", "name email").lean();
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  if (session!.user.role === "agent") {
    const assignedId = (lead.assignedTo as { _id: mongoose.Types.ObjectId } | null)?._id?.toString();
    if (assignedId !== session!.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const activities = await Activity.find({ lead: id })
    .populate("performedBy", "name role")
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json({ lead, activities });
}

export async function PUT(req: NextRequest, ctx: Ctx) {
  const { session, error } = await requireSession();
  if (error) return error;

  const rl = rateLimitMiddleware(session!.user.email!, session!.user.role);
  if (rl) return rl;

  const { id } = await ctx.params;
  if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  await connectDB();

  const lead = await Lead.findById(id);
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  if (session!.user.role === "agent") {
    if (lead.assignedTo?.toString() !== session!.user.id)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  if (session!.user.role === "agent") delete body.assignedTo;

  const prevStatus = lead.status;
  const prevAssignedTo = lead.assignedTo?.toString();

  const allowed = ["name", "email", "phone", "propertyInterest", "budget", "status", "notes", "source", "assignedTo", "followUpDate"];
  for (const key of allowed) {
    if (key in body) {
      if (key === "assignedTo") {
        (lead as unknown as Record<string, unknown>)[key] = body[key] ? new mongoose.Types.ObjectId(body[key]) : null;
      } else if (key === "followUpDate") {
        (lead as unknown as Record<string, unknown>)[key] = body[key] ? new Date(body[key]) : null;
      } else {
        (lead as unknown as Record<string, unknown>)[key] = body[key];
      }
    }
  }

  lead.lastActivityAt = new Date();
  await lead.save();

  const newAssignedTo = lead.assignedTo?.toString();
  const activities = [];

  if (body.status && body.status !== prevStatus) {
    activities.push({ lead: lead._id, performedBy: session!.user.id, type: "status_updated", description: `Status changed from "${prevStatus}" to "${body.status}"`, metadata: { from: prevStatus, to: body.status } });
  }

  if ("assignedTo" in body && newAssignedTo !== prevAssignedTo) {
    const type = prevAssignedTo ? "reassigned" : "assigned";
    activities.push({ lead: lead._id, performedBy: session!.user.id, type, description: `Lead ${type} to new agent`, metadata: { from: prevAssignedTo, to: newAssignedTo } });

    if (newAssignedTo) {
      const agent = await User.findById(newAssignedTo).lean() as { name: string; email: string } | null;
      if (agent) {
        sendLeadAssignmentEmail({
          agentName: agent.name,
          agentEmail: agent.email,
          lead: { _id: lead._id.toString(), name: lead.name, email: lead.email, phone: lead.phone, budget: lead.budget, propertyInterest: lead.propertyInterest },
        }).catch(console.error);
      }
    }
  }

  if ("notes" in body) {
    activities.push({ lead: lead._id, performedBy: session!.user.id, type: "notes_updated", description: "Notes were updated", metadata: {} });
  }

  if ("followUpDate" in body && body.followUpDate) {
    activities.push({ lead: lead._id, performedBy: session!.user.id, type: "follow_up_set", description: `Follow-up scheduled for ${new Date(body.followUpDate).toLocaleDateString()}`, metadata: { date: body.followUpDate } });
  }

  if (activities.length > 0) await Activity.insertMany(activities);

  const populated = await Lead.findById(lead._id).populate("assignedTo", "name email").lean();
  return NextResponse.json(populated);
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const { session, error } = await requireAdmin();
  if (error) return error;

  const { id } = await ctx.params;
  if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  await connectDB();

  const lead = await Lead.findByIdAndDelete(id);
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  await Activity.create({
    lead: lead._id,
    performedBy: session!.user.id,
    type: "lead_deleted",
    description: `Lead "${lead.name}" was deleted`,
    metadata: { name: lead.name },
  });

  return NextResponse.json({ message: "Lead deleted" });
}
