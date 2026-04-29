import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { validateUserBody } from "@/lib/middleware";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { valid, errors } = validateUserBody(body);
    if (!valid) return NextResponse.json({ errors }, { status: 422 });

    await connectDB();

    const exists = await User.findOne({ email: body.email.toLowerCase() });
    if (exists) return NextResponse.json({ errors: ["Email already registered"] }, { status: 409 });

    const role = body.role === "admin" ? "admin" : "agent";
    const user = await User.create({
      name: body.name.trim(),
      email: body.email.toLowerCase().trim(),
      password: body.password,
      phone: body.phone?.trim(),
      role,
    });

    return NextResponse.json(
      { id: user._id, name: user.name, email: user.email, role: user.role },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
