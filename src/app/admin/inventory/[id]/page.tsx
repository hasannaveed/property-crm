"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, MapPin, BedDouble, Bath, Layers, Tag, Building, Pencil } from "lucide-react";
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
  description: string;
  bedrooms?: number;
  bathrooms?: number;
  floor?: number;
  facing?: string;
  features: string[];
  assignedAgent?: { _id: string; name: string; email: string };
  createdBy?: { name: string };
  createdAt: string;
}

interface InterestedLead {
  _id: string;
  name: string;
  phone: string;
  budget: number;
  status: string;
  assignedTo?: { name: string; email: string };
  createdAt: string;
}

const STATUS_SEQUENCE = ["available", "reserved", "sold"] as const;
const STATUS_LABELS: Record<string, string> = { available: "Available", reserved: "Reserved", sold: "Sold" };

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

function formatPrice(p: number) {
  if (p >= 10_000_000) return `${(p / 10_000_000).toFixed(2)} Cr PKR`;
  if (p >= 100_000) return `${(p / 100_000).toFixed(1)} L PKR`;
  return `PKR ${p.toLocaleString()}`;
}

function formatBudget(b: number) {
  if (b >= 10_000_000) return `${(b / 10_000_000).toFixed(1)}Cr`;
  if (b >= 100_000) return `${(b / 100_000).toFixed(0)}L`;
  return `${b.toLocaleString()}`;
}

const LEAD_STATUS_COLOR: Record<string, string> = {
  new: "text-indigo-600",
  contacted: "text-violet-600",
  "in-progress": "text-amber-600",
  "site-visit": "text-cyan-600",
  negotiation: "text-orange-600",
  "closed-won": "text-emerald-600",
  "closed-lost": "text-slate-400",
};

export default function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const [property, setProperty] = useState<Property | null>(null);
  const [leads, setLeads] = useState<InterestedLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchData = async () => {
    const res = await fetch(`/api/inventory/${id}`);
    if (!res.ok) { router.push("/admin/inventory"); return; }
    const data = await res.json();
    setProperty(data.property);
    setLeads(data.interestedLeads ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [id]);

  const handleStatusChange = async (newStatus: string) => {
    if (!property || updatingStatus) return;
    setUpdatingStatus(true);
    const res = await fetch(`/api/inventory/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      const updated = await res.json();
      setProperty(updated);
      toast(`Status changed to ${STATUS_LABELS[newStatus]}`, "success");
    } else {
      toast("Failed to update status", "error");
    }
    setUpdatingStatus(false);
  };

  const handleSave = async (data: Record<string, unknown>) => {
    const res = await fetch(`/api/inventory/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error ?? "Failed to update");
    }
    const updated = await res.json();
    setProperty(updated);
    toast("Property updated", "success");
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="skeleton h-8 w-48" />
        <div className="skeleton h-64 rounded-xl" />
      </div>
    );
  }

  if (!property) return null;

  const typeBadge = TYPE_BADGE[property.type];
  const statusBadge = STATUS_BADGE[property.status];
  const nextStatus = STATUS_SEQUENCE[STATUS_SEQUENCE.indexOf(property.status as typeof STATUS_SEQUENCE[number]) + 1];

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Back */}
      <button onClick={() => router.push("/admin/inventory")} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Inventory
      </button>

      {/* Header */}
      <div className="card p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-2">
            <div className="flex gap-2 flex-wrap">
              <Badge color={typeBadge.color}>{typeBadge.label}</Badge>
              <Badge color={statusBadge.color}>{statusBadge.label}</Badge>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">{property.title}</h1>
            <div className="flex items-center gap-1.5 text-slate-500">
              <MapPin className="w-4 h-4" />
              <span>{property.location}</span>
            </div>
            <p className="text-3xl font-bold text-indigo-700 mt-2">{formatPrice(property.price)}</p>
          </div>
          <div className="flex flex-col gap-2">
            <button onClick={() => setEditOpen(true)} className="btn-secondary flex items-center gap-2 text-sm">
              <Pencil className="w-4 h-4" /> Edit
            </button>
            {nextStatus && (
              <button
                onClick={() => handleStatusChange(nextStatus)}
                disabled={updatingStatus}
                className="btn-primary text-sm"
              >
                {updatingStatus ? "Updating..." : `Mark as ${STATUS_LABELS[nextStatus]}`}
              </button>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="mt-5 flex flex-wrap gap-6 border-t border-slate-100 pt-5">
          <div className="flex items-center gap-2 text-slate-600">
            <Layers className="w-4 h-4 text-slate-400" />
            <span className="text-sm">{property.area} {property.areaUnit}</span>
          </div>
          {property.bedrooms != null && (
            <div className="flex items-center gap-2 text-slate-600">
              <BedDouble className="w-4 h-4 text-slate-400" />
              <span className="text-sm">{property.bedrooms} Bedrooms</span>
            </div>
          )}
          {property.bathrooms != null && (
            <div className="flex items-center gap-2 text-slate-600">
              <Bath className="w-4 h-4 text-slate-400" />
              <span className="text-sm">{property.bathrooms} Bathrooms</span>
            </div>
          )}
          {property.floor != null && (
            <div className="flex items-center gap-2 text-slate-600">
              <Building className="w-4 h-4 text-slate-400" />
              <span className="text-sm">Floor {property.floor}</span>
            </div>
          )}
          {property.facing && (
            <div className="flex items-center gap-2 text-slate-600">
              <Tag className="w-4 h-4 text-slate-400" />
              <span className="text-sm">{property.facing}</span>
            </div>
          )}
        </div>

        {/* Features */}
        {property.features.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Features</p>
            <div className="flex flex-wrap gap-1.5">
              {property.features.map((f) => (
                <span key={f} className="text-xs px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200">{f}</span>
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        {property.description && (
          <div className="mt-4">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Description</p>
            <p className="text-sm text-slate-600">{property.description}</p>
          </div>
        )}

        {/* Meta */}
        <div className="mt-4 flex gap-4 text-xs text-slate-400">
          {property.assignedAgent && <span>Agent: {property.assignedAgent.name}</span>}
          {property.createdBy && <span>Added by: {property.createdBy.name}</span>}
          <span>Listed: {new Date(property.createdAt).toLocaleDateString("en-PK")}</span>
        </div>
      </div>

      {/* Interested Leads */}
      <div className="card p-6">
        <h2 className="font-semibold text-slate-800 mb-4">Interested Leads ({leads.length})</h2>
        {leads.length === 0 ? (
          <p className="text-sm text-slate-400">No leads linked to this property yet.</p>
        ) : (
          <div className="space-y-3">
            {leads.map((lead) => (
              <div key={lead._id} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-slate-900">{lead.name}</p>
                  <p className="text-xs text-slate-400">{lead.phone}</p>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-slate-500">PKR {formatBudget(lead.budget)}</span>
                  <span className={`font-medium capitalize ${LEAD_STATUS_COLOR[lead.status] ?? "text-slate-600"}`}>
                    {lead.status.replace(/-/g, " ")}
                  </span>
                  {lead.assignedTo && <span className="text-slate-400 text-xs">{lead.assignedTo.name}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <PropertyModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        onSave={handleSave}
        property={property as unknown as Record<string, unknown>}
        isEditing
      />
    </div>
  );
}
