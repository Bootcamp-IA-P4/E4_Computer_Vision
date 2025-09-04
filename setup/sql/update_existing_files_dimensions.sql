-- Обновление существующих записей с размерами по умолчанию
-- Выполнить после добавления колонок width и height

-- Для существующих изображений устанавливаем размеры по умолчанию
-- (это временное решение, пока не будет переобработано изображение)
UPDATE files 
SET width = 1920, height = 1080 
WHERE file_type = 'image' 
AND (width IS NULL OR height IS NULL);

-- Для существующих видео устанавливаем размеры по умолчанию
UPDATE files 
SET width = 1920, height = 1080 
WHERE file_type = 'video' 
AND (width IS NULL OR height IS NULL);

-- Проверяем результат
SELECT 
    file_type,
    COUNT(*) as total_files,
    COUNT(width) as files_with_width,
    COUNT(height) as files_with_height,
    AVG(width) as avg_width,
    AVG(height) as avg_height
FROM files 
GROUP BY file_type;
