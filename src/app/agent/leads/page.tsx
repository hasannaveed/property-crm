"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Search, MessageCircle, ChevronLeft, ChevronRight } from "lucide-react";

interface Lead {
  _id: string; name: string; email: string; phone: string;
  propertyInterest: string; budget: number; status: string;
  priority: string; score: number; followUpDate: string | null;
}

function formatBudget(b: number) {
  if (b >= 10_000_000) return `${(b / 10_000_000).toFixed(1)}Cr`;
  if (b >= 100_000) return `${(b / 100_000).toFixed(1)}L`;
  return `PKR ${b.toLocaleString()}`;
}

const STATUS_COLORS: Record<string, string> = {
  new: "bg-sky-50 text-sky-600 border-sky-200",
  contacted: "bg-purple-50 text-purple-600 border-purple-200",
  "in-progress": "bg-amber-50 text-amber-600 border-amber-200",
  "site-visit": "bg-cyan-50 text-cyan-600 border-cyan-200",
  negotiation: "bg-orange-50 text-orange-600 border-orange-200",
  "closed-won": "bg-green-50 text-green-600 border-green-200",
  "closed-lost": "bg-slate-50 text-slate-500 border-slate-200",
};

export default function AgentLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchLeads = useCallback(async (page = 1) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (statusFilter) params.set("status", statusFilter);
    const res = await fetch(`/api/leads?${params}`);
    const data = await res.json();
    let result = data.leads as Lead[];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((l) => l.name.toLowerCase().includes(q) || l.phone.includes(q));
    }
    setLeads(result);
    setPagination(data.pagination);
    setLoading(false);
  }, [search, statusFilter]);

  useEffect(() => { fetchLeads(1); }, [fetchLeads]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Leads</h1>
        <p className="text-slate-500 text-sm">{pagination.total} leads assigned to you</p>
      </div>

      <div className="card p-4 flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input className="input pl-9" placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input w-40" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          {["new", "contacted", "in-progress", "site-visit", "negotiation", "closed-won", "closed-lost"].map((s) => (
            <option key={s} value={s}>{s.replace(/-/g, " ")}</option>
          ))}
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="text-left py-3 px-4 text-slate-500 font-medium">Lead</th>
                <th className="text-left py-3 px-4 text-slate-500 font-medium">Budget</th>
                <th className="text-left py-3 px-4 text-slate-500 font-medium">Priority</th>
                <th className="text-left py-3 px-4 text-slate-500 font-medium">Status</th>
                <th className="text-left py-3 px-4 text-slate-500 font-medium">Follow-up</th>
                <th className="text-left py-3 px-4 text-slate-500 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-slate-50 animate-pulse">
                    <td className="py-4 px-4"><div className="h-4 bg-slate-200 rounded w-28 mb-1" /><div className="h-3 bg-slate-100 rounded w-20" /></td>
                    <td className="py-4 px-4"><div className="h-4 bg-slate-200 rounded w-16" /></td>
                    <td className="py-4 px-4"><div className="h-5 bg-slate-200 rounded-full w-12" /></td>
                    <td className="py-4 px-4"><div className="h-5 bg-slate-200 rounded-full w-20" /></td>
                    <td className="py-4 px-4"><div className="h-4 bg-slate-200 rounded w-16" /></td>
                    <td className="py-4 px-4"><div className="h-8 bg-slate-200 rounded w-16" /></td>
                  </tr>
                ))
              ) : leads.length === 0 ? (
                <tr><td colSpan={6} className="py-12 text-center text-slate-400">No leads found</td></tr>
              ) : leads.map((l) => (
                <tr key={l._id} className={`border-b border-slate-50 hover:bg-slate-50 ${l.priority === "high" ? "border-l-4 border-l-red-400" : ""}`}>
                  <td className="py-3 px-4">
                    <Link href={`/agent/leads/${l._id}`} className="font-medium text-slate-800 hover:text-sky-600">{l.name}</Link>
                    <p className="text-xs text-slate-400">{l.propertyInterest}</p>
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-700">{formatBudget(l.budget)}</td>
                  <td className="py-3 px-4"><span className={`badge-${l.priority}`}>{l.priority}</span></td>
                  <td className="py-3 px-4">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${STATUS_COLORS[l.status] ?? ""}`}>{l.status.replace(/-/g, " ")}</span>
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-500">
                    {l.followUpDate ? new Date(l.followUpDate).toLocaleDateString("en-PK") : "—"}
                  </td>
                  <td className="py-3 px-4">
                    <a href={`https://wa.me/${l.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="inline-flex p-1.5 text-green-500 hover:bg-green-50 rounded-lg">
                      <MessageCircle className="w-4 h-4" />
                    </a>
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
    </div>
  );
}
