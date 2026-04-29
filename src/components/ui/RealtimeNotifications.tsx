"use client";

import { useState, useCallback } from "react";
import { X, Bell } from "lucide-react";
import { useRealtime } from "@/hooks/useRealtime";

interface Toast {
  id: string;
  message: string;
  leadName: string;
}

const ACTIVITY_EMOJI: Record<string, string> = {
  lead_created: "🆕",
  status_updated: "🔄",
  assigned: "👤",
  reassigned: "🔀",
  notes_updated: "📝",
  follow_up_set: "📅",
  priority_changed: "⚡",
  lead_deleted: "🗑️",
};

export default function RealtimeNotifications() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const handleNewActivity = useCallback((activities: { _id: string; type: string; description: string; lead: { name: string; _id: string } }[]) => {
    const newToasts: Toast[] = activities.slice(0, 3).map((a) => ({
      id: a._id,
      message: `${ACTIVITY_EMOJI[a.type] ?? "🔔"} ${a.description}`,
      leadName: a.lead?.name ?? "Unknown",
    }));

    setToasts((prev) => [...prev, ...newToasts].slice(-5));

    newToasts.forEach((t) => {
      setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== t.id)), 5000);
    });
  }, []);

  useRealtime({ onNewActivity: handleNewActivity });

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="flex items-start gap-3 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg min-w-72 max-w-sm animate-slide-up"
        >
          <Bell className="w-4 h-4 mt-0.5 text-sky-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-sky-400 truncate">{toast.leadName}</p>
            <p className="text-sm text-slate-200 leading-snug">{toast.message}</p>
          </div>
          <button onClick={() => setToasts((p) => p.filter((x) => x.id !== toast.id))} className="text-slate-400 hover:text-white shrink-0">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
