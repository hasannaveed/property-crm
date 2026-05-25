-- Run this in the Supabase SQL editor to set up the schema.

-- Profiles table (extends auth.users with role and display info)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'agent' CHECK (role IN ('admin', 'agent')),
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Properties table
CREATE TABLE IF NOT EXISTS properties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('plot', 'house', 'apartment')),
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'sold')),
  price NUMERIC NOT NULL,
  area NUMERIC NOT NULL,
  area_unit TEXT NOT NULL DEFAULT 'marla' CHECK (area_unit IN ('marla', 'sqft')),
  location TEXT NOT NULL,
  description TEXT DEFAULT '',
  bedrooms INT,
  bathrooms INT,
  floor INT,
  facing TEXT,
  features TEXT[] DEFAULT '{}',
  images TEXT[] DEFAULT '{}',
  assigned_agent UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_by UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Leads table
CREATE TABLE IF NOT EXISTS leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  property_interest TEXT NOT NULL,
  budget NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'in-progress', 'site-visit', 'negotiation', 'closed-won', 'closed-lost')),
  priority TEXT NOT NULL DEFAULT 'low' CHECK (priority IN ('high', 'medium', 'low')),
  score INT NOT NULL DEFAULT 0,
  notes TEXT DEFAULT '',
  source TEXT CHECK (source IN ('facebook-ads', 'walk-in', 'website', 'referral', 'other')),
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  follow_up_date TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ DEFAULT now(),
  interested_in UUID REFERENCES properties(id) ON DELETE SET NULL,
  property_type TEXT DEFAULT 'any' CHECK (property_type IN ('plot', 'house', 'apartment', 'any')),
  budget_min NUMERIC,
  budget_max NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Activities table
CREATE TABLE IF NOT EXISTS activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE NOT NULL,
  performed_by UUID REFERENCES profiles(id) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('lead_created', 'status_updated', 'assigned', 'reassigned', 'notes_updated', 'follow_up_set', 'priority_changed', 'lead_deleted')),
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_priority ON leads(priority);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_follow_up_date ON leads(follow_up_date);
CREATE INDEX IF NOT EXISTS idx_leads_interested_in ON leads(interested_in);
CREATE INDEX IF NOT EXISTS idx_activities_lead_id ON activities(lead_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_properties_type ON properties(type);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_price ON properties(price);
CREATE INDEX IF NOT EXISTS idx_properties_created_at ON properties(created_at DESC);

-- Row Level Security (disable for simplicity — access control is in API routes)
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE properties DISABLE ROW LEVEL SECURITY;
ALTER TABLE leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE activities DISABLE ROW LEVEL SECURITY;
