-- Site-wide settings (key-value)
CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for site_settings" ON site_settings;
CREATE POLICY "Allow all for site_settings" ON site_settings FOR ALL USING (true) WITH CHECK (true);

-- Default: Import from Storage enabled
INSERT INTO site_settings (key, value)
VALUES ('import_storage_enabled', 'true')
ON CONFLICT (key) DO NOTHING;
