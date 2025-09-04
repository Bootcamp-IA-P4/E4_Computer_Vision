# API Endpoints - Guía de Uso para la Interfaz Web

## 📤 Upload de Archivos

### `POST /upload`
Sube un archivo (imagen o video) para procesamiento.

**Respuesta mejorada:**
```json
{
  "message": "File uploaded successfully and processing started",
  "session_id": "uuid-string",
  "filename": "video.mp4",
  "file_size": 1024000,
  "file_type": "video",
  "status_endpoint": "/upload-result/uuid-string",
  "detailed_status_endpoint": "/processing-status/uuid-string"
}
```

## 🔍 Consultar Resultados

### `GET /upload-result/{session_id}` ⭐ **RECOMENDADO PARA WEB**
Endpoint simplificado para la interfaz web.

**Mientras procesa:**
```json
{
  "status": "processing",
  "message": "File is still being processed",
  "session_id": "uuid-string",
  "file_id": null,
  "ready": false
}
```

**Cuando termina:**
```json
{
  "status": "completed",
  "message": "File processed successfully",
  "session_id": "uuid-string",
  "file_id": 123,
  "detections_count": 5,
  "brands_detected": ["Nike", "Adidas"],
  "ready": true,
  "urls": {
    "video_url": "https://supabase.co/.../video.mp4",
    "image_url": null
  }
}
```

### `GET /processing-status/{session_id}`
Endpoint detallado con toda la información completa.

**Respuesta completa:**
```json
{
  "status": "completed",
  "session_id": "uuid-string",
  "file_id": 123,
  "detections_count": 5,
  "brands_detected": ["Nike", "Adidas"],
  "video_url": "https://supabase.co/.../video.mp4",
  "image_url": null,
  "result": {
    // Datos completos del procesamiento
  }
}
```

## 📁 Información de Archivos

### `GET /file-info/{file_id}` ⭐ **NUEVO**
Obtiene información completa sobre un archivo procesado usando su `file_id`.

**Respuesta:**
```json
{
  "file_id": 123,
  "filename": "video.mp4",
  "file_type": "video",
  "created_at": "2024-01-01T12:00:00Z",
  "detections_count": 5,
  "brands_detected": ["Nike", "Adidas"],
  "frame_captures_count": 3,
  "duration_seconds": 30,
  "fps": 30,
  "storage": {
    "bucket": "factoria-videos",
    "path": "videos/session123/video.mp4"
  }
}
```

## 🎯 Detecciones y Frame Captures

### `GET /detections/{file_id}` ⭐ **MEJORADO CON FRAMES**
Obtiene todas las detecciones de un archivo con URLs de frames capturados.

**Respuesta:**
```json
{
  "detections": [
    {
      "id": 1,
      "file_id": 123,
      "brand_name": "Nike",
      "score": 0.95,
      "bbox": [100, 200, 300, 400],
      "t_start": 15.5,
      "t_end": 16.0,
      "frame": 465,
      "model": "yolov8",
      "created_at": "2024-01-01T12:00:00Z",
      "frame_capture_url": "https://supabase.co/.../frames/session123/frame_000465.jpg",
      "frame_capture_path": "frames/session123/frame_000465.jpg",
      "frame_number": 465
    }
  ]
}
```

### `GET /frame-captures/{file_id}` ⭐ **NUEVO**
Obtiene todos los frames capturados para un archivo.

**Respuesta:**
```json
{
  "frame_captures": [
    {
      "id": 1,
      "file_id": 123,
      "frame_number": 465,
      "bucket": "factoria-images",
      "path": "frames/session123/frame_000465.jpg",
      "public_url": "https://supabase.co/.../frames/session123/frame_000465.jpg",
      "t_start": 15.5,
      "t_end": 16.0,
      "created_at": "2024-01-01T12:00:00Z"
    }
  ]
}
```

## 🔧 Flujo Recomendado para la Interfaz Web

### 1. **Upload de Archivo**
```javascript
// Subir archivo
const uploadResponse = await fetch('/upload', {
  method: 'POST',
  body: formData
});
const uploadData = await uploadResponse.json();
console.log('Session ID:', uploadData.session_id);
console.log('Status endpoint:', uploadData.status_endpoint);
```

### 2. **Polling del Estado**
```javascript
// Verificar estado cada 2 segundos
const checkStatus = async (sessionId) => {
  const response = await fetch(`/upload-result/${sessionId}`);
  const data = await response.json();
  
  if (data.ready) {
    if (data.status === 'completed') {
      console.log('File ID:', data.file_id);
      console.log('Detections:', data.detections_count);
      console.log('Brands:', data.brands_detected);
      // Procesamiento completado
      return data;
    } else {
      console.error('Error:', data.message);
    }
  } else {
    // Continuar polling
    setTimeout(() => checkStatus(sessionId), 2000);
  }
};
```

### 3. **Obtener Detecciones con Frames**
```javascript
// Una vez que tienes el file_id
const getDetections = async (fileId) => {
  const response = await fetch(`/detections/${fileId}`);
  const data = await response.json();
  
  data.detections.forEach(detection => {
    console.log('Brand:', detection.brand_name);
    console.log('Frame URL:', detection.frame_capture_url);
    console.log('Confidence:', detection.score);
  });
};
```

### 4. **Mostrar Información del Archivo**
```javascript
// Obtener información completa del archivo
const getFileInfo = async (fileId) => {
  const response = await fetch(`/file-info/${fileId}`);
  const data = await response.json();
  
  console.log('File info:', data);
  // Mostrar en la interfaz: nombre, tipo, detecciones, etc.
};
```

## 📋 Beneficios de las Mejoras

✅ **`file_id` siempre visible** en las respuestas principales
✅ **Endpoint simplificado** `/upload-result/` para interfaces web
✅ **Información completa** del archivo con `/file-info/`
✅ **Frame captures incluidos** en las respuestas de detecciones
✅ **URLs directas** para acceder a frames completos
✅ **Polling eficiente** con estado `ready`

## 🚀 Nuevas Capacidades

- Ver frames completos donde se detectaron logos
- Información detallada de archivos por `file_id`
- Estados de procesamiento más claros
- URLs directas para todos los recursos
- Respuestas optimizadas para interfaces web
