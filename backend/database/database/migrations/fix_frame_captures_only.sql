-- SIMPLE FIX: Add detections_count to frame_captures
-- Execute this in your Supabase SQL editor

-- Add the missing detections_count column to frame_captures
ALTER TABLE public.frame_captures 
ADD COLUMN IF NOT EXISTS detections_count INTEGER DEFAULT 0;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_frame_captures_detections_count ON frame_captures(detections_count);

-- Add comment for documentation
COMMENT ON COLUMN public.frame_captures.detections_count IS 'Número de detecciones encontradas en este frame';

-- Verify the fix
SELECT 'frame_captures updated structure:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'frame_captures' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Success message
SELECT 'FRAME_CAPTURES TABLE FIXED SUCCESSFULLY!' as status;
