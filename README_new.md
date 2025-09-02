# Logo Detection API

API para detección de logos en imágenes y videos usando YOLO y FastAPI, con almacenamiento en Supabase.

## 🚀 Instalación Rápida

### 1. Clonar el Repositorio
```bash
git clone <tu-repositorio-url>
cd FactoriaF5API
```

### 2. Ejecutar Script de Instalación

**Windows:**
```cmd
setup\setup.bat
```

**Linux/Mac:**
```bash
chmod +x setup/setup.sh
./setup/setup.sh
```

### 3. Configurar Variables de Entorno
1. Edita el archivo `.env` creado automáticamente
2. Reemplaza las credenciales de Supabase:
```env
SUPABASE_URL=tu_url_de_supabase
SUPABASE_SERVICE_ROLE=tu_clave_de_service_role
```

### 4. Configurar Base de Datos
1. Ve a tu proyecto en Supabase
2. Ejecuta el script `setup/database_schema.sql` en el SQL Editor
3. Crea los buckets de almacenamiento:
   - `images` (para imágenes y crops)
   - `videos` (para archivos de video)

### 5. Ejecutar el Servidor

**Windows:**
```cmd
setup\run.bat
```

**Linux/Mac:**
```bash
chmod +x setup/run.sh
./setup/run.sh
```

## 📋 Instalación Manual

Si prefieres instalar manualmente:

### Requisitos
- Python 3.8 o superior
- Proyecto de Supabase configurado

### Pasos
```bash
# 1. Crear entorno virtual
python -m venv venv

# 2. Activar entorno virtual
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# 3. Instalar dependencias
pip install -r setup/requirements.txt

# 4. Configurar variables de entorno
cp setup/.env.example .env
# Editar .env con tus credenciales

# 5. Crear directorios
mkdir -p temp/uploads temp/frames temp/crops

# 6. Ejecutar servidor
python main.py
```

## 🏗️ Estructura del Proyecto

```
FactoriaF5API/
├── main.py                     # Aplicación principal FastAPI
├── best.pt                     # Modelo YOLO entrenado
├── image.png                   # Imagen de prueba
├── .env                        # Variables de entorno (no en git)
├── .gitignore                  # Archivos excluidos de git
├── README.md                   # Este archivo
├── DEPLOYMENT.md               # Guía de despliegue
├── backend/                    # Módulos del backend
│   ├── __init__.py
│   ├── api/                    # Endpoints de la API
│   │   ├── __init__.py
│   │   └── endpoints.py        # Rutas de consulta
│   ├── core/                   # Lógica de negocio
│   │   ├── __init__.py
│   │   ├── config.py           # Configuración
│   │   ├── processing_service.py # Servicio de procesamiento
│   │   ├── video_processor.py  # Procesamiento de videos
│   │   └── stats_calculator.py # Cálculo de estadísticas
│   ├── database/               # Capa de datos
│   │   ├── __init__.py
│   │   └── supabase_client.py  # Cliente de Supabase
│   └── models/                 # Modelos de ML
│       ├── __init__.py
│       └── yolo_processor.py   # Procesador YOLO
├── setup/                      # Archivos de instalación
│   ├── setup.bat               # Script instalación Windows
│   ├── setup.sh                # Script instalación Linux/Mac
│   ├── run.bat                 # Script ejecución Windows
│   ├── run.sh                  # Script ejecución Linux/Mac
│   ├── requirements.txt        # Dependencias Python
│   ├── .env.example            # Template variables entorno
│   ├── database_schema.sql     # Esquema base de datos
│   ├── Dockerfile              # Contenedor Docker
│   └── docker-compose.yml      # Orquestación Docker
├── tests/                      # Tests
│   ├── __init__.py
│   ├── test_api.py             # Tests básicos
│   └── test_improved.py        # Tests avanzados
└── temp/                       # Archivos temporales
    ├── uploads/
    ├── frames/
    └── crops/
```

## 🐳 Instalación con Docker

### Usando Docker Compose
```bash
# 1. Configurar variables de entorno
cp setup/.env.example .env
# Editar .env con tus credenciales

# 2. Ejecutar con Docker Compose
docker-compose -f setup/docker-compose.yml up --build
```

### Usando Dockerfile
```bash
# 1. Construir imagen
docker build -f setup/Dockerfile -t logo-detection-api .

# 2. Ejecutar contenedor
docker run -p 8000:8000 --env-file .env logo-detection-api
```

