-- Quick fix for percentage column in predictions table
-- This script adds percentage column if it doesn't exist

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

-- Verify the fix
SELECT 
    'Predictions table with percentage:' AS info,
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'predictions'
ORDER BY ordinal_position;

SELECT 'Percentage column fix completed! ✅' AS status;
