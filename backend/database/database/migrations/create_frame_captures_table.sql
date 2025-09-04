-- Script SQL para crear la tabla frame_captures
-- Este script debe ejecutarse en Supabase para crear la nueva tabla

CREATE TABLE IF NOT EXISTS frame_captures (
    id SERIAL PRIMARY KEY,
    file_id INTEGER REFERENCES files(id) ON DELETE CASCADE,
    frame_number INTEGER NOT NULL,
    timestamp_seconds FLOAT NOT NULL,
    frame_url TEXT NOT NULL,
    detections_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_frame_captures_file_id ON frame_captures(file_id);
CREATE INDEX IF NOT EXISTS idx_frame_captures_timestamp ON frame_captures(timestamp_seconds);

-- Comentarios para documentación
COMMENT ON TABLE frame_captures IS 'Capturas completas de frames donde se detectaron logos';
COMMENT ON COLUMN frame_captures.file_id IS 'ID del archivo de video procesado';
COMMENT ON COLUMN frame_captures.frame_number IS 'Número de frame en el video';
COMMENT ON COLUMN frame_captures.timestamp_seconds IS 'Timestamp en segundos del frame';
COMMENT ON COLUMN frame_captures.frame_url IS 'URL de la captura completa del frame en Supabase Storage';
COMMENT ON COLUMN frame_captures.detections_count IS 'Número de detecciones encontradas en este frame';
