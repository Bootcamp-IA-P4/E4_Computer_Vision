-- Script completo de migración: Frame Capture Feature
-- Description: Creates frame_captures table and updates detections table
-- Execute this script in Supabase SQL Editor to enable frame capture functionality

-- =======================================================================
-- PART 1: Create frame_captures table
-- =======================================================================

-- Create frame_captures table to store full frame captures when logos are detected
CREATE TABLE IF NOT EXISTS frame_captures (
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
CREATE INDEX IF NOT EXISTS idx_frame_captures_file_id ON frame_captures(file_id);
CREATE INDEX IF NOT EXISTS idx_frame_captures_frame_number ON frame_captures(frame_number);
CREATE INDEX IF NOT EXISTS idx_frame_captures_created_at ON frame_captures(created_at);

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
-- PART 2: Update detections table
-- =======================================================================

-- Add frame_capture_id column to detections table (only if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'detections' AND column_name = 'frame_capture_id'
    ) THEN
        ALTER TABLE detections ADD COLUMN frame_capture_id INTEGER;
    END IF;
END $$;

-- Add foreign key constraint to frame_captures table (only if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_detections_frame_capture'
    ) THEN
        ALTER TABLE detections 
        ADD CONSTRAINT fk_detections_frame_capture 
        FOREIGN KEY (frame_capture_id) REFERENCES frame_captures(id) 
        ON DELETE SET NULL;
    END IF;
END $$;

-- Add index for better query performance (only if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_detections_frame_capture_id'
    ) THEN
        CREATE INDEX idx_detections_frame_capture_id ON detections(frame_capture_id);
    END IF;
END $$;

-- Add comments for documentation
COMMENT ON COLUMN detections.frame_capture_id IS 'Foreign key reference to frame_captures table. Links detection to the full frame capture when the logo was detected.';

-- =======================================================================
-- VERIFICATION
-- =======================================================================

-- Verify frame_captures table was created
SELECT 'frame_captures table created' AS status, COUNT(*) AS table_count
FROM information_schema.tables 
WHERE table_name = 'frame_captures';

-- Verify frame_capture_id column was added to detections
SELECT 'frame_capture_id column added' AS status, COUNT(*) AS column_count
FROM information_schema.columns 
WHERE table_name = 'detections' AND column_name = 'frame_capture_id';

-- Verify foreign key constraint was created
SELECT 'foreign key constraint created' AS status, COUNT(*) AS constraint_count
FROM information_schema.table_constraints 
WHERE constraint_name = 'fk_detections_frame_capture';

-- Show all columns in frame_captures table
SELECT 
    'frame_captures columns' AS info,
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'frame_captures'
ORDER BY ordinal_position;

-- Success message
SELECT 'Frame capture feature successfully enabled! 🎉' AS final_status;
