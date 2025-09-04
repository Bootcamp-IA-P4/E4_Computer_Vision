# Backend - LogoVision PRO

Backend del sistema LogoVision PRO desarrollado con FastAPI para detección de logos con IA.

## 🚀 Instalación y ejecución

### Prerrequisitos
- Python 3.8+
- Modelo YOLO entrenado (`best.pt`)
- Variables de entorno configuradas (`.env`)

### Instalar dependencias
```bash
pip install -r requirements.txt
```

### Ejecutar servidor
```bash
# Opción 1: Desde el directorio backend
cd backend
python main.py

# Opción 2: Script de inicio rápido (desde backend)
cd backend  
python start_backend.py

# Opción 3: Desde la raíz del proyecto
python start.py

# Opción 4: Scripts de setup
setup/run.bat      # Windows
setup/run.sh       # Linux/Mac
```

El servidor estará disponible en `http://localhost:8001`

## 📁 Estructura

```
backend/
├── main.py              # Punto de entrada del servidor FastAPI
├── start_backend.py     # Script de inicio rápido del backend
├── verify_structure.py  # Verificador de estructura del proyecto
├── pytest.ini          # Configuración de tests
├── api/                 # Endpoints y rutas de la API
├── core/                # Lógica de negocio
│   ├── config.py        # Configuraciones
│   ├── processing_service.py
│   ├── video_processor.py
│   └── stats_calculator.py
├── database/            # Cliente de base de datos y migraciones
│   ├── supabase_client.py
│   └── database/migrations/  # Scripts SQL de migración
├── models/              # Modelos de IA y procesadores
│   ├── weights/         # Pesos del modelo YOLO
│   │   └── best.pt
│   └── yolo_processor.py
├── storage/             # Almacenamiento temporal organizado
│   ├── uploads/         # Archivos subidos
│   ├── frames/          # Frames extraídos
│   └── crops/           # Recortes de detecciones
├── tests/               # Tests automatizados del backend
│   ├── test_api.py      # Tests de endpoints
│   ├── test_stats_calculator.py
│   └── test_upload_after_migration.py
└── test_files/          # Archivos de prueba y ejemplos
    ├── image.png        # Imagen de test
    └── microsoft_logo_test.png  # Logo de test
```

## 🔧 Configuración

El archivo `core/config.py` contiene todas las configuraciones:
- Rutas de almacenamiento
- Configuración de Supabase
- Parámetros del modelo
- Formatos soportados

## 📊 Endpoints disponibles

### Principales:
- `GET /` - Estado del API
- `GET /health` - Health check
- `POST /upload` - Subir y procesar archivo
- `GET /file-info/{file_id}` - Información del archivo

### Datos:
- `GET /files` - Lista de archivos
- `GET /detections/{file_id}` - Detecciones de un archivo
- `GET /frame-captures/{file_id}` - Frames capturados
- `GET /stats` - Estadísticas generales
- `GET /brand-stats` - Estadísticas por marca

## 🔍 Verificación

```bash
# Verificar estructura del proyecto (desde backend)
cd backend
python verify_structure.py

# Verificar desde la raíz
python backend/verify_structure.py
```

## 🧪 Testing

Para ejecutar los tests del backend:

```bash
# Ejecutar todos los tests
cd backend
python -m pytest tests/

# Ejecutar tests específicos
python -m pytest tests/test_api.py
python -m pytest tests/test_stats_calculator.py

# Ejecutar tests con coverage
python -m pytest tests/ --cov=. --cov-report=html
```

### Tests disponibles:
- `test_api.py` - Tests de endpoints y API
- `test_stats_calculator.py` - Tests de cálculo de estadísticas
- `test_upload_after_migration.py` - Tests de migración de archivos

## 🧪 Desarrollo

Para desarrollo local:
1. Configurar variables de entorno en `.env`
2. Colocar modelo `best.pt` en `models/weights/`
3. Ejecutar `python main.py` desde el directorio `backend/`

El servidor incluye recarga automática en modo desarrollo.
