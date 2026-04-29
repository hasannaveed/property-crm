"use client";

import { useEffect, useState } from "react";
import { Activity as ActivityIcon } from "lucide-react";

interface ActivityItem {
  _id: string; type: string; description: string; createdAt: string;
  performedBy: { name: string; role: string };
  lead: { name: string; _id: string } | null;
}

const ACTIVITY_EMOJI: Record<string, string> = {
  lead_created: "🆕", status_updated: "🔄", assigned: "👤", reassigned: "🔀",
  notes_updated: "📝", follow_up_set: "📅", priority_changed: "⚡", lead_deleted: "🗑️",
};

export default function AdminActivityPage() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/activity")
      .then((r) => r.json())
      .then((d) => setActivities(d.activities ?? []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Activity Log</h1>
        <p className="text-slate-500 text-sm">Global audit trail of all CRM actions</p>
      </div>

      <div className="card divide-y divide-slate-50">
        {loading ? (
          [...Array(8)].map((_, i) => (
            <div key={i} className="flex gap-4 p-4 animate-pulse">
              <div className="w-8 h-8 bg-slate-200 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <div className="h-4 bg-slate-200 rounded w-3/4" />
                <div className="h-3 bg-slate-100 rounded w-1/2" />
              </div>
            </div>
          ))
        ) : activities.length === 0 ? (
          <div className="p-12 text-center">
            <ActivityIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No activity yet</p>
          </div>
        ) : (
          activities.map((a) => (
            <div key={a._id} className="flex gap-4 p-4 hover:bg-slate-50 transition-colors">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-sm shrink-0">
                {ACTIVITY_EMOJI[a.type] ?? "●"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-800">{a.description}</p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="text-xs text-slate-400">{a.performedBy?.name}</span>
                  {a.performedBy?.role && <span className="text-xs bg-slate-100 text-slate-500 rounded px-1.5 py-0.5 capitalize">{a.performedBy.role}</span>}
                  {a.lead && <span className="text-xs text-sky-500">· {a.lead.name}</span>}
                </div>
              </div>
              <span className="text-xs text-slate-400 shrink-0 mt-0.5">
                {new Date(a.createdAt).toLocaleString("en-PK", { dateStyle: "short", timeStyle: "short" })}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
