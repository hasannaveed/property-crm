"use client";

import { useEffect, useState, useCallback } from "react";
import { Home, Plus, Pencil, Trash2, MapPin, BedDouble, Bath, Layers } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import Badge from "@/components/ui/Badge";
import PropertyModal from "@/components/inventory/PropertyModal";
import { useToast } from "@/components/ui/Toast";

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
  floor?: number;
  features: string[];
  assignedAgent?: { name: string; email: string };
}

interface Agent {
  _id: string;
  name: string;
  email: string;
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

export default function InventoryPage() {
  const { toast } = useToast();
  const [properties, setProperties] = useState<Property[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editProperty, setEditProperty] = useState<Property | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  useEffect(() => {
    fetch("/api/agents").then((r) => r.json()).then((data) => setAgents(data ?? []));
  }, []);

  const handleSave = async (data: Record<string, unknown>) => {
    const url = editProperty ? `/api/inventory/${editProperty._id}` : "/api/inventory";
    const method = editProperty ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error ?? "Failed to save");
    }
    toast(editProperty ? "Property updated" : "Property added", "success");
    setEditProperty(null);
    fetchProperties();
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setDeletingId(id);
    const res = await fetch(`/api/inventory/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast("Property deleted", "success");
      setProperties((prev) => prev.filter((p) => p._id !== id));
    } else {
      toast("Failed to delete property", "error");
    }
    setDeletingId(null);
  };

  const openAdd = () => { setEditProperty(null); setModalOpen(true); };
  const openEdit = (p: Property) => { setEditProperty(p); setModalOpen(true); };

  return (
    <div>
      <PageHeader
        title="Inventory"
        subtitle="Manage all property listings"
        actions={
          <button onClick={openAdd} className="btn-primary text-sm">
            <Plus className="w-4 h-4" />
            Add Property
          </button>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        {/* Type tabs */}
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

        {/* Status filter */}
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

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <PropertyCardSkeleton key={i} />)}
        </div>
      ) : properties.length === 0 ? (
        <EmptyState
          icon={Home}
          title="No properties found"
          description={typeFilter !== "all" || statusFilter !== "all" ? "Try adjusting your filters." : "Add your first property listing to get started."}
          action={{ label: "Add Property", onClick: openAdd }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {properties.map((p) => {
            const typeBadge = TYPE_BADGE[p.type];
            const statusBadge = STATUS_BADGE[p.status];
            return (
              <div key={p._id} className="card p-5 hover:shadow-md transition-shadow flex flex-col gap-3">
                {/* Badges */}
                <div className="flex items-center gap-2">
                  <Badge color={typeBadge.color}>{typeBadge.label}</Badge>
                  <Badge color={statusBadge.color}>{statusBadge.label}</Badge>
                </div>

                {/* Title */}
                <h3 className="font-semibold text-slate-900 leading-snug line-clamp-2">{p.title}</h3>

                {/* Location */}
                <div className="flex items-center gap-1.5 text-slate-500 text-sm">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{p.location}</span>
                </div>

                {/* Price */}
                <p className="text-xl font-bold text-indigo-700">{formatPrice(p.price)}</p>

                {/* Area + beds/baths */}
                <div className="flex items-center gap-3 text-sm text-slate-500">
                  <span className="flex items-center gap-1"><Layers className="w-3.5 h-3.5" />{p.area} {p.areaUnit}</span>
                  {p.bedrooms != null && <span className="flex items-center gap-1"><BedDouble className="w-3.5 h-3.5" />{p.bedrooms} Bed</span>}
                  {p.bathrooms != null && <span className="flex items-center gap-1"><Bath className="w-3.5 h-3.5" />{p.bathrooms} Bath</span>}
                </div>

                {/* Features */}
                {p.features.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {p.features.slice(0, 3).map((f) => (
                      <span key={f} className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">{f}</span>
                    ))}
                    {p.features.length > 3 && <span className="text-xs text-slate-400">+{p.features.length - 3}</span>}
                  </div>
                )}

                {/* Agent */}
                {p.assignedAgent && (
                  <p className="text-xs text-slate-400 flex items-center gap-1">
                    <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold text-[10px] shrink-0">
                      {p.assignedAgent.name.charAt(0).toUpperCase()}
                    </span>
                    {p.assignedAgent.name}
                  </p>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-1 border-t border-slate-100">
                  <button onClick={() => openEdit(p as unknown as Property)} className="flex items-center gap-1 text-sm text-slate-500 hover:text-indigo-600 transition-colors">
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(p._id, p.title)}
                    disabled={deletingId === p._id}
                    className="flex items-center gap-1 text-sm text-slate-500 hover:text-rose-600 transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> {deletingId === p._id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <PropertyModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditProperty(null); }}
        onSave={handleSave}
        property={editProperty as unknown as Record<string, unknown>}
        agents={agents}
        isEditing={!!editProperty}
      />
    </div>
  );
}
