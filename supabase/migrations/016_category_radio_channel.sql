-- Assign radio channel to each category instead of each programme
ALTER TABLE categories
ADD COLUMN IF NOT EXISTS radio_channel_id UUID REFERENCES radio_channels(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_categories_radio_channel_id ON categories(radio_channel_id);

-- Remove radio channel from programmes (channel comes from category)
ALTER TABLE audio_programmes DROP COLUMN IF EXISTS radio_channel_id;
DROP INDEX IF EXISTS idx_audio_programmes_radio_channel_id;
