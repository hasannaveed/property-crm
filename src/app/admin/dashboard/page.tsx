"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid } from "recharts";
import { TrendingUp, AlertTriangle, Trophy, Clock } from "lucide-react";

interface AnalyticsData {
  totalLeads: number;
  highPriorityCount: number;
  closedWonCount: number;
  overdueCount: number;
  byStatus: { _id: string; count: number }[];
  byPriority: { _id: string; count: number }[];
  byAgent: { _id: string; name: string; email: string; totalLeads: number; closedWon: number; highPriority: number }[];
  weeklyTrend: { _id: string; count: number }[];
}

const STATUS_COLORS: Record<string, string> = {
  new: "#0ea5e9",
  contacted: "#8b5cf6",
  "in-progress": "#f59e0b",
  "site-visit": "#06b6d4",
  negotiation: "#f97316",
  "closed-won": "#22c55e",
  "closed-lost": "#ef4444",
};

const PRIORITY_COLORS = { high: "#ef4444", medium: "#f59e0b", low: "#22c55e" };

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number; color: string }) {
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900">{value.toLocaleString()}</p>
        <p className="text-sm text-slate-500">{label}</p>
      </div>
    </div>
  );
}

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
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-slate-200 rounded-xl" />)}
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Overview of your CRM activity</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={TrendingUp} label="Total Leads" value={data.totalLeads} color="bg-sky-500" />
        <StatCard icon={AlertTriangle} label="High Priority" value={data.highPriorityCount} color="bg-red-500" />
        <StatCard icon={Trophy} label="Closed Won" value={data.closedWonCount} color="bg-green-500" />
        <StatCard icon={Clock} label="Overdue Follow-ups" value={data.overdueCount} color="bg-amber-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h2 className="font-semibold text-slate-800 mb-4">Weekly Lead Trend</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="leads" stroke="#0ea5e9" strokeWidth={2} dot={{ fill: "#0ea5e9" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h2 className="font-semibold text-slate-800 mb-4">Priority Distribution</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={priorityData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" nameKey="name">
                {priorityData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card p-5">
        <h2 className="font-semibold text-slate-800 mb-4">Status Distribution</h2>
        <ResponsiveContainer width="100%" height={200}>
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
                    <td className="text-right py-2.5 px-3 text-green-600 font-medium">{a.closedWon}</td>
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
