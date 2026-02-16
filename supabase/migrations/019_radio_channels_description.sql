-- Add description for radio player page (about the channel)
ALTER TABLE radio_channels
ADD COLUMN IF NOT EXISTS description TEXT;
