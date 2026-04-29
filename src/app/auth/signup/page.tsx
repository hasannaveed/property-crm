"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Building2, CheckCircle } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", role: "agent" });
  const [errors, setErrors] = useState<string[]>([]);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors([]);

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (!res.ok) {
      setErrors(data.errors ?? [data.error ?? "Failed to sign up"]);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setTimeout(() => router.push("/auth/login"), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-sky-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-2xl">
          <div className="flex flex-col items-center mb-7">
            <div className="w-14 h-14 bg-sky-500 rounded-2xl flex items-center justify-center mb-4">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Create Account</h1>
            <p className="text-sky-300 text-sm mt-1">Property CRM Pakistan</p>
          </div>

          {success ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <CheckCircle className="w-12 h-12 text-green-400" />
              <p className="text-white font-medium">Account created!</p>
              <p className="text-slate-400 text-sm">Redirecting to login…</p>
            </div>
          ) : (
            <>
              {errors.length > 0 && (
                <div className="bg-red-500/20 border border-red-500/30 text-red-200 rounded-xl px-4 py-3 mb-4">
                  {errors.map((e, i) => <p key={i} className="text-sm">{e}</p>)}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-sky-200 mb-1">Full Name *</label>
                    <input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-sky-200 mb-1">Phone</label>
                    <input
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
                      placeholder="+92..."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-sky-200 mb-1">Email *</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-sky-200 mb-1">Password *</label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
                    minLength={8}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-sky-200 mb-1">Role</label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
                  >
                    <option value="agent" className="bg-slate-800">Agent</option>
                    <option value="admin" className="bg-slate-800">Admin</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-sky-500 hover:bg-sky-400 text-white font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-50 mt-1"
                >
                  {loading ? "Creating…" : "Create Account"}
                </button>
              </form>
            </>
          )}

          <p className="text-center text-slate-400 text-sm mt-5">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-sky-400 hover:text-sky-300 font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
