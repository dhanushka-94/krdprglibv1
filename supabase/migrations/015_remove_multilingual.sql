-- Remove multilingual columns (rollback if 014 was applied)
ALTER TABLE categories DROP COLUMN IF EXISTS name_si, DROP COLUMN IF EXISTS name_ta;
ALTER TABLE subcategories DROP COLUMN IF EXISTS name_si, DROP COLUMN IF EXISTS name_ta;
ALTER TABLE radio_channels DROP COLUMN IF EXISTS name_si, DROP COLUMN IF EXISTS name_ta;
