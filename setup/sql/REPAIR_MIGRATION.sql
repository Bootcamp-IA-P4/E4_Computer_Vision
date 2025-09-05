-- Script de reparación: Frame Capture Feature
-- Description: Fixes frame_captures table and ensures all columns exist
-- Execute this script to repair the frame_captures table

-- =======================================================================
-- CLEANUP: Remove incomplete table and constraints
-- =======================================================================

-- Drop existing foreign key constraint if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_detections_frame_capture'
    ) THEN
        ALTER TABLE detections DROP CONSTRAINT fk_detections_frame_capture;
    END IF;
END $$;

-- Drop frame_capture_id column from detections if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'detections' AND column_name = 'frame_capture_id'
    ) THEN
        ALTER TABLE detections DROP COLUMN frame_capture_id;
    END IF;
END $$;

-- Drop frame_captures table if it exists (to recreate it properly)
DROP TABLE IF EXISTS frame_captures CASCADE;

-- =======================================================================
-- RECREATION: Create frame_captures table correctly
-- =======================================================================

-- Create frame_captures table with ALL required columns
CREATE TABLE frame_captures (
    id SERIAL PRIMARY KEY,
    file_id INTEGER NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    frame_number INTEGER NOT NULL,
    bucket VARCHAR(255) NOT NULL,
    path TEXT NOT NULL,
    public_url TEXT NOT NULL,
    t_start DECIMAL(10, 3),
    t_end DECIMAL(10, 3),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_frame_captures_file_id ON frame_captures(file_id);
CREATE INDEX idx_frame_captures_frame_number ON frame_captures(frame_number);
CREATE INDEX idx_frame_captures_created_at ON frame_captures(created_at);

-- Add comments for documentation
COMMENT ON TABLE frame_captures IS 'Stores full frame captures when logos are detected in videos or images. Provides complete visual context for detections.';
COMMENT ON COLUMN frame_captures.id IS 'Primary key for frame capture record';
COMMENT ON COLUMN frame_captures.file_id IS 'Foreign key reference to files table';
COMMENT ON COLUMN frame_captures.frame_number IS 'Frame number in the video (0 for images)';
COMMENT ON COLUMN frame_captures.bucket IS 'Supabase storage bucket name where frame is stored';
COMMENT ON COLUMN frame_captures.path IS 'Storage path of the frame capture file';
COMMENT ON COLUMN frame_captures.public_url IS 'Public URL to access the frame capture';
COMMENT ON COLUMN frame_captures.t_start IS 'Start time in seconds for video frames';
COMMENT ON COLUMN frame_captures.t_end IS 'End time in seconds for video frames';
COMMENT ON COLUMN frame_captures.created_at IS 'Timestamp when frame capture was created';

-- =======================================================================
-- UPDATE: Add frame_capture_id to detections table
-- =======================================================================

-- Add frame_capture_id column to detections table
ALTER TABLE detections ADD COLUMN frame_capture_id INTEGER;

-- Add foreign key constraint to frame_captures table
ALTER TABLE detections 
ADD CONSTRAINT fk_detections_frame_capture 
FOREIGN KEY (frame_capture_id) REFERENCES frame_captures(id) 
ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX idx_detections_frame_capture_id ON detections(frame_capture_id);

-- Add comments for documentation
COMMENT ON COLUMN detections.frame_capture_id IS 'Foreign key reference to frame_captures table. Links detection to the full frame capture when the logo was detected.';

-- =======================================================================
-- VERIFICATION
-- =======================================================================

-- Verify frame_captures table structure
SELECT 
    'Frame captures table structure:' AS info,
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'frame_captures'
ORDER BY ordinal_position;

-- Verify detections table has frame_capture_id
SELECT 
    'Detections table frame_capture_id:' AS info,
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'detections' AND column_name = 'frame_capture_id';

-- Verify foreign key constraint
SELECT 
    'Foreign key constraints:' AS info,
    tc.constraint_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name = 'detections'
AND kcu.column_name = 'frame_capture_id';

-- Verify indexes
SELECT 
    'Indexes created:' AS info,
    indexname, 
    tablename
FROM pg_indexes 
WHERE tablename IN ('frame_captures', 'detections')
AND indexname LIKE '%frame_capture%';

-- Final verification - count tables and columns
SELECT 
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'frame_captures') AS frame_captures_table_exists,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'frame_captures') AS frame_captures_columns_count,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'frame_captures' AND column_name = 'bucket') AS bucket_column_exists,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'detections' AND column_name = 'frame_capture_id') AS detections_column_exists;

-- Success message
SELECT 'Frame capture feature REPAIRED successfully! ✅' AS final_status;
