import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAdmin } from "@/lib/middleware";
import { mapActivity } from "@/lib/mappers";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const db = supabaseAdmin();
  const { data, error: dbError } = await db
    .from("activities")
    .select("*, performed_by:profiles(id, name, role), lead:leads(id, name)")
    .order("created_at", { ascending: false })
    .limit(100);

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  return NextResponse.json({ activities: (data ?? []).map((a) => mapActivity(a as Record<string, unknown>)) });
}
