"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Plus, Search, MessageCircle, Pencil, Trash2, ChevronLeft, ChevronRight, Download } from "lucide-react";
import LeadModal from "@/components/leads/LeadModal";

interface Agent { _id: string; name: string; email: string; }
interface Lead {
  _id: string; name: string; email: string; phone: string;
  propertyInterest: string; budget: number; status: string;
  priority: string; score: number; source: string;
  assignedTo: Agent | null; followUpDate: string | null; notes: string;
}

const STATUS_OPTIONS = ["", "new", "contacted", "in-progress", "site-visit", "negotiation", "closed-won", "closed-lost"];
const PRIORITY_OPTIONS = ["", "high", "medium", "low"];

function formatBudget(b: number) {
  if (b >= 10_000_000) return `${(b / 10_000_000).toFixed(1)}Cr`;
  if (b >= 100_000) return `${(b / 100_000).toFixed(1)}L`;
  return `PKR ${b.toLocaleString()}`;
}

function PriorityBadge({ p }: { p: string }) {
  return <span className={`badge-${p}`}>{p}</span>;
}

function StatusBadge({ s }: { s: string }) {
  const colors: Record<string, string> = {
    new: "bg-sky-50 text-sky-600 border-sky-200",
    contacted: "bg-purple-50 text-purple-600 border-purple-200",
    "in-progress": "bg-amber-50 text-amber-600 border-amber-200",
    "site-visit": "bg-cyan-50 text-cyan-600 border-cyan-200",
    negotiation: "bg-orange-50 text-orange-600 border-orange-200",
    "closed-won": "bg-green-50 text-green-600 border-green-200",
    "closed-lost": "bg-slate-50 text-slate-500 border-slate-200",
  };
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${colors[s] ?? "bg-slate-50 text-slate-600 border-slate-200"}`}>{s.replace(/-/g, " ")}</span>;
}

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [filters, setFilters] = useState({ search: "", status: "", priority: "" });
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editLead, setEditLead] = useState<Lead | null>(null);

  const fetchLeads = useCallback(async (page = 1) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (filters.status) params.set("status", filters.status);
    if (filters.priority) params.set("priority", filters.priority);
    const res = await fetch(`/api/leads?${params}`);
    const data = await res.json();
    let result = data.leads as Lead[];
    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter((l) => l.name.toLowerCase().includes(q) || l.email.toLowerCase().includes(q) || l.phone.includes(q));
    }
    setLeads(result);
    setPagination(data.pagination);
    setLoading(false);
  }, [filters]);

  useEffect(() => { fetchLeads(1); }, [fetchLeads]);

  useEffect(() => {
    fetch("/api/agents").then((r) => r.json()).then((d) => setAgents(d.agents ?? []));
  }, []);

  const handleSave = async (form: Record<string, unknown>) => {
    const url = editLead ? `/api/leads/${editLead._id}` : "/api/leads";
    const method = editLead ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const data = await res.json();
    if (!res.ok) throw data;
    await fetchLeads(pagination.page);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete lead "${name}"?`)) return;
    await fetch(`/api/leads/${id}`, { method: "DELETE" });
    await fetchLeads(pagination.page);
  };

  const handleAssign = async (leadId: string, agentId: string) => {
    await fetch(`/api/leads/${leadId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ assignedTo: agentId || null }) });
    await fetchLeads(pagination.page);
  };

  const exportCSV = () => {
    const rows = [["Name", "Email", "Phone", "Property", "Budget", "Priority", "Status", "Assigned To"]];
    leads.forEach((l) => rows.push([l.name, l.email, l.phone, l.propertyInterest, String(l.budget), l.priority, l.status, l.assignedTo?.name ?? ""]));
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "leads.csv";
    a.click();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">All Leads</h1>
          <p className="text-slate-500 text-sm">{pagination.total} total leads</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="btn-secondary text-sm"><Download className="w-4 h-4" /> Export CSV</button>
          <button onClick={() => { setEditLead(null); setModalOpen(true); }} className="btn-primary text-sm"><Plus className="w-4 h-4" /> Add Lead</button>
        </div>
      </div>

      <div className="card p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input className="input pl-9" placeholder="Search name, email, phone…" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
        </div>
        <select className="input w-40" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
          <option value="">All Status</option>
          {STATUS_OPTIONS.filter(Boolean).map((s) => <option key={s} value={s}>{s.replace(/-/g, " ")}</option>)}
        </select>
        <select className="input w-36" value={filters.priority} onChange={(e) => setFilters({ ...filters, priority: e.target.value })}>
          <option value="">All Priority</option>
          {PRIORITY_OPTIONS.filter(Boolean).map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="text-left py-3 px-4 text-slate-500 font-medium">Lead</th>
                <th className="text-left py-3 px-4 text-slate-500 font-medium">Budget / Score</th>
                <th className="text-left py-3 px-4 text-slate-500 font-medium">Priority</th>
                <th className="text-left py-3 px-4 text-slate-500 font-medium">Status</th>
                <th className="text-left py-3 px-4 text-slate-500 font-medium">Assigned To</th>
                <th className="text-left py-3 px-4 text-slate-500 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-slate-50 animate-pulse">
                    <td className="py-4 px-4"><div className="h-4 bg-slate-200 rounded w-32 mb-1" /><div className="h-3 bg-slate-100 rounded w-24" /></td>
                    <td className="py-4 px-4"><div className="h-4 bg-slate-200 rounded w-20" /></td>
                    <td className="py-4 px-4"><div className="h-5 bg-slate-200 rounded-full w-14" /></td>
                    <td className="py-4 px-4"><div className="h-5 bg-slate-200 rounded-full w-20" /></td>
                    <td className="py-4 px-4"><div className="h-8 bg-slate-200 rounded w-28" /></td>
                    <td className="py-4 px-4"><div className="h-8 bg-slate-200 rounded w-20" /></td>
                  </tr>
                ))
              ) : leads.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-slate-400">No leads found</td></tr>
              ) : leads.map((lead) => (
                <tr key={lead._id} className={`border-b border-slate-50 hover:bg-slate-50 ${lead.priority === "high" ? "border-l-4 border-l-red-400" : ""}`}>
                  <td className="py-3 px-4">
                    <Link href={`/admin/leads/${lead._id}`} className="font-medium text-slate-800 hover:text-sky-600">{lead.name}</Link>
                    <p className="text-xs text-slate-400">{lead.email}</p>
                    <p className="text-xs text-slate-400">{lead.propertyInterest}</p>
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-medium text-slate-800">{formatBudget(lead.budget)}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-sky-500 rounded-full" style={{ width: `${lead.score}%` }} />
                      </div>
                      <span className="text-xs text-slate-400">{lead.score}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4"><PriorityBadge p={lead.priority} /></td>
                  <td className="py-3 px-4"><StatusBadge s={lead.status} /></td>
                  <td className="py-3 px-4">
                    <select
                      className="input text-xs py-1 w-36"
                      value={lead.assignedTo?._id ?? ""}
                      onChange={(e) => handleAssign(lead._id, e.target.value)}
                    >
                      <option value="">Unassigned</option>
                      {agents.map((a) => <option key={a._id} value={a._id}>{a.name}</option>)}
                    </select>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1">
                      <a href={`https://wa.me/${lead.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="p-1.5 text-green-500 hover:bg-green-50 rounded-lg">
                        <MessageCircle className="w-4 h-4" />
                      </a>
                      <button onClick={() => { setEditLead(lead); setModalOpen(true); }} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(lead._id, lead.name)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <span className="text-sm text-slate-500">Page {pagination.page} of {pagination.pages}</span>
            <div className="flex gap-1">
              <button onClick={() => fetchLeads(pagination.page - 1)} disabled={pagination.page === 1} className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-40">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => fetchLeads(pagination.page + 1)} disabled={pagination.page === pagination.pages} className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-40">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <LeadModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditLead(null); }}
        onSave={handleSave}
        lead={editLead as Record<string, unknown> | null}
        agents={agents}
        isEditing={!!editLead}
      />
    </div>
  );
}
