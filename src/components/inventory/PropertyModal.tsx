"use client";

import { useState, useEffect } from "react";
import { X, Plus } from "lucide-react";

interface Agent {
  _id: string;
  name: string;
  email: string;
}

interface PropertyFormData {
  title: string;
  type: string;
  status: string;
  price: string;
  area: string;
  areaUnit: string;
  location: string;
  description: string;
  bedrooms: string;
  bathrooms: string;
  floor: string;
  facing: string;
  features: string[];
  assignedAgent: string;
}

interface PropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Record<string, unknown>) => Promise<void>;
  property?: Record<string, unknown> | null;
  agents?: Agent[];
  isEditing?: boolean;
}

const FEATURE_SUGGESTIONS = ["Corner", "Near Mosque", "Near Park", "Gas Available", "Gated Community", "Park Facing", "Main Boulevard", "Double Road"];

function emptyForm(): PropertyFormData {
  return {
    title: "",
    type: "plot",
    status: "available",
    price: "",
    area: "",
    areaUnit: "marla",
    location: "",
    description: "",
    bedrooms: "",
    bathrooms: "",
    floor: "",
    facing: "",
    features: [],
    assignedAgent: "",
  };
}

export default function PropertyModal({ isOpen, onClose, onSave, property, agents = [], isEditing = false }: PropertyModalProps) {
  const [form, setForm] = useState<PropertyFormData>(emptyForm());
  const [featureInput, setFeatureInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (property && isEditing) {
      const p = property as Record<string, unknown>;
      setForm({
        title: String(p.title ?? ""),
        type: String(p.type ?? "plot"),
        status: String(p.status ?? "available"),
        price: String(p.price ?? ""),
        area: String(p.area ?? ""),
        areaUnit: String(p.areaUnit ?? "marla"),
        location: String(p.location ?? ""),
        description: String(p.description ?? ""),
        bedrooms: String(p.bedrooms ?? ""),
        bathrooms: String(p.bathrooms ?? ""),
        floor: String(p.floor ?? ""),
        facing: String(p.facing ?? ""),
        features: Array.isArray(p.features) ? (p.features as string[]) : [],
        assignedAgent: p.assignedAgent ? String((p.assignedAgent as Record<string, unknown>)._id ?? p.assignedAgent) : "",
      });
    } else if (!property) {
      setForm(emptyForm());
    }
    setError("");
    setFeatureInput("");
  }, [property, isEditing, isOpen]);

  const addFeature = (feat: string) => {
    const trimmed = feat.trim();
    if (trimmed && !form.features.includes(trimmed)) {
      setForm((f) => ({ ...f, features: [...f.features, trimmed] }));
    }
    setFeatureInput("");
  };

  const removeFeature = (feat: string) => setForm((f) => ({ ...f, features: f.features.filter((x) => x !== feat) }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await onSave({
        ...form,
        price: Number(form.price),
        area: Number(form.area),
        bedrooms: form.bedrooms ? Number(form.bedrooms) : undefined,
        bathrooms: form.bathrooms ? Number(form.bathrooms) : undefined,
        floor: form.floor ? Number(form.floor) : undefined,
        assignedAgent: form.assignedAgent || null,
      });
      onClose();
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message ?? "Failed to save property");
    } finally {
      setSaving(false);
    }
  };

  const priceNum = Number(form.price);
  const priceDisplay = priceNum >= 10_000_000
    ? `${(priceNum / 10_000_000).toFixed(2)} Cr`
    : priceNum >= 100_000
    ? `${(priceNum / 100_000).toFixed(1)} L`
    : null;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100 sticky top-0 bg-white z-10">
          <h2 className="text-lg font-semibold text-slate-900">{isEditing ? "Edit Property" : "Add New Property"}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {error && (
            <div className="bg-rose-50 border border-rose-200 rounded-lg px-4 py-3">
              <p className="text-sm text-rose-600">{error}</p>
            </div>
          )}

          {/* Title & Type */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Title *</label>
              <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required placeholder="e.g. 5 Marla Corner House in DHA Phase 6" />
            </div>
            <div>
              <label className="label">Property Type *</label>
              <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value, bedrooms: "", bathrooms: "", floor: "" })}>
                <option value="plot">Plot</option>
                <option value="house">House</option>
                <option value="apartment">Apartment</option>
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="available">Available</option>
                <option value="reserved">Reserved</option>
                <option value="sold">Sold</option>
              </select>
            </div>
          </div>

          {/* Price & Area */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="label">Price (PKR) *</label>
              <input className="input" type="number" min={1} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
              {priceDisplay && <p className="text-xs text-slate-500 mt-1">{priceDisplay} PKR</p>}
            </div>
            <div>
              <label className="label">Area *</label>
              <div className="flex gap-1">
                <input className="input" type="number" min={1} value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} required />
                <select className="input w-24" value={form.areaUnit} onChange={(e) => setForm({ ...form, areaUnit: e.target.value })}>
                  <option value="marla">Marla</option>
                  <option value="sqft">Sqft</option>
                </select>
              </div>
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="label">Location *</label>
            <input className="input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} required placeholder="e.g. DHA Phase 6, Lahore" />
          </div>

          {/* Conditional: bedrooms/bathrooms for house/apartment */}
          {(form.type === "house" || form.type === "apartment") && (
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="label">Bedrooms</label>
                <input className="input" type="number" min={0} value={form.bedrooms} onChange={(e) => setForm({ ...form, bedrooms: e.target.value })} />
              </div>
              <div>
                <label className="label">Bathrooms</label>
                <input className="input" type="number" min={0} value={form.bathrooms} onChange={(e) => setForm({ ...form, bathrooms: e.target.value })} />
              </div>
              {/* Floor only for apartment */}
              {form.type === "apartment" && (
                <div>
                  <label className="label">Floor</label>
                  <input className="input" type="number" min={0} value={form.floor} onChange={(e) => setForm({ ...form, floor: e.target.value })} />
                </div>
              )}
            </div>
          )}

          {/* Facing */}
          <div>
            <label className="label">Facing</label>
            <input className="input" value={form.facing} onChange={(e) => setForm({ ...form, facing: e.target.value })} placeholder="e.g. East, Park Facing, Main Road" />
          </div>

          {/* Features */}
          <div>
            <label className="label">Features</label>
            <div className="flex gap-2 mb-2">
              <input
                className="input"
                value={featureInput}
                onChange={(e) => setFeatureInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addFeature(featureInput); } }}
                placeholder="Type feature and press Enter"
              />
              <button type="button" onClick={() => addFeature(featureInput)} className="btn-secondary px-3 shrink-0">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {form.features.map((f) => (
                <span key={f} className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs rounded-full border border-indigo-200">
                  {f}
                  <button type="button" onClick={() => removeFeature(f)} className="hover:text-indigo-900"><X className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
            <div className="flex flex-wrap gap-1">
              {FEATURE_SUGGESTIONS.filter((s) => !form.features.includes(s)).map((s) => (
                <button type="button" key={s} onClick={() => addFeature(s)} className="text-xs px-2 py-0.5 rounded-full border border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-600 transition-colors">
                  + {s}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="label">Description</label>
            <textarea className="input" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Additional details..." />
          </div>

          {/* Assigned Agent */}
          {agents.length > 0 && (
            <div>
              <label className="label">Assign Agent</label>
              <select className="input" value={form.assignedAgent} onChange={(e) => setForm({ ...form, assignedAgent: e.target.value })}>
                <option value="">Unassigned</option>
                {agents.map((a) => <option key={a._id} value={a._id}>{a.name}</option>)}
              </select>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={onClose} className="btn-secondary px-4 py-2 rounded-lg text-sm font-medium">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary px-5 py-2 text-sm">
              {saving ? "Saving..." : isEditing ? "Update Property" : "Add Property"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
