-- Migration: Add frame_capture_id to detections table
-- Description: Adds foreign key reference from detections to frame_captures table
-- Date: 2024
-- Author: System

-- Add frame_capture_id column to detections table
ALTER TABLE detections 
ADD COLUMN frame_capture_id INTEGER;

-- Add foreign key constraint to frame_captures table
ALTER TABLE detections 
ADD CONSTRAINT fk_detections_frame_capture 
FOREIGN KEY (frame_capture_id) REFERENCES frame_captures(id) 
ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX idx_detections_frame_capture_id ON detections(frame_capture_id);

-- Add comments for documentation
COMMENT ON COLUMN detections.frame_capture_id IS 'Foreign key reference to frame_captures table. Links detection to the full frame capture when the logo was detected.';

-- Optional: Update existing records to have NULL frame_capture_id (already default)
-- This is safe since we're adding a nullable column

-- Verify the changes
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'detections' 
AND column_name = 'frame_capture_id';

-- Show the new foreign key constraint
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name = 'detections'
AND kcu.column_name = 'frame_capture_id';
