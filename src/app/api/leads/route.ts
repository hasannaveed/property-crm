import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireSession, rateLimitMiddleware, validateLeadBody } from "@/lib/middleware";
import { mapLead } from "@/lib/mappers";
import { calculateLeadScore } from "@/lib/scoring";
import { sendNewLeadEmail } from "@/lib/email";

export async function GET(req: NextRequest) {
  const { session, error } = await requireSession();
  if (error) return error;

  const rl = rateLimitMiddleware(session!.user.email, session!.user.role);
  if (rl) return rl;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const priority = searchParams.get("priority");
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? 20)));
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const db = supabaseAdmin();
  let query = db
    .from("leads")
    .select(
      "*, assigned_to:profiles!leads_assigned_to_fkey(id, name, email), interested_in:properties!leads_interested_in_fkey(id, title, type, price, location, status)",
      { count: "exact" }
    )
    .order("score", { ascending: false })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (session!.user.role === "agent") query = query.eq("assigned_to", session!.user.id);
  if (status) query = query.eq("status", status);
  if (priority) query = query.eq("priority", priority);

  const { data, count, error: dbError } = await query;
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  return NextResponse.json({
    leads: (data ?? []).map((l) => mapLead(l as Record<string, unknown>)),
    pagination: { page, limit, total: count ?? 0, pages: Math.ceil((count ?? 0) / limit) },
  });
}

export async function POST(req: NextRequest) {
  const { session, error } = await requireSession();
  if (error) return error;

  const rl = rateLimitMiddleware(session!.user.email, session!.user.role);
  if (rl) return rl;

  const body = await req.json();
  const { valid, errors } = validateLeadBody(body);
  if (!valid) return NextResponse.json({ errors }, { status: 422 });

  const { score, priority } = calculateLeadScore(Number(body.budget));
  const db = supabaseAdmin();

  const { data: lead, error: dbError } = await db
    .from("leads")
    .insert({
      name: body.name.trim(),
      email: body.email.trim(),
      phone: body.phone.trim(),
      property_interest: body.propertyInterest.trim(),
      budget: Number(body.budget),
      source: body.source ?? "other",
      notes: body.notes ?? "",
      interested_in: body.interestedIn ?? null,
      property_type: body.propertyType ?? "any",
      budget_min: body.budgetMin ? Number(body.budgetMin) : null,
      budget_max: body.budgetMax ? Number(body.budgetMax) : null,
      score,
      priority,
    })
    .select()
    .single();

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  await db.from("activities").insert({
    lead_id: lead.id,
    performed_by: session!.user.id,
    type: "lead_created",
    description: `Lead "${lead.name}" was created`,
    metadata: { budget: lead.budget, source: lead.source },
  });

  sendNewLeadEmail({
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    budget: lead.budget,
    propertyInterest: lead.property_interest,
  }).catch(console.error);

  return NextResponse.json(mapLead(lead as Record<string, unknown>), { status: 201 });
}
