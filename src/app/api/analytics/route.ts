import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAdmin } from "@/lib/middleware";
import { mapLead, mapProperty } from "@/lib/mappers";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const db = supabaseAdmin();
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    { data: allLeads },
    { data: recentLeads },
    { data: allProperties },
    { data: recentProperties },
    { data: agentProfiles },
  ] = await Promise.all([
    db.from("leads").select("id, status, priority, assigned_to, follow_up_date, last_activity_at, created_at"),
    db.from("leads").select("*, assigned_to:profiles!leads_assigned_to_fkey(id, name, email)").order("created_at", { ascending: false }).limit(5),
    db.from("properties").select("id, status, type, created_at"),
    db.from("properties").select("*").order("created_at", { ascending: false }).limit(5),
    db.from("profiles").select("id, name, email").eq("role", "agent"),
  ]);

  const leads = allLeads ?? [];
  const totalLeads = leads.length;
  const highPriorityCount = leads.filter((l) => l.priority === "high").length;
  const closedWonCount = leads.filter((l) => l.status === "closed-won").length;
  const overdueCount = leads.filter(
    (l) => l.follow_up_date && new Date(l.follow_up_date) < now && !["closed-won", "closed-lost"].includes(l.status)
  ).length;

  // by status
  const byStatus = Object.entries(
    leads.reduce((acc, l) => { acc[l.status] = (acc[l.status] ?? 0) + 1; return acc; }, {} as Record<string, number>)
  ).map(([_id, count]) => ({ _id, count }));

  // by priority
  const byPriority = Object.entries(
    leads.reduce((acc, l) => { acc[l.priority] = (acc[l.priority] ?? 0) + 1; return acc; }, {} as Record<string, number>)
  ).map(([_id, count]) => ({ _id, count }));

  // weekly trend
  const weeklyLeads = leads.filter((l) => new Date(l.created_at) >= sevenDaysAgo);
  const trendMap = weeklyLeads.reduce((acc, l) => {
    const date = l.created_at.split("T")[0];
    acc[date] = (acc[date] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const weeklyTrend = Object.entries(trendMap)
    .map(([_id, count]) => ({ _id, count }))
    .sort((a, b) => a._id.localeCompare(b._id));

  // by agent
  const agentLeadMap = leads.reduce((acc, l) => {
    if (!l.assigned_to) return acc;
    const id = l.assigned_to as string;
    acc[id] = acc[id] ?? { totalLeads: 0, closedWon: 0, highPriority: 0 };
    acc[id].totalLeads++;
    if (l.status === "closed-won") acc[id].closedWon++;
    if (l.priority === "high") acc[id].highPriority++;
    return acc;
  }, {} as Record<string, { totalLeads: number; closedWon: number; highPriority: number }>);

  const byAgent = (agentProfiles ?? [])
    .filter((p) => agentLeadMap[p.id])
    .map((p) => ({ ...agentLeadMap[p.id], _id: p.id, name: p.name, email: p.email }))
    .sort((a, b) => b.totalLeads - a.totalLeads);

  // properties
  const props = allProperties ?? [];
  const totalProperties = props.length;
  const propStatusMap = props.reduce((acc, p) => { acc[p.status] = (acc[p.status] ?? 0) + 1; return acc; }, {} as Record<string, number>);
  const propertyByStatus = Object.entries(propStatusMap).map(([_id, count]) => ({ _id, count }));
  const propertyByType = Object.entries(
    props.reduce((acc, p) => { acc[p.type] = (acc[p.type] ?? 0) + 1; return acc; }, {} as Record<string, number>)
  ).map(([_id, count]) => ({ _id, count }));

  return NextResponse.json({
    totalLeads,
    highPriorityCount,
    closedWonCount,
    overdueCount,
    byStatus,
    byPriority,
    byAgent,
    recentLeads: (recentLeads ?? []).map((l) => mapLead(l as Record<string, unknown>)),
    weeklyTrend,
    totalProperties,
    availableProperties: propStatusMap.available ?? 0,
    reservedProperties: propStatusMap.reserved ?? 0,
    soldProperties: propStatusMap.sold ?? 0,
    propertyByType,
    recentProperties: (recentProperties ?? []).map((p) => mapProperty(p as Record<string, unknown>)),
  });
}
