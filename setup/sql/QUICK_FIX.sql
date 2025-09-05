-- Быстрое исправление проблемы с total_seconds
-- Этот скрипт исправляет проблему с NULL значениями

-- =======================================================================
-- ШАГ 1: Сделать поле total_seconds nullable
-- =======================================================================

-- Проверим, есть ли поле total_seconds в таблице predictions
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'predictions' AND column_name = 'total_seconds'
    ) THEN
        -- Сделать поле nullable
        ALTER TABLE predictions ALTER COLUMN total_seconds DROP NOT NULL;
        
        -- Обновить NULL значения на 0
        UPDATE predictions 
        SET total_seconds = 0 
        WHERE total_seconds IS NULL;
        
        RAISE NOTICE 'total_seconds column made nullable and NULL values updated';
    ELSE
        RAISE NOTICE 'total_seconds column does not exist';
    END IF;
END $$;

-- =======================================================================
-- ШАГ 2: Добавить поле percentage если его нет
-- =======================================================================

-- Проверим, есть ли поле percentage в таблице predictions
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'predictions' AND column_name = 'percentage'
    ) THEN
        -- Добавить поле percentage
        ALTER TABLE predictions ADD COLUMN percentage FLOAT;
        
        -- Обновить NULL значения на 0
        UPDATE predictions 
        SET percentage = 0 
        WHERE percentage IS NULL;
        
        RAISE NOTICE 'percentage column added';
    ELSE
        RAISE NOTICE 'percentage column already exists';
    END IF;
END $$;

-- =======================================================================
-- ШАГ 3: Проверить таблицу files
-- =======================================================================

-- Проверим, есть ли поле duration_seconds в таблице files
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'files' AND column_name = 'duration_seconds'
    ) THEN
        -- Добавить поле duration_seconds
        ALTER TABLE files ADD COLUMN duration_seconds INTEGER;
        
        -- Обновить NULL значения на 0
        UPDATE files 
        SET duration_seconds = 0 
        WHERE duration_seconds IS NULL;
        
        RAISE NOTICE 'duration_seconds column added to files table';
    ELSE
        RAISE NOTICE 'duration_seconds column already exists in files table';
    END IF;
END $$;

-- =======================================================================
-- ПРОВЕРКА: Результаты
-- =======================================================================

-- Проверим структуру таблицы predictions
SELECT 
    'Predictions table structure:' AS info,
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'predictions'
ORDER BY ordinal_position;

-- Проверим структуру таблицы files
SELECT 
    'Files table structure:' AS info,
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'files'
ORDER BY ordinal_position;

-- Проверим, есть ли NULL значения
SELECT 
    'NULL values check:' AS info,
    (SELECT COUNT(*) FROM predictions WHERE total_seconds IS NULL) as null_total_seconds,
    (SELECT COUNT(*) FROM predictions WHERE percentage IS NULL) as null_percentage,
    (SELECT COUNT(*) FROM files WHERE duration_seconds IS NULL) as null_duration_seconds;

SELECT 'Quick fix completed successfully! ✅' AS final_status;
