-- Logo Detection API - Database Schema
-- Ejecuta este script en tu proyecto de Supabase

-- Tabla de marcas
CREATE TABLE IF NOT EXISTS brands (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de archivos procesados
CREATE TABLE IF NOT EXISTS files (
    id SERIAL PRIMARY KEY,
    bucket VARCHAR(255) NOT NULL,
    path VARCHAR(255) NOT NULL,
    filename VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL CHECK (file_type IN ('image', 'video')),
    duration_seconds INTEGER, -- Solo para videos
    fps FLOAT, -- Solo para videos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de detecciones individuales
CREATE TABLE IF NOT EXISTS detections (
    id SERIAL PRIMARY KEY,
    file_id INTEGER REFERENCES files(id) ON DELETE CASCADE,
    brand_id INTEGER REFERENCES brands(id) ON DELETE CASCADE,
    score FLOAT NOT NULL CHECK (score >= 0 AND score <= 1),
    bbox JSONB NOT NULL, -- [x, y, width, height]
    t_start FLOAT, -- Tiempo de inicio en segundos (para videos)
    t_end FLOAT, -- Tiempo de fin en segundos (para videos)
    frame INTEGER, -- Número de frame (para videos, 0 para imágenes)
    model VARCHAR(255) NOT NULL DEFAULT 'yolov8',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de predicciones/estadísticas agregadas
CREATE TABLE IF NOT EXISTS predictions (
    id SERIAL PRIMARY KEY,
    video_id INTEGER REFERENCES files(id) ON DELETE CASCADE,
    brand_id INTEGER REFERENCES brands(id) ON DELETE CASCADE,
    total_detections INTEGER NOT NULL DEFAULT 0,
    avg_score FLOAT,
    max_score FLOAT,
    min_score FLOAT,
    duration_seconds FLOAT, -- Duración total de aparición
    first_detection_time FLOAT, -- Primer momento de aparición
    last_detection_time FLOAT, -- Último momento de aparición
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_detections_file_id ON detections(file_id);
CREATE INDEX IF NOT EXISTS idx_detections_brand_id ON detections(brand_id);
CREATE INDEX IF NOT EXISTS idx_predictions_video_id ON predictions(video_id);
CREATE INDEX IF NOT EXISTS idx_predictions_brand_id ON predictions(brand_id);
CREATE INDEX IF NOT EXISTS idx_files_created_at ON files(created_at);
CREATE INDEX IF NOT EXISTS idx_brands_name ON brands(name);

-- RLS (Row Level Security) - Opcional
-- ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE files ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE detections ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;

-- Políticas de ejemplo (ajusta según tus necesidades)
-- CREATE POLICY "Allow public read access" ON brands FOR SELECT USING (true);
-- CREATE POLICY "Allow public read access" ON files FOR SELECT USING (true);
-- CREATE POLICY "Allow public read access" ON detections FOR SELECT USING (true);
-- CREATE POLICY "Allow public read access" ON predictions FOR SELECT USING (true);

-- Función para limpiar datos antiguos (opcional)
CREATE OR REPLACE FUNCTION cleanup_old_data(days_old INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Eliminar archivos y sus detecciones/predicciones asociadas
    DELETE FROM files 
    WHERE created_at < NOW() - INTERVAL '1 day' * days_old;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Comentarios en las tablas
COMMENT ON TABLE brands IS 'Marcas/logos detectables por el modelo YOLO';
COMMENT ON TABLE files IS 'Archivos de imágenes y videos procesados';
COMMENT ON TABLE detections IS 'Detecciones individuales de logos en archivos';
COMMENT ON TABLE predictions IS 'Estadísticas agregadas de detecciones por video y marca';

-- Insertar algunas marcas comunes (opcional)
INSERT INTO brands (name) VALUES 
    ('microsoft'),
    ('apple'),
    ('google'),
    ('amazon'),
    ('facebook'),
    ('twitter'),
    ('instagram'),
    ('youtube'),
    ('netflix'),
    ('spotify')
ON CONFLICT (name) DO NOTHING;
