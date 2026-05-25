import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireSession, requireAdmin, rateLimitMiddleware } from "@/lib/middleware";
import { mapLead, mapActivity, isValidUUID } from "@/lib/mappers";
import { calculateLeadScore } from "@/lib/scoring";
import { sendLeadAssignmentEmail } from "@/lib/email";

type Ctx = { params: Promise<{ id: string }> };

const LEAD_SELECT = "*, assigned_to:profiles!leads_assigned_to_fkey(id, name, email), interested_in:properties(id, title, type, price, location, status, area, area_unit)";

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { session, error } = await requireSession();
  if (error) return error;

  const { id } = await ctx.params;
  if (!isValidUUID(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const db = supabaseAdmin();

  const { data: lead, error: leadError } = await db
    .from("leads")
    .select(LEAD_SELECT)
    .eq("id", id)
    .single();

  if (leadError || !lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  if (session!.user.role === "agent") {
    const assignedId = typeof lead.assigned_to === "object" && lead.assigned_to ? (lead.assigned_to as { id: string }).id : lead.assigned_to;
    if (assignedId !== session!.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: activities } = await db
    .from("activities")
    .select("*, performed_by:profiles(id, name, role)")
    .eq("lead_id", id)
    .order("created_at", { ascending: false });

  return NextResponse.json({
    lead: mapLead(lead as Record<string, unknown>),
    activities: (activities ?? []).map((a) => mapActivity(a as Record<string, unknown>)),
  });
}

export async function PUT(req: NextRequest, ctx: Ctx) {
  const { session, error } = await requireSession();
  if (error) return error;

  const rl = rateLimitMiddleware(session!.user.email, session!.user.role);
  if (rl) return rl;

  const { id } = await ctx.params;
  if (!isValidUUID(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const db = supabaseAdmin();

  const { data: existing, error: fetchError } = await db.from("leads").select("*").eq("id", id).single();
  if (fetchError || !existing) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  if (session!.user.role === "agent" && existing.assigned_to !== session!.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  if (session!.user.role === "agent") delete body.assignedTo;

  const updates: Record<string, unknown> = { last_activity_at: new Date().toISOString() };
  const fieldMap: Record<string, string> = {
    name: "name", email: "email", phone: "phone", budget: "budget",
    status: "status", notes: "notes", source: "source",
    propertyInterest: "property_interest",
    assignedTo: "assigned_to",
    followUpDate: "follow_up_date",
    interestedIn: "interested_in",
    propertyType: "property_type",
    budgetMin: "budget_min",
    budgetMax: "budget_max",
  };

  for (const [camel, snake] of Object.entries(fieldMap)) {
    if (camel in body) {
      if (camel === "budget") {
        const { score, priority } = calculateLeadScore(Number(body.budget));
        updates.budget = Number(body.budget);
        updates.score = score;
        updates.priority = priority;
      } else if (["budgetMin", "budgetMax"].includes(camel)) {
        updates[snake] = body[camel] ? Number(body[camel]) : null;
      } else {
        updates[snake] = body[camel] ?? null;
      }
    }
  }

  const { data: updated, error: updateError } = await db
    .from("leads")
    .update(updates)
    .eq("id", id)
    .select(LEAD_SELECT)
    .single();

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  // Build activity records
  const activityInserts = [];

  if (body.status && body.status !== existing.status) {
    activityInserts.push({
      lead_id: id, performed_by: session!.user.id, type: "status_updated",
      description: `Status changed from "${existing.status}" to "${body.status}"`,
      metadata: { from: existing.status, to: body.status },
    });
  }

  if ("assignedTo" in body && body.assignedTo !== existing.assigned_to) {
    const type = existing.assigned_to ? "reassigned" : "assigned";
    activityInserts.push({
      lead_id: id, performed_by: session!.user.id, type,
      description: `Lead ${type} to new agent`,
      metadata: { from: existing.assigned_to, to: body.assignedTo },
    });

    if (body.assignedTo && isValidUUID(body.assignedTo)) {
      const { data: agent } = await db.from("profiles").select("name, email").eq("id", body.assignedTo).single();
      if (agent) {
        const lead = updated!;
        sendLeadAssignmentEmail({
          agentName: agent.name,
          agentEmail: agent.email,
          lead: { _id: lead.id, name: lead.name, email: lead.email, phone: lead.phone, budget: lead.budget, propertyInterest: lead.property_interest },
        }).catch(console.error);
      }
    }
  }

  if ("notes" in body) {
    activityInserts.push({
      lead_id: id, performed_by: session!.user.id, type: "notes_updated",
      description: "Notes were updated", metadata: {},
    });
  }

  if ("followUpDate" in body && body.followUpDate) {
    activityInserts.push({
      lead_id: id, performed_by: session!.user.id, type: "follow_up_set",
      description: `Follow-up scheduled for ${new Date(body.followUpDate).toLocaleDateString()}`,
      metadata: { date: body.followUpDate },
    });
  }

  if (activityInserts.length > 0) await db.from("activities").insert(activityInserts);

  return NextResponse.json(mapLead(updated as unknown as Record<string, unknown>));
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const { session, error } = await requireAdmin();
  if (error) return error;

  const { id } = await ctx.params;
  if (!isValidUUID(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const db = supabaseAdmin();

  const { data: lead, error: fetchError } = await db.from("leads").select("name").eq("id", id).single();
  if (fetchError || !lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  // Log before delete (activities are cascade-deleted with the lead)
  await db.from("activities").insert({
    lead_id: id, performed_by: session!.user.id, type: "lead_deleted",
    description: `Lead "${lead.name}" was deleted`, metadata: { name: lead.name },
  });

  await db.from("leads").delete().eq("id", id);

  return NextResponse.json({ message: "Lead deleted" });
}
