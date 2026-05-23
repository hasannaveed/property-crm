"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid } from "recharts";
import { TrendingUp, AlertTriangle, Trophy, Clock, Home, CheckCircle, PauseCircle, DollarSign, MapPin } from "lucide-react";

interface AnalyticsData {
  totalLeads: number;
  highPriorityCount: number;
  closedWonCount: number;
  overdueCount: number;
  byStatus: { _id: string; count: number }[];
  byPriority: { _id: string; count: number }[];
  byAgent: { _id: string; name: string; email: string; totalLeads: number; closedWon: number; highPriority: number }[];
  weeklyTrend: { _id: string; count: number }[];
  totalProperties: number;
  availableProperties: number;
  reservedProperties: number;
  soldProperties: number;
  propertyByType: { _id: string; count: number }[];
  recentProperties: { _id: string; title: string; type: string; status: string; price: number; location: string }[];
}

const STATUS_COLORS: Record<string, string> = {
  new: "#6366f1",
  contacted: "#8b5cf6",
  "in-progress": "#f59e0b",
  "site-visit": "#06b6d4",
  negotiation: "#f97316",
  "closed-won": "#22c55e",
  "closed-lost": "#ef4444",
};

const PRIORITY_COLORS = { high: "#ef4444", medium: "#f59e0b", low: "#22c55e" };
const TYPE_COLORS: Record<string, string> = { plot: "#f59e0b", house: "#10b981", apartment: "#6366f1" };

function formatPrice(p: number) {
  if (p >= 10_000_000) return `${(p / 10_000_000).toFixed(1)}Cr`;
  if (p >= 100_000) return `${(p / 100_000).toFixed(0)}L`;
  return `${p.toLocaleString()}`;
}

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number | string; color: string }) {
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900">{typeof value === "number" ? value.toLocaleString() : value}</p>
        <p className="text-sm text-slate-500">{label}</p>
      </div>
    </div>
  );
}

const PROP_STATUS_BADGE: Record<string, string> = {
  available: "bg-emerald-50 text-emerald-700",
  reserved: "bg-amber-50 text-amber-700",
  sold: "bg-rose-50 text-rose-700",
};

export default function AdminDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-48" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <div key={i} className="h-24 bg-slate-200 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div className="h-64 bg-slate-200 rounded-xl" />
          <div className="h-64 bg-slate-200 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const trendData = data.weeklyTrend.map((d) => ({ date: d._id.slice(5), leads: d.count }));
  const statusData = data.byStatus.map((s) => ({ name: s._id.replace(/-/g, " "), value: s.count, color: STATUS_COLORS[s._id] ?? "#94a3b8" }));
  const priorityData = data.byPriority.map((p) => ({ name: p._id, value: p.count, color: PRIORITY_COLORS[p._id as keyof typeof PRIORITY_COLORS] ?? "#94a3b8" }));
  const propTypeData = (data.propertyByType ?? []).map((t) => ({ name: t._id, value: t.count, color: TYPE_COLORS[t._id] ?? "#94a3b8" }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Overview of your CRM activity</p>
      </div>

      {/* Lead Stats */}
      <div>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Leads</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={TrendingUp} label="Total Leads" value={data.totalLeads} color="bg-indigo-500" />
          <StatCard icon={AlertTriangle} label="High Priority" value={data.highPriorityCount} color="bg-red-500" />
          <StatCard icon={Trophy} label="Closed Won" value={data.closedWonCount} color="bg-emerald-500" />
          <StatCard icon={Clock} label="Overdue Follow-ups" value={data.overdueCount} color="bg-amber-500" />
        </div>
      </div>

      {/* Property Stats */}
      <div>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Properties</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Home} label="Total Properties" value={data.totalProperties ?? 0} color="bg-slate-600" />
          <StatCard icon={CheckCircle} label="Available" value={data.availableProperties ?? 0} color="bg-emerald-500" />
          <StatCard icon={PauseCircle} label="Reserved" value={data.reservedProperties ?? 0} color="bg-amber-500" />
          <StatCard icon={DollarSign} label="Sold" value={data.soldProperties ?? 0} color="bg-rose-500" />
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-5 lg:col-span-2">
          <h2 className="font-semibold text-slate-800 mb-4">Weekly Lead Trend</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="leads" stroke="#6366f1" strokeWidth={2} dot={{ fill: "#6366f1" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h2 className="font-semibold text-slate-800 mb-4">Properties by Type</h2>
          {propTypeData.length === 0 ? (
            <div className="h-50 flex items-center justify-center text-sm text-slate-400">No properties yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={propTypeData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" nameKey="name">
                  {propTypeData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(v, n) => [v, String(n).charAt(0).toUpperCase() + String(n).slice(1)]} />
                <Legend formatter={(v) => v.charAt(0).toUpperCase() + v.slice(1)} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Priority + Status charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h2 className="font-semibold text-slate-800 mb-4">Priority Distribution</h2>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={priorityData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" nameKey="name">
                {priorityData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h2 className="font-semibold text-slate-800 mb-4">Status Distribution</h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={statusData} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 12 }} allowDecimals={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={90} />
              <Tooltip />
              <Bar dataKey="value" radius={4}>
                {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Properties */}
      {(data.recentProperties ?? []).length > 0 && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800">Recent Properties</h2>
            <Link href="/admin/inventory" className="text-sm text-indigo-600 hover:text-indigo-700">View all →</Link>
          </div>
          <div className="space-y-2">
            {data.recentProperties.map((p) => (
              <Link key={p._id} href={`/admin/inventory/${p._id}`} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-slate-50 transition-colors group">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate group-hover:text-indigo-700">{p.title}</p>
                  <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                    <MapPin className="w-3 h-3" />{p.location}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-3">
                  <span className="text-sm font-semibold text-slate-700">{formatPrice(p.price)}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full capitalize font-medium ${PROP_STATUS_BADGE[p.status] ?? "bg-slate-100 text-slate-600"}`}>
                    {p.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Agent Performance */}
      {data.byAgent.length > 0 && (
        <div className="card p-5">
          <h2 className="font-semibold text-slate-800 mb-4">Agent Performance</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-2 px-3 text-slate-500 font-medium">Agent</th>
                  <th className="text-right py-2 px-3 text-slate-500 font-medium">Total</th>
                  <th className="text-right py-2 px-3 text-slate-500 font-medium">Closed Won</th>
                  <th className="text-right py-2 px-3 text-slate-500 font-medium">High Priority</th>
                  <th className="text-right py-2 px-3 text-slate-500 font-medium">Win Rate</th>
                </tr>
              </thead>
              <tbody>
                {data.byAgent.map((a) => (
                  <tr key={a._id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="py-2.5 px-3">
                      <p className="font-medium text-slate-800">{a.name}</p>
                      <p className="text-xs text-slate-400">{a.email}</p>
                    </td>
                    <td className="text-right py-2.5 px-3 text-slate-700">{a.totalLeads}</td>
                    <td className="text-right py-2.5 px-3 text-emerald-600 font-medium">{a.closedWon}</td>
                    <td className="text-right py-2.5 px-3 text-red-500">{a.highPriority}</td>
                    <td className="text-right py-2.5 px-3 text-slate-700">
                      {a.totalLeads > 0 ? `${Math.round((a.closedWon / a.totalLeads) * 100)}%` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
