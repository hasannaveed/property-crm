// Transform Supabase snake_case rows → camelCase shape the frontend expects

export function mapProfile(p: Record<string, unknown> | null) {
  if (!p) return null;
  return { _id: p.id, name: p.name, email: p.email, role: p.role };
}

export function mapProperty(p: Record<string, unknown> | null) {
  if (!p) return null;
  const assigned = p.assigned_to;
  const createdBy = p.created_by;
  return {
    _id: p.id,
    title: p.title,
    type: p.type,
    status: p.status,
    price: p.price,
    area: p.area,
    areaUnit: p.area_unit,
    location: p.location,
    description: p.description,
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    floor: p.floor,
    facing: p.facing,
    features: p.features,
    images: p.images,
    assignedAgent: assigned && typeof assigned === "object" ? mapProfile(assigned as Record<string, unknown>) : (assigned ?? null),
    createdBy: createdBy && typeof createdBy === "object" ? mapProfile(createdBy as Record<string, unknown>) : (createdBy ?? null),
    createdAt: p.created_at,
    updatedAt: p.updated_at,
  };
}

export function mapLead(lead: Record<string, unknown> | null) {
  if (!lead) return null;
  const assignedTo = lead.assigned_to;
  const interestedIn = lead.interested_in;
  return {
    _id: lead.id,
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    propertyInterest: lead.property_interest,
    budget: lead.budget,
    status: lead.status,
    priority: lead.priority,
    score: lead.score,
    notes: lead.notes,
    source: lead.source,
    assignedTo: assignedTo && typeof assignedTo === "object" ? mapProfile(assignedTo as Record<string, unknown>) : (assignedTo ?? null),
    followUpDate: lead.follow_up_date,
    lastActivityAt: lead.last_activity_at,
    interestedIn: interestedIn && typeof interestedIn === "object" ? mapProperty(interestedIn as Record<string, unknown>) : (interestedIn ?? null),
    propertyType: lead.property_type,
    budgetMin: lead.budget_min,
    budgetMax: lead.budget_max,
    createdAt: lead.created_at,
    updatedAt: lead.updated_at,
  };
}

export function mapActivity(a: Record<string, unknown> | null) {
  if (!a) return null;
  const performedBy = a.performed_by;
  const lead = a.lead;
  return {
    _id: a.id,
    lead: lead && typeof lead === "object" ? mapLead(lead as Record<string, unknown>) : (lead ?? null),
    performedBy: performedBy && typeof performedBy === "object" ? mapProfile(performedBy as Record<string, unknown>) : (performedBy ?? null),
    type: a.type,
    description: a.description,
    metadata: a.metadata,
    createdAt: a.created_at,
  };
}

export function isValidUUID(id: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}
