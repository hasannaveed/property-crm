"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

interface Agent {
  _id: string;
  name: string;
  email: string;
}

interface LeadFormData {
  name: string;
  email: string;
  phone: string;
  propertyInterest: string;
  budget: string;
  source: string;
  status?: string;
  assignedTo?: string;
  followUpDate?: string;
  notes?: string;
}

interface LeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Record<string, unknown>) => Promise<void>;
  lead?: Record<string, unknown> | null;
  agents?: Agent[];
  isEditing?: boolean;
}

const STATUS_OPTIONS = ["new", "contacted", "in-progress", "site-visit", "negotiation", "closed-won", "closed-lost"];
const SOURCE_OPTIONS = ["facebook-ads", "walk-in", "website", "referral", "other"];

export default function LeadModal({ isOpen, onClose, onSave, lead, agents = [], isEditing = false }: LeadModalProps) {
  const [form, setForm] = useState<LeadFormData>({
    name: "",
    email: "",
    phone: "",
    propertyInterest: "",
    budget: "",
    source: "other",
    status: "new",
    assignedTo: "",
    followUpDate: "",
    notes: "",
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (lead && isEditing) {
      const l = lead as Record<string, unknown>;
      setForm({
        name: String(l.name ?? ""),
        email: String(l.email ?? ""),
        phone: String(l.phone ?? ""),
        propertyInterest: String(l.propertyInterest ?? ""),
        budget: String(l.budget ?? ""),
        source: String(l.source ?? "other"),
        status: String(l.status ?? "new"),
        assignedTo: l.assignedTo ? String((l.assignedTo as Record<string, unknown>)._id ?? l.assignedTo) : "",
        followUpDate: l.followUpDate ? String(l.followUpDate).slice(0, 10) : "",
        notes: String(l.notes ?? ""),
      });
    } else if (!lead) {
      setForm({ name: "", email: "", phone: "", propertyInterest: "", budget: "", source: "other", status: "new", assignedTo: "", followUpDate: "", notes: "" });
    }
    setErrors([]);
  }, [lead, isEditing, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrors([]);
    try {
      await onSave(form as unknown as Record<string, unknown>);
      onClose();
    } catch (err: unknown) {
      const e = err as { errors?: string[]; message?: string };
      setErrors(e.errors ?? [e.message ?? "Failed to save"]);
    } finally {
      setSaving(false);
    }
  };

  const budgetNum = Number(form.budget);
  const crore = budgetNum > 0 ? (budgetNum / 10_000_000).toFixed(2) : null;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">{isEditing ? "Edit Lead" : "Add New Lead"}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              {errors.map((e, i) => <p key={i} className="text-sm text-red-600">{e}</p>)}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Name *</label>
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label className="label">Phone *</label>
              <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
            </div>
          </div>

          <div>
            <label className="label">Email *</label>
            <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>

          <div>
            <label className="label">Property Interest *</label>
            <input className="input" value={form.propertyInterest} onChange={(e) => setForm({ ...form, propertyInterest: e.target.value })} required placeholder="e.g. 5 Marla House in DHA" />
          </div>

          <div>
            <label className="label">Budget (PKR) *</label>
            <input className="input" type="number" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} required min={1} />
            {crore && <p className="text-xs text-slate-500 mt-1">{crore} Crore PKR</p>}
          </div>

          <div>
            <label className="label">Source</label>
            <select className="input" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>
              {SOURCE_OPTIONS.map((s) => <option key={s} value={s}>{s.replace(/-/g, " ")}</option>)}
            </select>
          </div>

          {isEditing && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Status</label>
                  <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace(/-/g, " ")}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Follow-up Date</label>
                  <input className="input" type="date" value={form.followUpDate} onChange={(e) => setForm({ ...form, followUpDate: e.target.value })} />
                </div>
              </div>

              {agents.length > 0 && (
                <div>
                  <label className="label">Assign To</label>
                  <select className="input" value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}>
                    <option value="">Unassigned</option>
                    {agents.map((a) => <option key={a._id} value={a._id}>{a.name}</option>)}
                  </select>
                </div>
              )}

              <div>
                <label className="label">Notes</label>
                <textarea className="input" rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
            </>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary px-4 py-2 rounded-lg text-sm font-medium">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary px-5 py-2 text-sm">
              {saving ? "Saving..." : "Save Lead"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
