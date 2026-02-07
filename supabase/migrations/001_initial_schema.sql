-- =============================================
-- Krushi Radio Audio Library - Supabase Schema
-- Run this entire script in Supabase SQL Editor
-- =============================================

-- Categories (parent)
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subcategories (child of categories)
CREATE TABLE IF NOT EXISTS subcategories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(category_id, slug)
);

-- Audio Programmes
CREATE TABLE IF NOT EXISTS audio_programmes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  broadcasted_date DATE NOT NULL,
  description TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  subcategory_id UUID REFERENCES subcategories(id) ON DELETE SET NULL,
  firebase_storage_url TEXT NOT NULL,
  firebase_storage_path TEXT NOT NULL,
  file_size_bytes BIGINT,
  duration_seconds INTEGER,
  seo_title TEXT,
  seo_description TEXT,
  seo_keywords TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_subcategories_category_id ON subcategories(category_id);
CREATE INDEX IF NOT EXISTS idx_audio_programmes_category_id ON audio_programmes(category_id);
CREATE INDEX IF NOT EXISTS idx_audio_programmes_subcategory_id ON audio_programmes(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_audio_programmes_broadcasted_date ON audio_programmes(broadcasted_date DESC);
CREATE INDEX IF NOT EXISTS idx_audio_programmes_slug ON audio_programmes(slug);

-- Enable Row Level Security (RLS)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE audio_programmes ENABLE ROW LEVEL SECURITY;

-- Policies: Allow all operations for authenticated and anonymous (app handles auth in API)
DROP POLICY IF EXISTS "Allow all for categories" ON categories;
CREATE POLICY "Allow all for categories" ON categories FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for subcategories" ON subcategories;
CREATE POLICY "Allow all for subcategories" ON subcategories FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for audio_programmes" ON audio_programmes;
CREATE POLICY "Allow all for audio_programmes" ON audio_programmes FOR ALL USING (true) WITH CHECK (true);
