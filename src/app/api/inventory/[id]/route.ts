import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Property from "@/models/Property";
import Lead from "@/models/Lead";
import { requireSession, requireAdmin } from "@/lib/middleware";
import mongoose from "mongoose";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { error } = await requireSession();
  if (error) return error;

  const { id } = await ctx.params;
  if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  await connectDB();

  const [property, interestedLeads] = await Promise.all([
    Property.findById(id)
      .populate("assignedAgent", "name email")
      .populate("createdBy", "name")
      .lean(),
    Lead.find({ interestedIn: id })
      .populate("assignedTo", "name email")
      .select("name phone budget status propertyType assignedTo createdAt")
      .lean(),
  ]);

  if (!property) return NextResponse.json({ error: "Property not found" }, { status: 404 });

  return NextResponse.json({ property, interestedLeads });
}

export async function PUT(req: NextRequest, ctx: Ctx) {
  const { session, error } = await requireAdmin();
  if (error) return error;

  const { id } = await ctx.params;
  if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  await connectDB();

  const property = await Property.findById(id);
  if (!property) return NextResponse.json({ error: "Property not found" }, { status: 404 });

  const body = await req.json();
  const allowed = ["title", "type", "status", "price", "area", "areaUnit", "location", "description", "bedrooms", "bathrooms", "floor", "facing", "features", "images", "assignedAgent"];

  for (const key of allowed) {
    if (key in body) {
      if (key === "assignedAgent") {
        (property as unknown as Record<string, unknown>)[key] = body[key] ? new mongoose.Types.ObjectId(body[key]) : null;
      } else if (["price", "area", "bedrooms", "bathrooms", "floor"].includes(key)) {
        (property as unknown as Record<string, unknown>)[key] = body[key] !== "" && body[key] != null ? Number(body[key]) : undefined;
      } else {
        (property as unknown as Record<string, unknown>)[key] = body[key];
      }
    }
  }

  void session;
  await property.save();

  const updated = await Property.findById(id)
    .populate("assignedAgent", "name email")
    .populate("createdBy", "name")
    .lean();

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await ctx.params;
  if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  await connectDB();

  const property = await Property.findByIdAndDelete(id);
  if (!property) return NextResponse.json({ error: "Property not found" }, { status: 404 });

  // Unlink any leads that referenced this property
  await Lead.updateMany({ interestedIn: id }, { $set: { interestedIn: null } });

  return NextResponse.json({ message: "Property deleted" });
}
