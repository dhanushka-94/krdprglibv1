-- Link each programme to a radio channel (which channel broadcast it)
ALTER TABLE audio_programmes
ADD COLUMN IF NOT EXISTS radio_channel_id UUID REFERENCES radio_channels(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_audio_programmes_radio_channel_id ON audio_programmes(radio_channel_id);
