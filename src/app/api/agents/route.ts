import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAdmin } from "@/lib/middleware";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const db = supabaseAdmin();
  const { data, error: dbError } = await db
    .from("profiles")
    .select("id, name, email, phone, created_at")
    .eq("role", "agent")
    .eq("is_active", true);

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  return NextResponse.json({ agents: (data ?? []).map((a) => ({ ...a, _id: a.id })) });
}