## 🔧 Uso de la API

### Endpoints principales

#### `POST /upload`
Sube y procesa un archivo de imagen o video.

**Parámetros:**
- `file`: Archivo de imagen o video (multipart/form-data)

**Formatos soportados:**
- Videos: .mp4, .avi, .mov, .mkv
- Imágenes: .jpg, .jpeg, .png, .bmp

**Respuesta:**
```json
{
  "message": "File uploaded successfully and processing started",
  "file_id": 123,
  "filename": "video.mp4",
  "file_size": 1234567
}
```

#### `GET /detections/{file_id}`
Obtiene todas las detecciones para un archivo específico.

#### `GET /predictions/{file_id}`
Obtiene las predicciones/estadísticas para un archivo específico.

#### `GET /files`
Lista todos los archivos procesados.

#### `GET /health`
Verifica el estado de la API y del modelo.

### Ejemplo de uso con curl

```bash
# Subir un video
curl -X POST "http://localhost:8000/upload" \
     -H "accept: application/json" \
     -H "Content-Type: multipart/form-data" \
     -F "file=@video.mp4"

# Obtener detecciones
curl -X GET "http://localhost:8000/detections/1"

# Obtener estadísticas
curl -X GET "http://localhost:8000/predictions/1"
```

## 🔄 Flujo de Procesamiento

1. **Carga de archivo**: El usuario sube una imagen o video
2. **Almacenamiento**: El archivo se guarda en Supabase Storage
3. **Registro en BD**: Se crea un registro en la tabla `files`
4. **Extracción de frames**: Para videos, se extraen frames a la velocidad configurada
5. **Detección**: Se ejecuta el modelo YOLO en cada frame/imagen
6. **Almacenamiento de detecciones**: Se guardan las detecciones en la tabla `detections`
7. **Recortes**: Se guardan recortes de las áreas detectadas
8. **Estadísticas**: Se calculan y guardan estadísticas en la tabla `predictions`

## ⚙️ Configuración

### Variables de entorno (.env)
- `SUPABASE_URL`: URL de tu proyecto Supabase
- `SUPABASE_SERVICE_ROLE`: Clave de service role para operaciones admin

### Configuración en backend/core/config.py
- `MODEL_PATH`: Ruta al modelo YOLO (default: "best.pt")
- `CONFIDENCE_THRESHOLD`: Umbral de confianza para detecciones (default: 0.5)
- `TARGET_FPS`: Frames por segundo para extracción (default: 1)
- `MAX_FILE_SIZE`: Tamaño máximo de archivo (default: 100MB)

## 🗄️ Base de Datos

La API utiliza Supabase PostgreSQL con las siguientes tablas:

- `brands`: Marcas detectables
- `files`: Archivos procesados
- `detections`: Detecciones individuales
- `predictions`: Estadísticas agregadas

Ver `setup/database_schema.sql` para el esquema completo.

## 🧪 Desarrollo

### Ejecutar en modo desarrollo
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Documentación interactiva
Una vez ejecutando, visita:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

### Ejecutar tests
```bash
python -m pytest tests/
```

## 📈 Características

- ✅ Detección de logos en imágenes y videos
- ✅ Procesamiento con modelo YOLO entrenado personalizado
- ✅ Almacenamiento en Supabase
- ✅ Extracción de estadísticas de presencia de marcas
- ✅ Recortes automáticos de detecciones
- ✅ API REST completa con documentación
- ✅ Procesamiento en background
- ✅ Soporte para Docker
- ✅ Tests automatizados

## 🔄 Próximas Mejoras

- [ ] WebSockets para updates en tiempo real del procesamiento
- [ ] Batch processing para múltiples archivos
- [ ] API para entrenar modelos personalizados
- [ ] Dashboard web para visualizar resultados
- [ ] Optimizaciones de rendimiento
- [ ] Autenticación y autorización
- [ ] Rate limiting
- [ ] Métricas y monitoreo

## 📝 Notas Técnicas

- Los archivos se procesan en background tasks para no bloquear la API
- Los frames temporales se limpian automáticamente después del procesamiento
- Los recortes de detecciones se almacenan en Supabase Storage
- El modelo YOLO se carga una vez al iniciar la aplicación
- La aplicación crea directorios temporales automáticamente

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.
