-- COMPLETE DATABASE MIGRATION SCRIPT
-- Execute this entire script in your Supabase SQL editor
-- This will fix all database schema issues for the Logo Detection API

-- =====================================
-- 1. Check existing frame_captures structure and fix it
-- =====================================

-- First, let's see what exists
SELECT 'Current frame_captures structure:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'frame_captures' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Create frame_captures table if it doesn't exist (with correct column names)
CREATE TABLE IF NOT EXISTS frame_captures (
    id SERIAL PRIMARY KEY,
    file_id INTEGER REFERENCES files(id) ON DELETE CASCADE,
    frame_number INTEGER NOT NULL,
    timestamp_seconds FLOAT NOT NULL,
    frame_url TEXT NOT NULL,
    detections_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns if they don't exist
ALTER TABLE frame_captures 
ADD COLUMN IF NOT EXISTS detections_count INTEGER DEFAULT 0;

-- If the table exists but with different column names, let's try to detect and fix common variations
-- Check if 't_start' exists instead of 'timestamp_seconds'
DO $$
BEGIN
    -- Check if timestamp_seconds exists, if not try to add it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'frame_captures' 
        AND column_name = 'timestamp_seconds'
        AND table_schema = 'public'
    ) THEN
        -- If t_start exists, we might need to work with that instead
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'frame_captures' 
            AND column_name = 't_start'
            AND table_schema = 'public'
        ) THEN
            RAISE NOTICE 'Found t_start column instead of timestamp_seconds';
        ELSE
            -- Add timestamp_seconds if neither exists
            ALTER TABLE frame_captures ADD COLUMN timestamp_seconds FLOAT NOT NULL DEFAULT 0;
        END IF;
    END IF;
END $$;

-- =====================================
-- 2. Enhance predictions table
-- =====================================

-- Add new statistics columns to the predictions table
ALTER TABLE public.predictions 
ADD COLUMN IF NOT EXISTS total_detections INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS avg_score NUMERIC(4,3) NULL CHECK (avg_score >= 0 AND avg_score <= 1),
ADD COLUMN IF NOT EXISTS max_score NUMERIC(4,3) NULL CHECK (max_score >= 0 AND max_score <= 1),
ADD COLUMN IF NOT EXISTS min_score NUMERIC(4,3) NULL CHECK (min_score >= 0 AND min_score <= 1),
ADD COLUMN IF NOT EXISTS duration_seconds NUMERIC(10,3) NULL CHECK (duration_seconds >= 0),
ADD COLUMN IF NOT EXISTS first_detection_time NUMERIC(10,3) NULL CHECK (first_detection_time >= 0),
ADD COLUMN IF NOT EXISTS last_detection_time NUMERIC(10,3) NULL CHECK (last_detection_time >= 0);

-- =====================================
-- 3. Create all necessary indexes
-- =====================================

-- Frame captures indexes
CREATE INDEX IF NOT EXISTS idx_frame_captures_file_id ON frame_captures(file_id);
CREATE INDEX IF NOT EXISTS idx_frame_captures_timestamp ON frame_captures(timestamp_seconds);
CREATE INDEX IF NOT EXISTS idx_frame_captures_detections_count ON frame_captures(detections_count);

-- Enhanced predictions indexes
CREATE INDEX IF NOT EXISTS pred_total_detections_idx ON public.predictions USING btree (total_detections);
CREATE INDEX IF NOT EXISTS pred_avg_score_idx ON public.predictions USING btree (avg_score);
CREATE INDEX IF NOT EXISTS pred_duration_idx ON public.predictions USING btree (duration_seconds);

-- =====================================
-- 4. Add documentation comments
-- =====================================

-- Frame captures comments
COMMENT ON TABLE frame_captures IS 'Capturas completas de frames donde se detectaron logos';
COMMENT ON COLUMN frame_captures.file_id IS 'ID del archivo de video procesado';
COMMENT ON COLUMN frame_captures.frame_number IS 'Número de frame en el video';
COMMENT ON COLUMN frame_captures.timestamp_seconds IS 'Timestamp en segundos del frame';
COMMENT ON COLUMN frame_captures.frame_url IS 'URL de la captura completa del frame en Supabase Storage';
COMMENT ON COLUMN frame_captures.detections_count IS 'Número de detecciones encontradas en este frame';

-- Enhanced predictions comments
COMMENT ON TABLE public.predictions IS 'Complete brand detection statistics and predictions for processed videos';
COMMENT ON COLUMN public.predictions.total_detections IS 'Total number of detections found for this brand in the video';
COMMENT ON COLUMN public.predictions.avg_score IS 'Average confidence score of all detections for this brand';
COMMENT ON COLUMN public.predictions.max_score IS 'Maximum confidence score found for this brand';
COMMENT ON COLUMN public.predictions.min_score IS 'Minimum confidence score found for this brand';
COMMENT ON COLUMN public.predictions.duration_seconds IS 'Duration between first and last detection in seconds';
COMMENT ON COLUMN public.predictions.first_detection_time IS 'Timestamp of first detection in seconds';
COMMENT ON COLUMN public.predictions.last_detection_time IS 'Timestamp of last detection in seconds';

-- =====================================
-- 5. Verification queries
-- =====================================

-- Verify frame_captures table structure
SELECT 'frame_captures' as table_name, 
       column_name,
       data_type,
       is_nullable,
       column_default
FROM information_schema.columns 
WHERE table_name = 'frame_captures' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verify predictions table structure
SELECT 'predictions' as table_name,
       column_name,
       data_type,
       is_nullable,
       column_default,
       character_maximum_length,
       numeric_precision,
       numeric_scale
FROM information_schema.columns 
WHERE table_name = 'predictions' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Show success message
SELECT 'DATABASE MIGRATION COMPLETED SUCCESSFULLY!' as status,
       'The Logo Detection API database schema is now up to date' as message;
