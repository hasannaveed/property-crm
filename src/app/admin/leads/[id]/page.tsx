"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, MessageCircle, Pencil, MapPin, Phone, Mail, DollarSign, User, Calendar, Tag } from "lucide-react";
import LeadModal from "@/components/leads/LeadModal";

interface Agent { _id: string; name: string; email: string; }
interface Lead {
  _id: string; name: string; email: string; phone: string; propertyInterest: string;
  budget: number; status: string; priority: string; score: number; notes: string;
  source: string; assignedTo: Agent | null; followUpDate: string | null;
}
interface Activity {
  _id: string; type: string; description: string; createdAt: string;
  performedBy: { name: string; role: string };
}

const ACTIVITY_EMOJI: Record<string, string> = {
  lead_created: "🆕", status_updated: "🔄", assigned: "👤", reassigned: "🔀",
  notes_updated: "📝", follow_up_set: "📅", priority_changed: "⚡", lead_deleted: "🗑️",
};

function formatBudget(b: number) {
  if (b >= 10_000_000) return `PKR ${(b / 10_000_000).toFixed(2)} Crore`;
  if (b >= 100_000) return `PKR ${(b / 100_000).toFixed(1)} Lakh`;
  return `PKR ${b.toLocaleString()}`;
}

export default function AdminLeadDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [lead, setLead] = useState<Lead | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    const [leadRes, agentsRes] = await Promise.all([fetch(`/api/leads/${id}`), fetch("/api/agents")]);
    const { lead, activities } = await leadRes.json();
    const { agents } = await agentsRes.json();
    setLead(lead);
    setActivities(activities);
    setAgents(agents ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [id]);

  const handleSave = async (form: Record<string, unknown>) => {
    const res = await fetch(`/api/leads/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const data = await res.json();
    if (!res.ok) throw data;
    await fetchData();
  };

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-8 bg-slate-200 rounded w-48" /><div className="h-48 bg-slate-200 rounded-xl" /></div>;
  if (!lead) return <p className="text-slate-500">Lead not found.</p>;

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500"><ArrowLeft className="w-5 h-5" /></button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{lead.name}</h1>
          <p className="text-slate-500 text-sm">{lead.propertyInterest}</p>
        </div>
        <div className="ml-auto flex gap-2">
          <a href={`https://wa.me/${lead.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="btn-secondary text-sm"><MessageCircle className="w-4 h-4 text-green-500" /> WhatsApp</a>
          <button onClick={() => setEditOpen(true)} className="btn-primary text-sm"><Pencil className="w-4 h-4" /> Edit</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="md:col-span-2 space-y-4">
          <div className="card p-5">
            <h2 className="font-semibold text-slate-800 mb-4">Lead Information</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {[
                { icon: Mail, label: "Email", value: lead.email },
                { icon: Phone, label: "Phone", value: lead.phone },
                { icon: DollarSign, label: "Budget", value: formatBudget(lead.budget) },
                { icon: Tag, label: "Source", value: lead.source?.replace(/-/g, " ") ?? "—" },
                { icon: User, label: "Assigned To", value: lead.assignedTo?.name ?? "Unassigned" },
                { icon: Calendar, label: "Follow-up", value: lead.followUpDate ? new Date(lead.followUpDate).toLocaleDateString("en-PK") : "Not set" },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-2">
                  <Icon className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-slate-400">{label}</p>
                    <p className="text-slate-700 font-medium">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <span className={`badge-${lead.priority} text-sm px-3 py-1`}>{lead.priority} priority</span>
            <span className="text-sm bg-sky-50 text-sky-600 border border-sky-200 rounded-full px-3 py-1 font-semibold">Score: {lead.score}/100</span>
          </div>

          {lead.notes && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-sm font-semibold text-amber-700 mb-1">Notes</p>
              <p className="text-sm text-amber-800 whitespace-pre-wrap">{lead.notes}</p>
            </div>
          )}
        </div>

        <div className="card p-5">
          <h2 className="font-semibold text-slate-800 mb-4">Activity Timeline</h2>
          <div className="relative">
            <div className="absolute left-3.5 top-0 bottom-0 w-px bg-slate-100" />
            <div className="space-y-4">
              {activities.length === 0 && <p className="text-sm text-slate-400">No activity yet</p>}
              {activities.map((a) => (
                <div key={a._id} className="flex gap-3 relative">
                  <div className="w-7 h-7 rounded-full bg-white border border-slate-200 flex items-center justify-center text-sm shrink-0 z-10">{ACTIVITY_EMOJI[a.type] ?? "●"}</div>
                  <div>
                    <p className="text-sm text-slate-700">{a.description}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{a.performedBy?.name} · {new Date(a.createdAt).toLocaleString("en-PK", { dateStyle: "short", timeStyle: "short" })}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <LeadModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        onSave={handleSave}
        lead={lead as unknown as Record<string, unknown>}
        agents={agents}
        isEditing
      />
    </div>
  );
}
