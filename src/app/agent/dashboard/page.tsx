"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { MessageCircle, AlertTriangle, Clock, Calendar, List } from "lucide-react";

interface Lead {
  _id: string; name: string; phone: string; propertyInterest: string;
  budget: number; priority: string; status: string; followUpDate?: string;
}
interface RemindersData {
  overdueLeads: Lead[]; staleLeads: Lead[]; upcomingFollowUps: Lead[];
  counts: { overdue: number; stale: number; upcoming: number };
}

function formatBudget(b: number) {
  if (b >= 10_000_000) return `${(b / 10_000_000).toFixed(1)}Cr`;
  if (b >= 100_000) return `${(b / 100_000).toFixed(1)}L`;
  return `PKR ${b.toLocaleString()}`;
}

export default function AgentDashboard() {
  const [firstName, setFirstName] = useState("Agent");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [reminders, setReminders] = useState<RemindersData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabaseBrowser().auth.getUser().then(({ data }) => {
      if (data.user) setFirstName(data.user.user_metadata?.name?.split(" ")[0] ?? "Agent");
    });
    Promise.all([fetch("/api/leads?limit=50"), fetch("/api/reminders")])
      .then(([leadsRes, remindersRes]) => Promise.all([leadsRes.json(), remindersRes.json()]))
      .then(([leadsData, remindersData]) => {
        setLeads(leadsData.leads ?? []);
        setReminders(remindersData);
      })
      .finally(() => setLoading(false));
  }, []);
  const highPriorityLeads = leads.filter((l) => l.priority === "high").slice(0, 5);

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-slate-200 rounded w-56" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-slate-200 rounded-xl" />)}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Good day, {firstName}!</h1>
        <p className="text-slate-500 text-sm">Here&apos;s your leads overview</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: List, label: "My Leads", value: leads.length, color: "bg-sky-500" },
          { icon: AlertTriangle, label: "Overdue", value: reminders?.counts.overdue ?? 0, color: "bg-red-500" },
          { icon: Clock, label: "Stale Leads", value: reminders?.counts.stale ?? 0, color: "bg-amber-500" },
          { icon: Calendar, label: "Upcoming", value: reminders?.counts.upcoming ?? 0, color: "bg-green-500" },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="card p-5 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{value}</p>
              <p className="text-sm text-slate-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {highPriorityLeads.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <h2 className="font-semibold text-slate-800 text-sm">High Priority Leads</h2>
          </div>
          {highPriorityLeads.map((l) => (
            <div key={l._id} className="flex items-center justify-between p-4 border-b border-slate-50 last:border-0 hover:bg-slate-50">
              <div>
                <Link href={`/agent/leads/${l._id}`} className="font-medium text-slate-800 text-sm hover:text-sky-600">{l.name}</Link>
                <p className="text-xs text-slate-400">{l.propertyInterest} · {formatBudget(l.budget)}</p>
              </div>
              <a href={`https://wa.me/${l.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="p-2 text-green-500 hover:bg-green-50 rounded-lg">
                <MessageCircle className="w-4 h-4" />
              </a>
            </div>
          ))}
        </div>
      )}

      {(reminders?.overdueLeads?.length ?? 0) > 0 && (
        <div className="card overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
            <Clock className="w-4 h-4 text-red-500" />
            <h2 className="font-semibold text-slate-800 text-sm">Overdue Follow-ups</h2>
          </div>
          {reminders!.overdueLeads.slice(0, 3).map((l) => (
            <div key={l._id} className="flex items-center justify-between p-4 border-b border-slate-50 last:border-0">
              <div>
                <Link href={`/agent/leads/${l._id}`} className="font-medium text-slate-800 text-sm hover:text-sky-600">{l.name}</Link>
                {l.followUpDate && <p className="text-xs text-red-500">Due: {new Date(l.followUpDate).toLocaleDateString("en-PK")}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
