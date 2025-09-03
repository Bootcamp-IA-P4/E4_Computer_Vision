-- Complete fix for duration and percentage issues
-- This script fixes all duration-related problems in the database

-- =======================================================================
-- STEP 1: Fix total_seconds column
-- =======================================================================

-- Make total_seconds column nullable if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'predictions' AND column_name = 'total_seconds'
    ) THEN
        -- Make total_seconds nullable
        ALTER TABLE predictions ALTER COLUMN total_seconds DROP NOT NULL;
        
        -- Update NULL values with duration_seconds or 0
        UPDATE predictions 
        SET total_seconds = COALESCE(duration_seconds, 0)
        WHERE total_seconds IS NULL;
        
        RAISE NOTICE 'total_seconds column fixed - made nullable and NULL values updated';
    ELSE
        RAISE NOTICE 'total_seconds column does not exist';
    END IF;
END $$;

-- =======================================================================
-- STEP 2: Add percentage column if it doesn't exist
-- =======================================================================

-- Add percentage column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'predictions' AND column_name = 'percentage'
    ) THEN
        -- Add percentage column as nullable
        ALTER TABLE predictions ADD COLUMN percentage FLOAT;
        
        -- Calculate percentage based on duration_seconds and video duration from files table
        UPDATE predictions 
        SET percentage = (
            CASE 
                WHEN f.duration_seconds > 0 THEN (p.duration_seconds / f.duration_seconds * 100)
                ELSE 0
            END
        )
        FROM files f
        WHERE p.video_id = f.id;
        
        RAISE NOTICE 'percentage column added and calculated';
    ELSE
        RAISE NOTICE 'percentage column already exists';
    END IF;
END $$;

-- =======================================================================
-- STEP 3: Update existing predictions with correct values
-- =======================================================================

-- Update predictions with correct total_seconds and percentage
UPDATE predictions 
SET 
    total_seconds = COALESCE(duration_seconds, 0),
    percentage = (
        CASE 
            WHEN f.duration_seconds > 0 THEN (p.duration_seconds / f.duration_seconds * 100)
            ELSE 0
        END
    )
FROM files f
WHERE p.video_id = f.id;

-- =======================================================================
-- VERIFICATION
-- =======================================================================

-- Verify the final structure
SELECT 
    'Final predictions table structure:' AS info,
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'predictions'
ORDER BY ordinal_position;

-- Check for any remaining NULL values
SELECT 
    'NULL values check:' AS info,
    COUNT(*) FILTER (WHERE total_seconds IS NULL) as null_total_seconds,
    COUNT(*) FILTER (WHERE percentage IS NULL) as null_percentage,
    COUNT(*) as total_predictions
FROM predictions;

-- Show sample data
SELECT 
    'Sample predictions data:' AS info,
    id,
    video_id,
    brand_id,
    total_detections,
    duration_seconds,
    total_seconds,
    percentage
FROM predictions 
LIMIT 5;

-- Show files with duration
SELECT 
    'Files with duration:' AS info,
    id,
    filename,
    duration_seconds,
    fps
FROM files 
WHERE duration_seconds IS NOT NULL
LIMIT 5;

SELECT 'Complete duration fix completed successfully! ✅' AS final_status;
