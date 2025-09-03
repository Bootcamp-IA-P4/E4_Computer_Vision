-- Script для исправления таблицы files
-- Description: Проверяет и исправляет структуру таблицы files

-- =======================================================================
-- ПРОВЕРКА: Структура таблицы files
-- =======================================================================

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

-- =======================================================================
-- ПРОВЕРКА: Данные в таблице files
-- =======================================================================

-- Проверим, есть ли файлы с duration_seconds
SELECT 
    'Files with duration_seconds:' AS info,
    id,
    filename,
    file_type,
    duration_seconds,
    fps,
    created_at
FROM files 
WHERE duration_seconds IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

-- Проверим файлы без duration_seconds
SELECT 
    'Files without duration_seconds:' AS info,
    id,
    filename,
    file_type,
    duration_seconds,
    fps,
    created_at
FROM files 
WHERE duration_seconds IS NULL
ORDER BY created_at DESC
LIMIT 10;

-- =======================================================================
-- ИСПРАВЛЕНИЕ: Добавить duration_seconds если его нет
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
        
        RAISE NOTICE 'duration_seconds column added to files table';
    ELSE
        RAISE NOTICE 'duration_seconds column already exists in files table';
    END IF;
END $$;

-- =======================================================================
-- ИСПРАВЛЕНИЕ: Добавить fps если его нет
-- =======================================================================

-- Проверим, есть ли поле fps в таблице files
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'files' AND column_name = 'fps'
    ) THEN
        -- Добавить поле fps
        ALTER TABLE files ADD COLUMN fps FLOAT;
        
        RAISE NOTICE 'fps column added to files table';
    ELSE
        RAISE NOTICE 'fps column already exists in files table';
    END IF;
END $$;

-- =======================================================================
-- ИСПРАВЛЕНИЕ: Обновить NULL значения
-- =======================================================================

-- Обновить NULL значения duration_seconds на 0 для видео файлов
UPDATE files 
SET duration_seconds = 0 
WHERE duration_seconds IS NULL AND file_type = 'video';

-- Обновить NULL значения fps на 30 для видео файлов
UPDATE files 
SET fps = 30 
WHERE fps IS NULL AND file_type = 'video';

-- =======================================================================
-- ПРОВЕРКА: Результаты исправления
-- =======================================================================

-- Проверим финальную структуру
SELECT 
    'Final files table structure:' AS info,
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'files'
ORDER BY ordinal_position;

-- Проверим данные после исправления
SELECT 
    'Files data after fix:' AS info,
    id,
    filename,
    file_type,
    duration_seconds,
    fps,
    created_at
FROM files 
ORDER BY created_at DESC
LIMIT 10;

-- Проверим, есть ли еще NULL значения
SELECT 
    'NULL values check:' AS info,
    COUNT(*) FILTER (WHERE duration_seconds IS NULL) as null_duration,
    COUNT(*) FILTER (WHERE fps IS NULL) as null_fps,
    COUNT(*) as total_files
FROM files;

SELECT 'Files table fix completed successfully! ✅' AS final_status;
