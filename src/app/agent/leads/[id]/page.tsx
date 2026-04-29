"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, MessageCircle, CheckCircle } from "lucide-react";

interface Lead {
  _id: string; name: string; email: string; phone: string; propertyInterest: string;
  budget: number; status: string; priority: string; score: number; notes: string;
  source: string; assignedTo: { name: string } | null; followUpDate: string | null;
}
interface Activity {
  _id: string; type: string; description: string; createdAt: string;
  performedBy: { name: string };
}

const ACTIVITY_EMOJI: Record<string, string> = {
  lead_created: "🆕", status_updated: "🔄", assigned: "👤", reassigned: "🔀",
  notes_updated: "📝", follow_up_set: "📅", priority_changed: "⚡", lead_deleted: "🗑️",
};

const STATUS_OPTIONS = ["new", "contacted", "in-progress", "site-visit", "negotiation", "closed-won", "closed-lost"];

function formatBudget(b: number) {
  if (b >= 10_000_000) return `PKR ${(b / 10_000_000).toFixed(2)} Crore`;
  if (b >= 100_000) return `PKR ${(b / 100_000).toFixed(1)} Lakh`;
  return `PKR ${b.toLocaleString()}`;
}

export default function AgentLeadDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [lead, setLead] = useState<Lead | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ status: "", followUpDate: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const fetchData = async () => {
    const res = await fetch(`/api/leads/${id}`);
    const data = await res.json();
    setLead(data.lead);
    setActivities(data.activities ?? []);
    setForm({
      status: data.lead?.status ?? "",
      followUpDate: data.lead?.followUpDate ? String(data.lead.followUpDate).slice(0, 10) : "",
      notes: data.lead?.notes ?? "",
    });
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await fetch(`/api/leads/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: form.status, followUpDate: form.followUpDate || null, notes: form.notes }),
    });
    await fetchData();
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-8 bg-slate-200 rounded w-48" /><div className="h-48 bg-slate-200 rounded-xl" /></div>;
  if (!lead) return <p className="text-slate-500">Lead not found.</p>;

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500"><ArrowLeft className="w-5 h-5" /></button>
        <div>
          <h1 className="text-xl font-bold text-slate-900">{lead.name}</h1>
          <p className="text-slate-500 text-sm">{lead.propertyInterest}</p>
        </div>
        <a href={`https://wa.me/${lead.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="ml-auto btn-secondary text-sm">
          <MessageCircle className="w-4 h-4 text-green-500" /> WhatsApp
        </a>
      </div>

      <div className="card p-5">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
          {[
            { label: "Email", value: lead.email },
            { label: "Phone", value: lead.phone },
            { label: "Budget", value: formatBudget(lead.budget) },
            { label: "Source", value: lead.source?.replace(/-/g, " ") ?? "—" },
            { label: "Score", value: `${lead.score}/100` },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs text-slate-400">{label}</p>
              <p className="text-slate-700 font-medium mt-0.5">{value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="card p-5">
          <h2 className="font-semibold text-slate-800 mb-4">Update Lead</h2>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="label">Status</label>
              <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace(/-/g, " ")}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Follow-up Date</label>
              <input type="date" className="input" value={form.followUpDate} onChange={(e) => setForm({ ...form, followUpDate: e.target.value })} />
            </div>
            <div>
              <label className="label">Notes</label>
              <textarea className="input" rows={4} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Add notes about this lead…" />
            </div>
            <button type="submit" disabled={saving} className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg font-medium transition-colors ${saved ? "bg-green-500 text-white" : "btn-primary"}`}>
              {saving ? "Saving…" : saved ? <><CheckCircle className="w-4 h-4" /> Saved!</> : "Save Changes"}
            </button>
          </form>
        </div>

        <div className="card p-5">
          <h2 className="font-semibold text-slate-800 mb-4">Activity History</h2>
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {activities.length === 0 && <p className="text-sm text-slate-400">No activity yet</p>}
            {activities.map((a) => (
              <div key={a._id} className="flex gap-2.5 text-sm">
                <span className="text-base shrink-0">{ACTIVITY_EMOJI[a.type] ?? "●"}</span>
                <div>
                  <p className="text-slate-700">{a.description}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{a.performedBy?.name} · {new Date(a.createdAt).toLocaleString("en-PK", { dateStyle: "short", timeStyle: "short" })}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
