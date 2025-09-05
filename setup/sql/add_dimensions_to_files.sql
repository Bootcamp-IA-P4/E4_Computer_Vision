-- Добавление колонок для размеров файлов в таблицу files
-- Выполнить эту миграцию в Supabase SQL Editor

-- Добавляем колонки для размеров
ALTER TABLE files 
ADD COLUMN IF NOT EXISTS width INTEGER,
ADD COLUMN IF NOT EXISTS height INTEGER;

-- Добавляем комментарии для документации
COMMENT ON COLUMN files.width IS 'Ширина файла в пикселях (для изображений и видео)';
COMMENT ON COLUMN files.height IS 'Высота файла в пикселях (для изображений и видео)';

-- Создаем индекс для быстрого поиска по размерам (опционально)
CREATE INDEX IF NOT EXISTS idx_files_dimensions ON files(width, height) WHERE width IS NOT NULL AND height IS NOT NULL;

-- Проверяем структуру таблицы
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'files' 
ORDER BY ordinal_position;
