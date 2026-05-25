import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireSession } from "@/lib/middleware";
import { mapLead } from "@/lib/mappers";

export async function GET() {
  const { session, error } = await requireSession();
  if (error) return error;

  const db = supabaseAdmin();
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  const CLOSED = ["closed-won", "closed-lost"];
  const JOIN = "*, assigned_to:profiles!leads_assigned_to_fkey(id, name, email)";

  let baseQuery = db.from("leads").select(JOIN).not("status", "in", `(${CLOSED.join(",")})`);
  if (session!.user.role === "agent") baseQuery = baseQuery.eq("assigned_to", session!.user.id);

  const [{ data: overdueLeads }, { data: staleLeads }, { data: upcomingFollowUps }] = await Promise.all([
    baseQuery.not("follow_up_date", "is", null).lt("follow_up_date", now.toISOString()).order("follow_up_date").limit(20),
    baseQuery.lt("last_activity_at", sevenDaysAgo.toISOString()).is("follow_up_date", null).order("last_activity_at").limit(20),
    baseQuery.gte("follow_up_date", now.toISOString()).lte("follow_up_date", threeDaysFromNow.toISOString()).order("follow_up_date").limit(20),
  ]);

  const map = (rows: unknown[]) => rows.map((l) => mapLead(l as Record<string, unknown>));

  return NextResponse.json({
    overdueLeads: map(overdueLeads ?? []),
    staleLeads: map(staleLeads ?? []),
    upcomingFollowUps: map(upcomingFollowUps ?? []),
    counts: {
      overdue: (overdueLeads ?? []).length,
      stale: (staleLeads ?? []).length,
      upcoming: (upcomingFollowUps ?? []).length,
    },
  });
}
