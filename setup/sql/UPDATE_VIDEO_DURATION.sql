-- Script для обновления длительности видео в таблице files
-- Description: Обновляет duration_seconds для видео файлов

-- =======================================================================
-- ОБНОВЛЕНИЕ: Установить длительность для видео файлов
-- =======================================================================

-- Обновить NULL значения duration_seconds на разумное значение по умолчанию
UPDATE files 
SET duration_seconds = 60  -- 60 секунд по умолчанию
WHERE duration_seconds IS NULL AND file_type = 'video';

-- Обновить нулевые значения duration_seconds на разумное значение по умолчанию
UPDATE files 
SET duration_seconds = 60  -- 60 секунд по умолчанию
WHERE duration_seconds = 0 AND file_type = 'video';

-- Обновить NULL значения fps на разумное значение по умолчанию
UPDATE files 
SET fps = 30  -- 30 FPS по умолчанию
WHERE fps IS NULL AND file_type = 'video';

-- =======================================================================
-- ПРОВЕРКА: Результаты обновления
-- =======================================================================

-- Проверим обновленные данные
SELECT 
    'Updated files data:' AS info,
    id,
    filename,
    file_type,
    duration_seconds,
    fps,
    created_at
FROM files 
WHERE file_type = 'video'
ORDER BY created_at DESC
LIMIT 10;

-- Проверим статистику после обновления
SELECT 
    'Updated duration statistics:' AS info,
    COUNT(*) as total_video_files,
    COUNT(*) FILTER (WHERE duration_seconds IS NOT NULL) as files_with_duration,
    COUNT(*) FILTER (WHERE duration_seconds IS NULL) as files_without_duration,
    AVG(duration_seconds) as avg_duration,
    MAX(duration_seconds) as max_duration,
    MIN(duration_seconds) as min_duration
FROM files 
WHERE file_type = 'video';

SELECT 'Video duration update completed! ✅' AS final_status;
