import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { validateUserBody } from "@/lib/middleware";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { valid, errors } = validateUserBody(body);
    if (!valid) return NextResponse.json({ errors }, { status: 422 });

    const role = body.role === "admin" ? "admin" : "agent";
    const db = supabaseAdmin();

    // Create auth user + profile in one shot using admin API
    const { data: authData, error: authError } = await db.auth.admin.createUser({
      email: body.email.toLowerCase().trim(),
      password: body.password,
      user_metadata: {
        name: body.name.trim(),
        role,
        phone: body.phone?.trim() ?? "",
      },
      email_confirm: true,
    });

    if (authError) {
      if (authError.message.includes("already registered") || authError.message.includes("already been registered")) {
        return NextResponse.json({ errors: ["Email already registered"] }, { status: 409 });
      }
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    // Insert into profiles table
    const { error: profileError } = await db.from("profiles").insert({
      id: authData.user.id,
      name: body.name.trim(),
      email: body.email.toLowerCase().trim(),
      role,
      phone: body.phone?.trim() ?? null,
    });

    if (profileError) {
      // Clean up the auth user if profile insert fails
      await db.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json({ error: "Failed to create profile" }, { status: 500 });
    }

    return NextResponse.json(
      { id: authData.user.id, name: body.name.trim(), email: authData.user.email, role },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
