-- Radio channels: name, frequency, logo (for "broadcasted on" per programme)
CREATE TABLE IF NOT EXISTS radio_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  frequency TEXT,
  logo_url TEXT,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_radio_channels_display_order ON radio_channels(display_order);

ALTER TABLE radio_channels ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for radio_channels" ON radio_channels;
CREATE POLICY "Allow all for radio_channels" ON radio_channels FOR ALL USING (true) WITH CHECK (true);
