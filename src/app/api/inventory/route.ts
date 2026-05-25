import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireSession, requireAdmin } from "@/lib/middleware";
import { mapProperty } from "@/lib/mappers";

export async function GET(req: NextRequest) {
  const { error } = await requireSession();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const status = searchParams.get("status");
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const location = searchParams.get("location");
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 20)));
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const db = supabaseAdmin();
  let query = db
    .from("properties")
    .select("*, assigned_agent:profiles!properties_assigned_agent_fkey(id, name, email), created_by:profiles!properties_created_by_fkey(id, name)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (type && type !== "all") query = query.eq("type", type);
  if (status) query = query.eq("status", status);
  if (minPrice) query = query.gte("price", Number(minPrice));
  if (maxPrice) query = query.lte("price", Number(maxPrice));
  if (location) query = query.ilike("location", `%${location}%`);

  const { data, count, error: dbError } = await query;
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  // Status counts (only when no filters applied)
  let statusCounts: Record<string, number> | undefined;
  if (!type && !status && !minPrice && !maxPrice && !location) {
    const { data: allProps } = await db.from("properties").select("status");
    if (allProps) {
      statusCounts = { available: 0, reserved: 0, sold: 0 };
      for (const p of allProps) statusCounts[p.status] = (statusCounts[p.status] ?? 0) + 1;
    }
  }

  return NextResponse.json({
    properties: (data ?? []).map((p) => mapProperty(p as Record<string, unknown>)),
    pagination: { page, limit, total: count ?? 0, pages: Math.ceil((count ?? 0) / limit) },
    ...(statusCounts ? { statusCounts } : {}),
  });
}

export async function POST(req: NextRequest) {
  const { session, error } = await requireAdmin();
  if (error) return error;

  const body = await req.json();
  const { title, type, price, area, location } = body;

  if (!title?.trim()) return NextResponse.json({ error: "Title is required" }, { status: 422 });
  if (!["plot", "house", "apartment"].includes(type)) return NextResponse.json({ error: "Invalid property type" }, { status: 422 });
  if (!price || Number(price) <= 0) return NextResponse.json({ error: "Valid price is required" }, { status: 422 });
  if (!area || Number(area) <= 0) return NextResponse.json({ error: "Valid area is required" }, { status: 422 });
  if (!location?.trim()) return NextResponse.json({ error: "Location is required" }, { status: 422 });

  const db = supabaseAdmin();
  const { data: property, error: dbError } = await db
    .from("properties")
    .insert({
      title: body.title.trim(),
      type: body.type,
      status: body.status ?? "available",
      price: Number(body.price),
      area: Number(body.area),
      area_unit: body.areaUnit ?? "marla",
      location: body.location.trim(),
      description: body.description ?? "",
      bedrooms: body.bedrooms ? Number(body.bedrooms) : null,
      bathrooms: body.bathrooms ? Number(body.bathrooms) : null,
      floor: body.floor ? Number(body.floor) : null,
      facing: body.facing ?? "",
      features: Array.isArray(body.features) ? body.features : [],
      images: Array.isArray(body.images) ? body.images : [],
      assigned_agent: body.assignedAgent || null,
      created_by: session!.user.id,
    })
    .select()
    .single();

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  return NextResponse.json(mapProperty(property as Record<string, unknown>), { status: 201 });
}
