import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Property from "@/models/Property";
import { requireSession, requireAdmin } from "@/lib/middleware";

export async function GET(req: NextRequest) {
  const { session, error } = await requireSession();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const status = searchParams.get("status");
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const location = searchParams.get("location");
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 20)));
  const skip = (page - 1) * limit;

  const query: Record<string, unknown> = {};
  if (type && type !== "all") query.type = type;
  if (status) query.status = status;
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) (query.price as Record<string, number>).$gte = Number(minPrice);
    if (maxPrice) (query.price as Record<string, number>).$lte = Number(maxPrice);
  }
  if (location) query.location = { $regex: location, $options: "i" };

  await connectDB();

  const [properties, total] = await Promise.all([
    Property.find(query)
      .populate("assignedAgent", "name email")
      .populate("createdBy", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Property.countDocuments(query),
  ]);

  // Return status counts for dashboard stats when no filters applied
  let statusCounts: Record<string, number> | undefined;
  if (!type && !status && !minPrice && !maxPrice && !location) {
    const counts = await Property.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);
    statusCounts = { available: 0, reserved: 0, sold: 0 };
    for (const c of counts) statusCounts[c._id] = c.count;
  }

  void session;

  return NextResponse.json({
    properties,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    ...(statusCounts ? { statusCounts } : {}),
  });
}

export async function POST(req: NextRequest) {
  const { session, error } = await requireAdmin();
  if (error) return error;

  const body = await req.json();
  const { title, type, price, area, location } = body;

  if (!title?.trim()) return NextResponse.json({ error: "Title is required" }, { status: 422 });
  if (!["plot", "house", "apartment"].includes(type)) return NextResponse.json({ error: "Invalid property type" }, { status: 422 });
  if (!price || Number(price) <= 0) return NextResponse.json({ error: "Valid price is required" }, { status: 422 });
  if (!area || Number(area) <= 0) return NextResponse.json({ error: "Valid area is required" }, { status: 422 });
  if (!location?.trim()) return NextResponse.json({ error: "Location is required" }, { status: 422 });

  await connectDB();

  const property = await Property.create({
    title: body.title.trim(),
    type: body.type,
    status: body.status ?? "available",
    price: Number(body.price),
    area: Number(body.area),
    areaUnit: body.areaUnit ?? "marla",
    location: body.location.trim(),
    description: body.description ?? "",
    bedrooms: body.bedrooms ? Number(body.bedrooms) : undefined,
    bathrooms: body.bathrooms ? Number(body.bathrooms) : undefined,
    floor: body.floor ? Number(body.floor) : undefined,
    facing: body.facing ?? "",
    features: Array.isArray(body.features) ? body.features : [],
    images: Array.isArray(body.images) ? body.images : [],
    assignedAgent: body.assignedAgent || null,
    createdBy: session!.user.id,
  });

  return NextResponse.json(property, { status: 201 });
}
