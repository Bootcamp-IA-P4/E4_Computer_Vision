-- Migration: Add statistics fields to predictions table
-- Execute this in your Supabase SQL editor

-- Add new columns to the predictions table
ALTER TABLE public.predictions 
ADD COLUMN IF NOT EXISTS total_detections INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS avg_score NUMERIC(4,3) NULL CHECK (avg_score >= 0 AND avg_score <= 1),
ADD COLUMN IF NOT EXISTS max_score NUMERIC(4,3) NULL CHECK (max_score >= 0 AND max_score <= 1),
ADD COLUMN IF NOT EXISTS min_score NUMERIC(4,3) NULL CHECK (min_score >= 0 AND min_score <= 1),
ADD COLUMN IF NOT EXISTS duration_seconds NUMERIC(10,3) NULL CHECK (duration_seconds >= 0),
ADD COLUMN IF NOT EXISTS first_detection_time NUMERIC(10,3) NULL CHECK (first_detection_time >= 0),
ADD COLUMN IF NOT EXISTS last_detection_time NUMERIC(10,3) NULL CHECK (last_detection_time >= 0);

-- Add comments for documentation
COMMENT ON COLUMN public.predictions.total_detections IS 'Total number of detections found for this brand in the video';
COMMENT ON COLUMN public.predictions.avg_score IS 'Average confidence score of all detections for this brand';
COMMENT ON COLUMN public.predictions.max_score IS 'Maximum confidence score found for this brand';
COMMENT ON COLUMN public.predictions.min_score IS 'Minimum confidence score found for this brand';
COMMENT ON COLUMN public.predictions.duration_seconds IS 'Duration between first and last detection in seconds';
COMMENT ON COLUMN public.predictions.first_detection_time IS 'Timestamp of first detection in seconds';
COMMENT ON COLUMN public.predictions.last_detection_time IS 'Timestamp of last detection in seconds';

-- Create additional indexes for performance
CREATE INDEX IF NOT EXISTS pred_total_detections_idx ON public.predictions USING btree (total_detections);
CREATE INDEX IF NOT EXISTS pred_avg_score_idx ON public.predictions USING btree (avg_score);
CREATE INDEX IF NOT EXISTS pred_duration_idx ON public.predictions USING btree (duration_seconds);

-- Update table comment
COMMENT ON TABLE public.predictions IS 'Complete brand detection statistics and predictions for processed videos';

-- Show the updated table structure
SELECT 
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
