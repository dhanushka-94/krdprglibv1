-- Category broadcast schedules: time slots per category per radio channel
-- day_of_week: 0=Sunday, 1=Monday, ... 6=Saturday. NULL when is_daily=true
-- A category can have multiple slots (e.g. Mon 8am + Thu 2pm)
CREATE TABLE IF NOT EXISTS category_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  radio_channel_id UUID NOT NULL REFERENCES radio_channels(id) ON DELETE CASCADE,
  day_of_week SMALLINT, -- 0=Sun .. 6=Sat, NULL when is_daily
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_daily BOOLEAN NOT NULL DEFAULT false,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT chk_day_of_week CHECK (day_of_week IS NULL OR (day_of_week >= 0 AND day_of_week <= 6)),
  CONSTRAINT chk_end_after_start CHECK (end_time > start_time)
);

CREATE INDEX IF NOT EXISTS idx_category_schedules_category_id ON category_schedules(category_id);
CREATE INDEX IF NOT EXISTS idx_category_schedules_radio_channel_id ON category_schedules(radio_channel_id);
CREATE INDEX IF NOT EXISTS idx_category_schedules_day ON category_schedules(day_of_week);

ALTER TABLE category_schedules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for category_schedules" ON category_schedules;
CREATE POLICY "Allow all for category_schedules" ON category_schedules FOR ALL USING (true) WITH CHECK (true);
