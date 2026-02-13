-- Enable/disable programmes (admin only). Disabled programmes are hidden from public.
ALTER TABLE audio_programmes
ADD COLUMN IF NOT EXISTS enabled BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_audio_programmes_enabled ON audio_programmes(enabled);
