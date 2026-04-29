"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, AlertTriangle, Clock, Calendar } from "lucide-react";

interface Lead {
  _id: string; name: string; phone: string; propertyInterest: string;
  priority: string; followUpDate?: string; lastActivityAt: string;
}
interface RemindersData {
  overdueLeads: Lead[]; staleLeads: Lead[]; upcomingFollowUps: Lead[];
  counts: { overdue: number; stale: number; upcoming: number };
}

function LeadCard({ lead, href }: { lead: Lead; href: string }) {
  return (
    <Link href={href} className="block p-4 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium text-slate-800 text-sm">{lead.name}</p>
          <p className="text-xs text-slate-400">{lead.propertyInterest}</p>
          {lead.followUpDate && (
            <p className="text-xs text-red-500 mt-0.5">Due: {new Date(lead.followUpDate).toLocaleDateString("en-PK")}</p>
          )}
        </div>
        <span className={`badge-${lead.priority} shrink-0`}>{lead.priority}</span>
      </div>
    </Link>
  );
}

export default function AgentRemindersPage() {
  const [data, setData] = useState<RemindersData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reminders").then((r) => r.json()).then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-pulse space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-slate-200 rounded-xl" />)}</div>;
  if (!data) return null;

  const sections = [
    { title: "Overdue Follow-ups", icon: AlertTriangle, color: "border-l-red-400 bg-red-50", iconColor: "text-red-500", leads: data.overdueLeads, count: data.counts.overdue },
    { title: "Stale Leads", icon: Clock, color: "border-l-amber-400 bg-amber-50", iconColor: "text-amber-500", leads: data.staleLeads, count: data.counts.stale },
    { title: "Upcoming Follow-ups", icon: Calendar, color: "border-l-sky-400 bg-sky-50", iconColor: "text-sky-500", leads: data.upcomingFollowUps, count: data.counts.upcoming },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Reminders</h1>
        <p className="text-slate-500 text-sm">Leads requiring your attention</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {sections.map(({ title, icon: Icon, color, iconColor, count }) => (
          <div key={title} className={`card p-4 border-l-4 ${color}`}>
            <div className="flex items-center gap-2">
              <Icon className={`w-5 h-5 ${iconColor}`} />
              <span className="text-2xl font-bold text-slate-900">{count}</span>
            </div>
            <p className="text-sm text-slate-600 mt-1">{title}</p>
          </div>
        ))}
      </div>

      {sections.map(({ title, icon: Icon, iconColor, leads }) => (
        <div key={title} className="card overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
            <Icon className={`w-4 h-4 ${iconColor}`} />
            <h2 className="font-semibold text-slate-800 text-sm">{title}</h2>
          </div>
          {leads.length === 0 ? (
            <div className="p-6 text-center">
              <Bell className="w-8 h-8 text-slate-200 mx-auto mb-2" />
              <p className="text-sm text-slate-400">All clear!</p>
            </div>
          ) : (
            leads.map((l) => <LeadCard key={l._id} lead={l} href={`/agent/leads/${l._id}`} />)
          )}
        </div>
      ))}
    </div>
  );
}
