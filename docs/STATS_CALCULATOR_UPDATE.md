# Stats Calculator - Actualización del Sistema de Estadísticas

## 📋 Resumen de Cambios

El `stats_calculator.py` ha sido completamente actualizado para alinearse con el esquema actual de la base de datos de Supabase.

## 🔧 Problemas Identificados y Corregidos

### 1. **Campos Desactualizados en la Base de Datos**
- ❌ **Antes**: Usaba campos como `max_confidence`, `min_confidence`, `total_confidence`
- ✅ **Ahora**: Usa `max_score`, `min_score`, `avg_score` según el esquema real

### 2. **Estructura de Datos Incorrecta**
- ❌ **Antes**: Calculaba `total_seconds` y `percentage` que no existen en la tabla `predictions`
- ✅ **Ahora**: Calcula `duration_seconds`, `first_detection_time`, `last_detection_time`

### 3. **Datos de Detección Inconsistentes**
- ❌ **Antes**: No tenía método para preparar datos de detecciones individuales
- ✅ **Ahora**: Incluye `calculate_detection_data()` para la tabla `detections`

## 📊 Nuevos Métodos y Funcionalidades

### `calculate_brand_statistics()`
Calcula estadísticas completas por marca:
```python
{
    'total_detections': int,
    'avg_score': float,
    'max_score': float, 
    'min_score': float,
    'duration_seconds': float,
    'first_detection_time': float,
    'last_detection_time': float,
    'frames_with_detection': int
}
```

### `prepare_prediction_data()`
Prepara datos para la tabla `predictions`:
```python
{
    'video_id': int,
    'brand_id': int,
    'total_detections': int,
    'avg_score': float,
    'max_score': float,
    'min_score': float,
    'duration_seconds': float,
    'first_detection_time': float,
    'last_detection_time': float
}
```

### `calculate_detection_data()` (NUEVO)
Prepara datos para la tabla `detections`:
```python
{
    'file_id': int,
    'brand_id': int,
    'score': float,
    'bbox': list,
    't_start': float,
    't_end': float,
    'frame': int,
    'model': str
}
```

## 🗄️ Compatibilidad con el Esquema de Base de Datos

### Tabla `predictions`
```sql
- total_detections INTEGER
- avg_score FLOAT
- max_score FLOAT
- min_score FLOAT
- duration_seconds FLOAT
- first_detection_time FLOAT
- last_detection_time FLOAT
```

### Tabla `detections`
```sql
- file_id INTEGER
- brand_id INTEGER
- score FLOAT
- bbox JSONB
- t_start FLOAT
- t_end FLOAT
- frame INTEGER
- model VARCHAR(255)
```

## 🚨 Correcciones Adicionales en processing_service.py

También se corrigieron problemas en `processing_service.py`:

1. **Frame Captures**: Actualizada la estructura de datos para `frame_captures`
2. **Detecciones**: Eliminado campo `frame_capture_id` que no existe en el esquema
3. **Consistencia**: Asegurada compatibilidad entre todos los componentes

## ✅ Pruebas Realizadas

El sistema ha sido probado con datos de muestra y funciona correctamente:

- ✅ Cálculo de estadísticas por marca
- ✅ Preparación de datos para `predictions`
- ✅ Preparación de datos para `detections`  
- ✅ Manejo de múltiples detecciones
- ✅ Cálculo de tiempos y duraciones

## 🎯 Estado Actual

**El sistema de estadísticas está ahora completamente sincronizado con la base de datos y listo para procesar videos e imágenes correctamente.**

### Para probar:
```bash
python test_stats_calculator.py
```

### Para usar en producción:
El `stats_calculator` se integra automáticamente con `processing_service.py` cuando se procesan archivos multimedia.
