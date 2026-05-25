import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireSession, requireAdmin } from "@/lib/middleware";
import { mapProperty, mapLead, isValidUUID } from "@/lib/mappers";

type Ctx = { params: Promise<{ id: string }> };

const PROP_SELECT = "*, assigned_agent:profiles!properties_assigned_agent_fkey(id, name, email), created_by:profiles!properties_created_by_fkey(id, name)";

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { error } = await requireSession();
  if (error) return error;

  const { id } = await ctx.params;
  if (!isValidUUID(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const db = supabaseAdmin();

  const [{ data: property, error: propError }, { data: interestedLeads }] = await Promise.all([
    db.from("properties").select(PROP_SELECT).eq("id", id).single(),
    db.from("leads")
      .select("id, name, phone, budget, status, property_type, assigned_to:profiles!leads_assigned_to_fkey(id, name, email), created_at")
      .eq("interested_in", id),
  ]);

  if (propError || !property) return NextResponse.json({ error: "Property not found" }, { status: 404 });

  return NextResponse.json({
    property: mapProperty(property as Record<string, unknown>),
    interestedLeads: (interestedLeads ?? []).map((l) => mapLead(l as Record<string, unknown>)),
  });
}

export async function PUT(req: NextRequest, ctx: Ctx) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await ctx.params;
  if (!isValidUUID(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const db = supabaseAdmin();

  const { data: existing } = await db.from("properties").select("id").eq("id", id).single();
  if (!existing) return NextResponse.json({ error: "Property not found" }, { status: 404 });

  const body = await req.json();
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  const fieldMap: Record<string, string> = {
    title: "title", type: "type", status: "status", location: "location",
    description: "description", facing: "facing", features: "features", images: "images",
    price: "price", area: "area",
    areaUnit: "area_unit",
    bedrooms: "bedrooms", bathrooms: "bathrooms", floor: "floor",
    assignedAgent: "assigned_agent",
  };

  for (const [camel, snake] of Object.entries(fieldMap)) {
    if (camel in body) {
      if (["price", "area", "bedrooms", "bathrooms", "floor"].includes(camel)) {
        updates[snake] = body[camel] !== "" && body[camel] != null ? Number(body[camel]) : null;
      } else {
        updates[snake] = body[camel] ?? null;
      }
    }
  }

  const { data: updated, error: updateError } = await db
    .from("properties")
    .update(updates)
    .eq("id", id)
    .select(PROP_SELECT)
    .single();

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  return NextResponse.json(mapProperty(updated as Record<string, unknown>));
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await ctx.params;
  if (!isValidUUID(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const db = supabaseAdmin();

  const { data: property } = await db.from("properties").select("id").eq("id", id).single();
  if (!property) return NextResponse.json({ error: "Property not found" }, { status: 404 });

  // Unlink leads before delete
  await db.from("leads").update({ interested_in: null }).eq("interested_in", id);
  await db.from("properties").delete().eq("id", id);

  return NextResponse.json({ message: "Property deleted" });
}
