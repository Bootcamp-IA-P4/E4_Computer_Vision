-- Script для проверки длительности видео в таблице files
-- Description: Проверяет, что в таблице files есть правильные значения duration_seconds

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

-- Проверим все файлы с их длительностью
SELECT 
    'All files with duration:' AS info,
    id,
    filename,
    file_type,
    duration_seconds,
    fps,
    created_at
FROM files 
ORDER BY created_at DESC
LIMIT 20;

-- =======================================================================
-- ПРОВЕРКА: Файлы без длительности
-- =======================================================================

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
ORDER BY created_at DESC;

-- =======================================================================
-- ПРОВЕРКА: Файлы с нулевой длительностью
-- =======================================================================

-- Проверим файлы с duration_seconds = 0
SELECT 
    'Files with duration_seconds = 0:' AS info,
    id,
    filename,
    file_type,
    duration_seconds,
    fps,
    created_at
FROM files 
WHERE duration_seconds = 0
ORDER BY created_at DESC;

-- =======================================================================
-- ПРОВЕРКА: Связь с predictions
-- =======================================================================

-- Проверим связь между files и predictions
SELECT 
    'Files and predictions relationship:' AS info,
    f.id as file_id,
    f.filename,
    f.file_type,
    f.duration_seconds as file_duration,
    COUNT(p.id) as predictions_count,
    AVG(p.duration_seconds) as avg_prediction_duration
FROM files f
LEFT JOIN predictions p ON f.id = p.video_id
GROUP BY f.id, f.filename, f.file_type, f.duration_seconds
ORDER BY f.created_at DESC
LIMIT 10;

-- =======================================================================
-- ИТОГОВАЯ ПРОВЕРКА
-- =======================================================================

-- Проверим статистику
SELECT 
    'Duration statistics:' AS info,
    COUNT(*) as total_files,
    COUNT(*) FILTER (WHERE duration_seconds IS NOT NULL) as files_with_duration,
    COUNT(*) FILTER (WHERE duration_seconds IS NULL) as files_without_duration,
    COUNT(*) FILTER (WHERE duration_seconds = 0) as files_with_zero_duration,
    AVG(duration_seconds) as avg_duration,
    MAX(duration_seconds) as max_duration,
    MIN(duration_seconds) as min_duration
FROM files;

SELECT 'Video duration check completed! ✅' AS final_status;
