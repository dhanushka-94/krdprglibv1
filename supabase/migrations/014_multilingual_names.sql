-- Add Sinhala and Tamil name columns to categories
ALTER TABLE categories ADD COLUMN IF NOT EXISTS name_si TEXT NOT NULL DEFAULT '';
ALTER TABLE categories ADD COLUMN IF NOT EXISTS name_ta TEXT NOT NULL DEFAULT '';

-- Add Sinhala and Tamil name columns to subcategories
ALTER TABLE subcategories ADD COLUMN IF NOT EXISTS name_si TEXT NOT NULL DEFAULT '';
ALTER TABLE subcategories ADD COLUMN IF NOT EXISTS name_ta TEXT NOT NULL DEFAULT '';

-- Add Sinhala and Tamil name columns to radio_channels
ALTER TABLE radio_channels ADD COLUMN IF NOT EXISTS name_si TEXT NOT NULL DEFAULT '';
ALTER TABLE radio_channels ADD COLUMN IF NOT EXISTS name_ta TEXT NOT NULL DEFAULT '';
