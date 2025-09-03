-- Script de verificación: Comprobar estado de las tablas
-- Ejecutar este script para verificar que las migraciones se aplicaron correctamente

-- Verificar si la tabla frame_captures existe
SELECT 
    table_name, 
    table_type
FROM information_schema.tables 
WHERE table_name = 'frame_captures';

-- Verificar columnas de frame_captures si existe
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'frame_captures'
ORDER BY ordinal_position;

-- Verificar si la columna frame_capture_id existe en detections
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'detections' 
AND column_name = 'frame_capture_id';

-- Verificar foreign keys
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name = 'detections'
AND kcu.column_name = 'frame_capture_id';

-- Verificar índices
SELECT 
    indexname, 
    tablename, 
    indexdef
FROM pg_indexes 
WHERE tablename IN ('frame_captures', 'detections')
AND indexname LIKE '%frame_capture%';
