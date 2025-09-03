-- Экстренное исправление проблемы с total_seconds
-- Этот скрипт быстро исправляет проблему с NULL значениями

-- =======================================================================
-- ЭКСТРЕННОЕ ИСПРАВЛЕНИЕ: total_seconds
-- =======================================================================

-- Сделать поле total_seconds nullable
ALTER TABLE predictions ALTER COLUMN total_seconds DROP NOT NULL;

-- Обновить NULL значения на 0
UPDATE predictions SET total_seconds = 0 WHERE total_seconds IS NULL;

-- =======================================================================
-- ЭКСТРЕННОЕ ИСПРАВЛЕНИЕ: percentage
-- =======================================================================

-- Добавить поле percentage если его нет
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'predictions' AND column_name = 'percentage'
    ) THEN
        ALTER TABLE predictions ADD COLUMN percentage FLOAT;
        UPDATE predictions SET percentage = 0 WHERE percentage IS NULL;
    END IF;
END $$;

-- =======================================================================
-- ЭКСТРЕННОЕ ИСПРАВЛЕНИЕ: files table
-- =======================================================================

-- Добавить поля в таблицу files если их нет
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'files' AND column_name = 'duration_seconds'
    ) THEN
        ALTER TABLE files ADD COLUMN duration_seconds INTEGER;
        UPDATE files SET duration_seconds = 60 WHERE duration_seconds IS NULL AND file_type = 'video';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'files' AND column_name = 'fps'
    ) THEN
        ALTER TABLE files ADD COLUMN fps FLOAT;
        UPDATE files SET fps = 30 WHERE fps IS NULL AND file_type = 'video';
    END IF;
END $$;

-- =======================================================================
-- ПРОВЕРКА
-- =======================================================================

-- Проверим, что все исправлено
SELECT 
    'Emergency fix completed!' AS status,
    (SELECT COUNT(*) FROM predictions WHERE total_seconds IS NULL) as null_total_seconds,
    (SELECT COUNT(*) FROM files WHERE duration_seconds IS NULL) as null_duration_seconds;

SELECT 'Emergency fix completed successfully! ✅' AS final_status;
