import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function rateLimitMiddleware(email: string, role: string): NextResponse | null {
  if (role === "admin") return null;

  const now = Date.now();
  const window = 60_000;
  const limit = 50;

  const entry = rateLimitMap.get(email) ?? { count: 0, resetAt: now + window };

  if (now > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + window;
  }

  entry.count++;
  rateLimitMap.set(email, entry);

  if (entry.count > limit) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    );
  }

  return null;
}

export function validateLeadBody(body: Record<string, unknown>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!body.name || typeof body.name !== "string" || body.name.trim().length < 2)
    errors.push("Name must be at least 2 characters");

  if (!body.email || typeof body.email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email))
    errors.push("Valid email is required");

  if (!body.phone || typeof body.phone !== "string" || !/^[\d\s\-\+\(\)]{7,15}$/.test(body.phone))
    errors.push("Valid phone number (7-15 digits) is required");

  if (!body.budget || isNaN(Number(body.budget)) || Number(body.budget) <= 0)
    errors.push("Budget must be a positive number");

  if (!body.propertyInterest || typeof body.propertyInterest !== "string" || !body.propertyInterest.trim())
    errors.push("Property interest is required");

  return { valid: errors.length === 0, errors };
}

export function validateUserBody(body: Record<string, unknown>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!body.name || typeof body.name !== "string" || body.name.trim().length < 2)
    errors.push("Name must be at least 2 characters");

  if (!body.email || typeof body.email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email))
    errors.push("Valid email is required");

  if (!body.password || typeof body.password !== "string" || body.password.length < 8)
    errors.push("Password must be at least 8 characters");

  return { valid: errors.length === 0, errors };
}

interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: "admin" | "agent";
}

async function getSessionUser(): Promise<{ user: SessionUser | null; error: NextResponse | null }> {
  const supabase = await supabaseServer();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return { user: null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  const sessionUser: SessionUser = {
    id: user.id,
    email: user.email!,
    name: (user.user_metadata?.name as string) ?? "",
    role: ((user.user_metadata?.role as string) ?? "agent") as "admin" | "agent",
  };
  return { user: sessionUser, error: null };
}

export async function requireSession() {
  const { user, error } = await getSessionUser();
  if (error || !user) return { session: null, error };
  return { session: { user }, error: null };
}

export async function requireAdmin() {
  const { user, error } = await getSessionUser();
  if (error || !user) return { session: null, error };
  if (user.role !== "admin") {
    return { session: null, error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { session: { user }, error: null };
}
