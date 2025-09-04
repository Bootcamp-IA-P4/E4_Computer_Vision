-- Migration: Fix frame_captures table structure
-- Execute this in your Supabase SQL editor

-- First, check if the table exists and create it if it doesn't
CREATE TABLE IF NOT EXISTS frame_captures (
    id SERIAL PRIMARY KEY,
    file_id INTEGER REFERENCES files(id) ON DELETE CASCADE,
    frame_number INTEGER NOT NULL,
    timestamp_seconds FLOAT NOT NULL,
    frame_url TEXT NOT NULL,
    detections_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add the detections_count column if it doesn't exist
ALTER TABLE frame_captures 
ADD COLUMN IF NOT EXISTS detections_count INTEGER DEFAULT 0;

-- Ensure all indexes exist
CREATE INDEX IF NOT EXISTS idx_frame_captures_file_id ON frame_captures(file_id);
CREATE INDEX IF NOT EXISTS idx_frame_captures_timestamp ON frame_captures(timestamp_seconds);
CREATE INDEX IF NOT EXISTS idx_frame_captures_detections_count ON frame_captures(detections_count);

-- Add comments for documentation
COMMENT ON TABLE frame_captures IS 'Capturas completas de frames donde se detectaron logos';
COMMENT ON COLUMN frame_captures.file_id IS 'ID del archivo de video procesado';
COMMENT ON COLUMN frame_captures.frame_number IS 'Número de frame en el video';
COMMENT ON COLUMN frame_captures.timestamp_seconds IS 'Timestamp en segundos del frame';
COMMENT ON COLUMN frame_captures.frame_url IS 'URL de la captura completa del frame en Supabase Storage';
COMMENT ON COLUMN frame_captures.detections_count IS 'Número de detecciones encontradas en este frame';

-- Show the table structure to verify
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'frame_captures' 
  AND table_schema = 'public'
ORDER BY ordinal_position;
