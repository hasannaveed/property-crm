/**
 * Run with: npx tsx src/lib/seedInventory.ts
 * Seeds 10 sample properties for development.
 */

import mongoose from "mongoose";
import { connectDB } from "./db";
import Property from "@/models/Property";
import User from "@/models/User";

const SAMPLE_PROPERTIES = [
  {
    title: "5 Marla Corner Plot — DHA Phase 6",
    type: "plot",
    status: "available",
    price: 12_500_000,
    area: 5,
    areaUnit: "marla",
    location: "DHA Phase 6, Lahore",
    description: "Prime corner plot on 30-feet road. All utilities available.",
    features: ["Corner", "Gas Available", "Main Boulevard"],
    facing: "East",
  },
  {
    title: "10 Marla House — Bahria Town Phase 4",
    type: "house",
    status: "available",
    price: 28_000_000,
    area: 10,
    areaUnit: "marla",
    location: "Bahria Town Phase 4, Rawalpindi",
    description: "Fully furnished 5-bedroom house with basement and double garage.",
    bedrooms: 5,
    bathrooms: 6,
    features: ["Gated Community", "Park Facing", "Gas Available"],
    facing: "Park Facing",
  },
  {
    title: "2 Bed Apartment — Gulberg III",
    type: "apartment",
    status: "available",
    price: 9_500_000,
    area: 1050,
    areaUnit: "sqft",
    location: "Gulberg III, Lahore",
    description: "Modern apartment on 5th floor with city view and dedicated parking.",
    bedrooms: 2,
    bathrooms: 2,
    floor: 5,
    features: ["Gated Community", "Near Park"],
    facing: "West",
  },
  {
    title: "1 Kanal Residential Plot — Johar Town",
    type: "plot",
    status: "reserved",
    price: 35_000_000,
    area: 20,
    areaUnit: "marla",
    location: "Johar Town, Lahore",
    description: "1 Kanal plot in the heart of Johar Town. Ready for construction.",
    features: ["Near Mosque", "Double Road"],
    facing: "North",
  },
  {
    title: "3 Marla House — Wapda Town",
    type: "house",
    status: "available",
    price: 7_200_000,
    area: 3,
    areaUnit: "marla",
    location: "Wapda Town, Lahore",
    description: "Brand new 3 Marla double-story house. Ready for possession.",
    bedrooms: 3,
    bathrooms: 3,
    features: ["Gas Available"],
    facing: "South",
  },
  {
    title: "3 Bed Luxury Apartment — Clifton Block 5",
    type: "apartment",
    status: "available",
    price: 45_000_000,
    area: 2800,
    areaUnit: "sqft",
    location: "Clifton Block 5, Karachi",
    description: "Sea-view luxury apartment with top-of-the-line fittings and gym access.",
    bedrooms: 3,
    bathrooms: 4,
    floor: 12,
    features: ["Gated Community", "Near Park", "Corner"],
    facing: "Sea Facing",
  },
  {
    title: "5 Marla Plot — Bahria Orchard",
    type: "plot",
    status: "sold",
    price: 6_500_000,
    area: 5,
    areaUnit: "marla",
    location: "Bahria Orchard Phase 1, Lahore",
    description: "Residential plot in Bahria Orchard. Possession available.",
    features: ["Gas Available", "Near Mosque"],
    facing: "East",
  },
  {
    title: "7 Marla House — G-11 Islamabad",
    type: "house",
    status: "available",
    price: 42_000_000,
    area: 7,
    areaUnit: "marla",
    location: "G-11/3, Islamabad",
    description: "Well-maintained house with rooftop and a private garden.",
    bedrooms: 4,
    bathrooms: 5,
    features: ["Corner", "Near Park", "Double Road"],
    facing: "South",
  },
  {
    title: "Studio Apartment — Gulshan-e-Iqbal",
    type: "apartment",
    status: "available",
    price: 4_800_000,
    area: 650,
    areaUnit: "sqft",
    location: "Gulshan-e-Iqbal, Karachi",
    description: "Compact studio apartment ideal for investment. Rental yield: ~6%.",
    bedrooms: 1,
    bathrooms: 1,
    floor: 3,
    features: ["Gated Community"],
    facing: "East",
  },
  {
    title: "2 Kanal Farm House Plot — Bedian Road",
    type: "plot",
    status: "available",
    price: 18_000_000,
    area: 40,
    areaUnit: "marla",
    location: "Bedian Road, Lahore",
    description: "Ideal for farm house construction. Tube well available on site.",
    features: ["Double Road", "Gas Available"],
    facing: "North",
  },
];

async function seed() {
  await connectDB();

  const admin = await User.findOne({ role: "admin" }).lean() as { _id: mongoose.Types.ObjectId } | null;
  if (!admin) {
    console.error("No admin user found. Create an admin first via /api/auth/signup.");
    process.exit(1);
  }

  const existing = await Property.countDocuments();
  if (existing > 0) {
    console.log(`${existing} properties already exist. Skipping seed.`);
    process.exit(0);
  }

  const docs = SAMPLE_PROPERTIES.map((p) => ({ ...p, createdBy: admin._id }));
  await Property.insertMany(docs);
  console.log(`Seeded ${docs.length} properties successfully.`);
  process.exit(0);
}

seed().catch((err) => { console.error(err); process.exit(1); });
