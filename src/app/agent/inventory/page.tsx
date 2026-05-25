"use client";

import { useEffect, useState, useCallback } from "react";
import { Home, MapPin, BedDouble, Bath, Layers } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import Badge from "@/components/ui/Badge";

interface Property {
  _id: string;
  title: string;
  type: "plot" | "house" | "apartment";
  status: "available" | "reserved" | "sold";
  price: number;
  area: number;
  areaUnit: string;
  location: string;
  bedrooms?: number;
  bathrooms?: number;
  features: string[];
  assignedAgent?: { name: string };
}

const TYPE_TABS = ["all", "plot", "house", "apartment"] as const;
const STATUS_FILTERS = ["all", "available", "reserved", "sold"] as const;

function formatPrice(p: number) {
  if (p >= 10_000_000) return `${(p / 10_000_000).toFixed(2)} Cr`;
  if (p >= 100_000) return `${(p / 100_000).toFixed(1)} L`;
  return `PKR ${p.toLocaleString()}`;
}

const TYPE_BADGE: Record<string, { color: "amber" | "emerald" | "blue"; label: string }> = {
  plot: { color: "amber", label: "Plot" },
  house: { color: "emerald", label: "House" },
  apartment: { color: "blue", label: "Apartment" },
};

const STATUS_BADGE: Record<string, { color: "green" | "yellow" | "red"; label: string }> = {
  available: { color: "green", label: "Available" },
  reserved: { color: "yellow", label: "Reserved" },
  sold: { color: "red", label: "Sold" },
};

function PropertyCardSkeleton() {
  return (
    <div className="card p-5 space-y-3">
      <div className="flex gap-2">
        <div className="skeleton h-5 w-16 rounded-full" />
        <div className="skeleton h-5 w-20 rounded-full" />
      </div>
      <div className="skeleton h-5 w-3/4" />
      <div className="skeleton h-4 w-1/2" />
      <div className="skeleton h-6 w-1/3" />
      <div className="skeleton h-4 w-full" />
    </div>
  );
}

export default function AgentInventoryPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (typeFilter !== "all") params.set("type", typeFilter);
    if (statusFilter !== "all") params.set("status", statusFilter);
    params.set("limit", "100");
    const res = await fetch(`/api/inventory?${params}`);
    const data = await res.json();
    setProperties(data.properties ?? []);
    setLoading(false);
  }, [typeFilter, statusFilter]);

  useEffect(() => { fetchProperties(); }, [fetchProperties]);

  return (
    <div>
      <PageHeader
        title="Inventory"
        subtitle="Browse available property listings"
      />

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
          {TYPE_TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${typeFilter === t ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              {t}
            </button>
          ))}
        </div>

        <select
          className="input w-auto text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          {STATUS_FILTERS.map((s) => (
            <option key={s} value={s}>{s === "all" ? "All Statuses" : s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <PropertyCardSkeleton key={i} />)}
        </div>
      ) : properties.length === 0 ? (
        <EmptyState
          icon={Home}
          title="No properties found"
          description={typeFilter !== "all" || statusFilter !== "all" ? "Try adjusting your filters." : "No properties have been listed yet."}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {properties.map((p) => {
            const typeBadge = TYPE_BADGE[p.type];
            const statusBadge = STATUS_BADGE[p.status];
            return (
              <div key={p._id} className="card p-5 hover:shadow-md transition-shadow flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <Badge color={typeBadge.color}>{typeBadge.label}</Badge>
                  <Badge color={statusBadge.color}>{statusBadge.label}</Badge>
                </div>

                <h3 className="font-semibold text-slate-900 leading-snug line-clamp-2">{p.title}</h3>

                <div className="flex items-center gap-1.5 text-slate-500 text-sm">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{p.location}</span>
                </div>

                <p className="text-xl font-bold text-indigo-700">{formatPrice(p.price)}</p>

                <div className="flex items-center gap-3 text-sm text-slate-500">
                  <span className="flex items-center gap-1"><Layers className="w-3.5 h-3.5" />{p.area} {p.areaUnit}</span>
                  {p.bedrooms != null && <span className="flex items-center gap-1"><BedDouble className="w-3.5 h-3.5" />{p.bedrooms} Bed</span>}
                  {p.bathrooms != null && <span className="flex items-center gap-1"><Bath className="w-3.5 h-3.5" />{p.bathrooms} Bath</span>}
                </div>

                {p.features.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {p.features.slice(0, 3).map((f) => (
                      <span key={f} className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">{f}</span>
                    ))}
                    {p.features.length > 3 && <span className="text-xs text-slate-400">+{p.features.length - 3}</span>}
                  </div>
                )}

                {p.assignedAgent && (
                  <p className="text-xs text-slate-400 flex items-center gap-1">
                    <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold text-[10px] shrink-0">
                      {p.assignedAgent.name.charAt(0).toUpperCase()}
                    </span>
                    {p.assignedAgent.name}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
