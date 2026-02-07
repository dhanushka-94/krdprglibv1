-- Track which user uploaded each programme (for profile / "my uploads")
ALTER TABLE audio_programmes
  ADD COLUMN IF NOT EXISTS created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_audio_programmes_created_by_user_id
  ON audio_programmes(created_by_user_id);

COMMENT ON COLUMN audio_programmes.created_by_user_id IS 'User who created/uploaded this programme';
