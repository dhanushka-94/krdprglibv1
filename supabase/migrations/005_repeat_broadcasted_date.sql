-- Add repeat broadcasted date for re-airs
ALTER TABLE audio_programmes ADD COLUMN IF NOT EXISTS repeat_broadcasted_date DATE;
