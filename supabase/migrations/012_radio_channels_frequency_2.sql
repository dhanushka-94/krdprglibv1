-- Second frequency per radio channel
ALTER TABLE radio_channels
ADD COLUMN IF NOT EXISTS frequency_2 TEXT;
