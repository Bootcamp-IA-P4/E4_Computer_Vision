# API Endpoints - Guía Actualizada con file_id Inmediato

## 📤 Upload de Archivos - OPCIÓN B IMPLEMENTADA

### `POST /upload` ⭐ **NUEVO COMPORTAMIENTO SÍNCRONO**
Sube un archivo y lo procesa **completamente** antes de responder. Devuelve el `file_id` inmediatamente.

**⚠️ Nota:** Este endpoint tardará más en responder (dependiendo del tamaño del archivo y número de detecciones), pero devuelve toda la información completa incluyendo el `file_id`.

**Respuesta completa:**
```json
{
  "message": "File uploaded and processed successfully",
  "session_id": "uuid-string",
  "file_id": 123,                     // ← ¡FILE_ID INMEDIATO!
  "filename": "video.mp4",
  "file_size": 1024000,
  "file_type": "video",
  "processing_status": "completed",
  "detections_count": 5,
  "brands_detected": ["Nike", "Adidas"],
  "urls": {
    "video_url": "https://supabase.co/.../video.mp4",
    "image_url": null
  },
  "statistics": {
    // Estadísticas detalladas de las detecciones
  },
  "endpoints": {
    "detections": "/detections/123",
    "frame_captures": "/frame-captures/123",
    "file_info": "/file-info/123"
  }
}
```

### `POST /upload-async` 🔄 **COMPORTAMIENTO ORIGINAL ASÍNCRONO**
Para mantener compatibilidad, este endpoint mantiene el comportamiento original (procesamiento en background).

**Respuesta rápida:**
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

## 🎯 Ventajas de la Opción B

### ✅ **Endpoint `/upload` Síncrono:**
- **file_id disponible inmediatamente**
- **Toda la información completa** en una sola llamada
- **Enlaces directos** a detecciones y frames
- **No necesita polling** ni endpoints adicionales
- **Perfecto para interfaces web simples**

### ⚡ **Ejemplo de uso simplificado:**
```javascript
// Una sola llamada para obtener todo
const uploadFile = async (formData) => {
  const response = await fetch('/upload', {
    method: 'POST',
    body: formData
  });
  
  const result = await response.json();
  
  // ¡file_id disponible inmediatamente!
  console.log('File ID:', result.file_id);
  console.log('Detections:', result.detections_count);
  console.log('Brands:', result.brands_detected);
  
  // Usar el file_id directamente
  showDetections(result.file_id);
  showFrameCaptures(result.file_id);
  
  return result;
};
```

## 📊 Comparación de Enfoques

| Aspecto | `/upload` (Síncrono) | `/upload-async` (Asíncrono) |
|---------|---------------------|---------------------------|
| **file_id** | ✅ Inmediato | ❌ Requiere polling |
| **Velocidad respuesta** | ❌ Lenta (procesa todo) | ✅ Rápida (solo upload) |
| **Simplicidad código** | ✅ Una sola llamada | ❌ Requiere polling |
| **Experiencia usuario** | ❌ Bloquea interfaz | ✅ No bloquea |
| **Casos de uso** | Archivos pequeños/medianos | Archivos grandes |

## 🚀 Flujo Recomendado con Opción B

### **Para la Interfaz Web (SIMPLIFICADO):**

```javascript
// 1. Upload y obtener file_id inmediatamente
const result = await uploadFile(formData);

// 2. Usar file_id directamente (sin polling)
const detections = await fetch(`/detections/${result.file_id}`);
const frameCaptures = await fetch(`/frame-captures/${result.file_id}`);

// 3. Mostrar resultados inmediatamente
displayResults(result, detections, frameCaptures);
```

### **Con Loading State:**

```javascript
const uploadWithLoading = async (formData) => {
  // Mostrar loader
  showLoader("Uploading and processing file...");
  
  try {
    // Una sola llamada - obtiene todo
    const result = await fetch('/upload', {
      method: 'POST',
      body: formData
    }).then(r => r.json());
    
    // Ocultar loader
    hideLoader();
    
    // Mostrar resultados inmediatamente
    displayResults(result);
    
    return result;
    
  } catch (error) {
    hideLoader();
    showError("Error processing file: " + error.message);
  }
};
```

## 📋 Endpoints Disponibles Después del Upload

Una vez que `/upload` devuelve el `file_id`, puedes usar directamente:

### 🎯 **Detecciones con Frame Captures:**
```javascript
GET /detections/123
// Devuelve detecciones con frame_capture_url incluida
```

### 🖼️ **Solo Frame Captures:**
```javascript
GET /frame-captures/123
// Devuelve todos los frames capturados para el archivo
```

### 📁 **Información del Archivo:**
```javascript
GET /file-info/123
// Devuelve metadatos completos del archivo
```

## ⚠️ Consideraciones de la Opción B

### **Tiempos de Respuesta:**
- **Imágenes:** 1-5 segundos
- **Videos cortos (< 30s):** 5-15 segundos  
- **Videos largos (> 1min):** 15-60+ segundos

### **Recomendaciones de UX:**
- Mostrar un loading spinner durante el upload
- Incluir mensaje "Processing file..." 
- Considerar timeout para archivos muy grandes
- Proveer opción de cancelar (si es necesario)

¡Ahora el `file_id` está disponible inmediatamente en la respuesta del `/upload`! 🎉
