"use client";

import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
  Legend, LineChart, Line, CartesianGrid,
} from "recharts";

interface AnalyticsData {
  byStatus: { _id: string; count: number }[];
  byPriority: { _id: string; count: number }[];
  byAgent: { _id: string; name: string; email: string; totalLeads: number; closedWon: number; highPriority: number }[];
  weeklyTrend: { _id: string; count: number }[];
}

const STATUS_COLORS: Record<string, string> = {
  new: "#0ea5e9", contacted: "#8b5cf6", "in-progress": "#f59e0b",
  "site-visit": "#06b6d4", negotiation: "#f97316", "closed-won": "#22c55e", "closed-lost": "#ef4444",
};
const PRIORITY_COLORS = { high: "#ef4444", medium: "#f59e0b", low: "#22c55e" };

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics").then((r) => r.json()).then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="animate-pulse space-y-6"><div className="h-8 bg-slate-200 rounded w-40" />{[...Array(3)].map((_, i) => <div key={i} className="h-64 bg-slate-200 rounded-xl" />)}</div>;
  }
  if (!data) return null;

  const statusData = data.byStatus.map((s) => ({ name: s._id.replace(/-/g, " "), value: s.count, color: STATUS_COLORS[s._id] ?? "#94a3b8" }));
  const priorityData = data.byPriority.map((p) => ({ name: p._id, value: p.count, color: PRIORITY_COLORS[p._id as keyof typeof PRIORITY_COLORS] ?? "#94a3b8" }));
  const trendData = data.weeklyTrend.map((d) => ({ date: d._id.slice(5), leads: d.count }));
  const agentData = data.byAgent.map((a) => ({ name: a.name.split(" ")[0], total: a.totalLeads, won: a.closedWon }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
        <p className="text-slate-500 text-sm">In-depth charts and performance metrics</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h2 className="font-semibold text-slate-800 mb-4">Weekly Lead Trend (Last 7 Days)</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="leads" stroke="#0ea5e9" strokeWidth={2} dot={{ fill: "#0ea5e9", r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h2 className="font-semibold text-slate-800 mb-4">Priority Distribution</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={priorityData} cx="50%" cy="50%" outerRadius={90} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                {priorityData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h2 className="font-semibold text-slate-800 mb-4">Status Breakdown</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={statusData} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 12 }} allowDecimals={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
              <Tooltip />
              <Bar dataKey="value" radius={4}>
                {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h2 className="font-semibold text-slate-800 mb-4">Agent Performance</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={agentData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="total" fill="#0ea5e9" name="Total Leads" radius={[4, 4, 0, 0]} />
              <Bar dataKey="won" fill="#22c55e" name="Closed Won" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
