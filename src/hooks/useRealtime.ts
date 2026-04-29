"use client";

import { useEffect, useRef, useCallback } from "react";

interface RealtimeActivity {
  _id: string;
  type: string;
  description: string;
  performedBy: { name: string };
  lead: { name: string; _id: string };
  createdAt: string;
}

interface UseRealtimeOptions {
  onNewActivity?: (activities: RealtimeActivity[]) => void;
  enabled?: boolean;
}

export function useRealtime({ onNewActivity, enabled = true }: UseRealtimeOptions = {}) {
  const sinceRef = useRef<string>(new Date().toISOString());
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const poll = useCallback(async () => {
    try {
      const res = await fetch(`/api/realtime?since=${encodeURIComponent(sinceRef.current)}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.activities?.length > 0) {
        onNewActivity?.(data.activities);
      }
      if (data.timestamp) sinceRef.current = data.timestamp;
    } catch {
      // silently ignore
    }
  }, [onNewActivity]);

  useEffect(() => {
    if (!enabled) return;
    timerRef.current = setInterval(poll, 15_000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [poll, enabled]);
}
