"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Building2, Mail, Lock, AlertCircle, Eye, EyeOff } from "lucide-react";
import { Suspense } from "react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const urlError = searchParams.get("error");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", { email, password, redirect: false });

    if (result?.error) {
      setError("Invalid email or password");
      setLoading(false);
    } else {
      router.push("/");
    }
  };

  const fillDemo = (role: "admin" | "agent") => {
    if (role === "admin") { setEmail("admin@propertycrm.pk"); setPassword("admin123456"); }
    else { setEmail("agent@propertycrm.pk"); setPassword("agent123456"); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-sky-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-2xl">
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 bg-sky-500 rounded-2xl flex items-center justify-center mb-4">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Property CRM</h1>
            <p className="text-sky-300 text-sm mt-1">Pakistan Real Estate Management</p>
          </div>

          {(error || urlError === "unauthorized") && (
            <div className="flex items-center gap-2 bg-red-500/20 border border-red-500/30 text-red-200 rounded-xl px-4 py-3 mb-5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="text-sm">{error || "You are not authorized to access that page."}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-sky-200 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-sky-200 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-xl pl-10 pr-10 py-2.5 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
                  placeholder="••••••••"
                  required
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-sky-500 hover:bg-sky-400 text-white font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-50 mt-2"
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <div className="mt-5 p-4 bg-white/5 border border-white/10 rounded-xl">
            <p className="text-xs font-semibold text-sky-300 mb-2">Demo Credentials</p>
            <div className="flex gap-2">
              <button onClick={() => fillDemo("admin")} className="flex-1 text-xs bg-white/10 hover:bg-white/20 text-white py-1.5 rounded-lg transition-colors">Admin</button>
              <button onClick={() => fillDemo("agent")} className="flex-1 text-xs bg-white/10 hover:bg-white/20 text-white py-1.5 rounded-lg transition-colors">Agent</button>
            </div>
          </div>

          <p className="text-center text-slate-400 text-sm mt-5">
            No account?{" "}
            <Link href="/auth/signup" className="text-sky-400 hover:text-sky-300 font-medium">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
