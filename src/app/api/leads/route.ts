import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Lead from "@/models/Lead";
import Activity from "@/models/Activity";
import { requireSession, rateLimitMiddleware, validateLeadBody } from "@/lib/middleware";
import { sendNewLeadEmail } from "@/lib/email";

export async function GET(req: NextRequest) {
  const { session, error } = await requireSession();
  if (error) return error;

  const rl = rateLimitMiddleware(session!.user.email!, session!.user.role);
  if (rl) return rl;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const priority = searchParams.get("priority");
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? 20)));
  const skip = (page - 1) * limit;

  const query: Record<string, unknown> = {};
  if (session!.user.role === "agent") query.assignedTo = session!.user.id;
  if (status) query.status = status;
  if (priority) query.priority = priority;

  await connectDB();

  const [leads, total] = await Promise.all([
    Lead.find(query)
      .populate("assignedTo", "name email")
      .sort({ score: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Lead.countDocuments(query),
  ]);

  return NextResponse.json({
    leads,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
}

export async function POST(req: NextRequest) {
  const { session, error } = await requireSession();
  if (error) return error;

  const rl = rateLimitMiddleware(session!.user.email!, session!.user.role);
  if (rl) return rl;

  const body = await req.json();
  const { valid, errors } = validateLeadBody(body);
  if (!valid) return NextResponse.json({ errors }, { status: 422 });

  await connectDB();

  const lead = await Lead.create({
    name: body.name.trim(),
    email: body.email.trim(),
    phone: body.phone.trim(),
    propertyInterest: body.propertyInterest.trim(),
    budget: Number(body.budget),
    source: body.source ?? "other",
    notes: body.notes ?? "",
  });

  await Activity.create({
    lead: lead._id,
    performedBy: session!.user.id,
    type: "lead_created",
    description: `Lead "${lead.name}" was created`,
    metadata: { budget: lead.budget, source: lead.source },
  });

  sendNewLeadEmail({ name: lead.name, email: lead.email, phone: lead.phone, budget: lead.budget, propertyInterest: lead.propertyInterest }).catch(console.error);

  return NextResponse.json(lead, { status: 201 });
}
