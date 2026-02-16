-- Add stream_url for web streaming (e.g. http://220.247.227.20:8000/kandystream)
ALTER TABLE radio_channels
ADD COLUMN IF NOT EXISTS stream_url TEXT;
