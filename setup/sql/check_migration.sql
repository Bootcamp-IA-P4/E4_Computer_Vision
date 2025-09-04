-- Проверка успешности миграции
-- Выполнить после добавления колонок width и height

-- 1. Проверяем структуру таблицы files
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'files' 
ORDER BY ordinal_position;

-- 2. Проверяем количество записей с размерами
SELECT 
    file_type,
    COUNT(*) as total_files,
    COUNT(width) as files_with_width,
    COUNT(height) as files_with_height,
    COUNT(CASE WHEN width IS NOT NULL AND height IS NOT NULL THEN 1 END) as files_with_both_dimensions
FROM files 
GROUP BY file_type;

-- 3. Проверяем индексы
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'files' 
AND indexname LIKE '%dimensions%';

-- 4. Примеры записей с размерами
SELECT 
    id,
    filename,
    file_type,
    width,
    height,
    created_at
FROM files 
WHERE width IS NOT NULL AND height IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;

-- 5. Статистика по размерам
SELECT 
    file_type,
    MIN(width) as min_width,
    MAX(width) as max_width,
    AVG(width)::INTEGER as avg_width,
    MIN(height) as min_height,
    MAX(height) as max_height,
    AVG(height)::INTEGER as avg_height
FROM files 
WHERE width IS NOT NULL AND height IS NOT NULL
GROUP BY file_type;
