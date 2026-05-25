import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireSession } from "@/lib/middleware";
import { mapActivity } from "@/lib/mappers";

export async function GET(req: NextRequest) {
  const { session, error } = await requireSession();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const since = searchParams.get("since");
  const sinceDate = since ? new Date(since) : new Date(Date.now() - 15_000);

  const db = supabaseAdmin();

  let activityQuery = db
    .from("activities")
    .select("*, performed_by:profiles(id, name), lead:leads(id, name)")
    .gt("created_at", sinceDate.toISOString())
    .order("created_at", { ascending: false })
    .limit(20);

  if (session!.user.role === "agent") {
    const { data: assignedLeads } = await db
      .from("leads")
      .select("id")
      .eq("assigned_to", session!.user.id);

    const leadIds = (assignedLeads ?? []).map((l) => l.id);
    if (leadIds.length === 0) {
      return NextResponse.json({ activities: [], totalLeads: 0, timestamp: new Date().toISOString() });
    }
    activityQuery = activityQuery.in("lead_id", leadIds);
  }

  const [{ data: activities }, { count: totalLeads }] = await Promise.all([
    activityQuery,
    db.from("leads")
      .select("*", { count: "exact", head: true })
      .match(session!.user.role === "agent" ? { assigned_to: session!.user.id } : {}),
  ]);

  return NextResponse.json({
    activities: (activities ?? []).map((a) => mapActivity(a as Record<string, unknown>)),
    totalLeads: totalLeads ?? 0,
    timestamp: new Date().toISOString(),
  });
}
