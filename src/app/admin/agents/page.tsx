"use client";

import { useEffect, useState } from "react";
import { Users, Phone, Mail, Calendar } from "lucide-react";

interface Agent {
  _id: string; name: string; email: string; phone?: string; createdAt: string;
}

export default function AdminAgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/agents")
      .then((r) => r.json())
      .then((d) => setAgents(d.agents ?? []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Agents</h1>
        <p className="text-slate-500 text-sm">{agents.length} active agents</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
          {[...Array(6)].map((_, i) => <div key={i} className="h-36 bg-slate-200 rounded-xl" />)}
        </div>
      ) : agents.length === 0 ? (
        <div className="card p-12 text-center">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No agents found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((a) => (
            <div key={a._id} className="card p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-sky-100 rounded-xl flex items-center justify-center text-sky-600 font-bold text-lg">
                  {a.name[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-slate-800">{a.name}</p>
                  <span className="text-xs bg-sky-50 text-sky-600 border border-sky-100 rounded-full px-2 py-0.5">Agent</span>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-slate-500">
                  <Mail className="w-3.5 h-3.5" />
                  <span className="truncate">{a.email}</span>
                </div>
                {a.phone && (
                  <div className="flex items-center gap-2 text-slate-500">
                    <Phone className="w-3.5 h-3.5" />
                    <span>{a.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-slate-400 text-xs">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Joined {new Date(a.createdAt).toLocaleDateString("en-PK")}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
