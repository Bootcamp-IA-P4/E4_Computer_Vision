# Setup - Logo Detection API

Este directorio contiene todos los scripts necesarios para configurar e instalar el proyecto Logo Detection API.

## 🏗️ Nueva Estructura Modular (v2.0)

El proyecto ha sido reorganizado con una estructura modular:

```
FactoriaF5API/
├── 📁 backend/                 # Todo el código del backend
│   ├── 📁 core/               # Configuración central
│   ├── 📁 services/           # Servicios de procesamiento
│   ├── 📁 models/weights/     # Modelos YOLO
│   ├── 📁 storage/            # Archivos temporales
│   └── 📄 main.py             # Servidor FastAPI
├── 📁 frontend/               # Aplicación React
├── 📁 setup/                  # Scripts de instalación
└── 📄 start_backend.py        # Script de inicio rápido
```

## 🚀 Instalación Rápida

### Inicio Universal (Recomendado)
```bash
# Desde la carpeta setup/
start.bat
```

O desde la raíz del proyecto:
```bash
# Desde la raíz/
quick-start.bat
```

### Por Plataforma

#### Windows
```bash
cd setup
setup.bat
```

#### Linux/Mac
```bash
cd setup
chmod +x setup.sh
./setup.sh
```

## 🔄 Migración desde Estructura Anterior

Si tienes un proyecto con la estructura anterior (archivos en la raíz), usa estos scripts para migrar:

### Windows
```bash
cd setup
migrate.bat
```

### Linux/Mac
```bash
cd setup
chmod +x migrate.sh
./migrate.sh
```

## 🐳 Docker Deployment

### 🚀 Instalación Automática (Recomendado)
```bash
# Windows - Todo en uno (inicia Docker + despliega)
run-all.bat

# Linux/Mac
chmod +x run-all.sh
./run-all.sh
```

### 📋 Paso a Paso

#### 1. Iniciar Docker Desktop
```bash
# Windows - Inicia Docker Desktop automáticamente
start-docker.bat

# Linux/Mac
chmod +x start-docker.sh
./start-docker.sh
```

#### 2. Desplegar la aplicación
```bash
# Windows
docker-deploy.bat

# Linux/Mac
chmod +x docker-deploy.sh
./docker-deploy.sh
```

#### 3. Gestionar contenedores
```bash
# Windows
docker-manage.bat

# Linux/Mac  
chmod +x docker-manage.sh
./docker-manage.sh
```

### 🔧 Deployment Manual
```bash
# Solo API (puerto 8001)
docker-compose up --build -d logo-detection-api

# API + Nginx (puerto 80)
docker-compose --profile with-nginx up --build -d

# Ver logs
docker-compose logs -f

# Detener
docker-compose down
```

### 🌐 URLs después del deployment
- **Solo API**: http://localhost:8001
- **Con Nginx**: http://localhost (puerto 80)
- **Documentación**: http://localhost:8001/docs

Ver documentación completa en: [DOCKER_README.md](DOCKER_README.md)

## ▶️ Ejecutar el Servidor

### Opción 1: Scripts de Setup
```bash
# Windows
setup\run.bat

# Linux/Mac
setup/run.sh
```

### Opción 2: Directamente
```bash
python backend/main.py
```

### Opción 3: Script de Inicio Rápido
```bash
python start_backend.py
```

## 📁 Scripts Disponibles

| Script | Propósito |
|--------|-----------|
| `setup.bat/.sh` | Instalación completa del entorno |
| `run.bat/.sh` | Ejecutar el servidor backend |
| `migrate.bat/.sh` | Migrar de estructura anterior |
| `fix-python313.bat` | Solucionar problemas con Python 3.13 |
| `fix-numpy.bat` | Solucionar problemas con NumPy |

## 🔧 Configuración

1. **Variables de Entorno**: Copia `.env.example` a `.env` y configura:
   ```env
   SUPABASE_URL=tu_url_de_supabase
   SUPABASE_KEY=tu_key_de_supabase
   SUPABASE_SERVICE_ROLE=tu_service_role_key
   ```

2. **Modelo YOLO**: Coloca tu modelo personalizado en:
   ```
   backend/models/weights/best.pt
   ```
   Si no tienes modelo personalizado, se usará YOLOv8n por defecto.

## 🐳 Docker

```bash
cd setup
docker-compose up --build
```

## 🔍 Verificación

Después de la instalación, verifica que todo funcione:

```bash
python setup/verify_installation.py
```

## 📊 Endpoints Disponibles

- **API Base**: `http://localhost:8001`
- **Documentación**: `http://localhost:8001/docs`
- **Subir archivo**: `POST /upload`
- **Información de archivo**: `GET /file-info/{file_id}`
- **Estadísticas**: `GET /stats`
- **Estadísticas por marca**: `GET /brand-stats`

## ⚡ Desarrollo Frontend

El frontend se encuentra en la carpeta `frontend/` con su propio README y configuración.

## 🆘 Problemas Comunes

### Python 3.13
```bash
setup/fix-python313.bat  # Windows
```

### Problemas con NumPy
```bash
setup/fix-numpy.bat  # Windows
```

### Puerto en uso
Cambia el puerto en `backend/main.py`:
```python
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8002)  # Cambiar puerto
```

## 📝 Notas de Versión

### v2.0 - Estructura Modular
- ✅ Backend reorganizado en directorio `backend/`
- ✅ Configuración centralizada en `backend/core/`
- ✅ Almacenamiento organizado en `backend/storage/`
- ✅ Modelos YOLO en `backend/models/weights/`
- ✅ Scripts de migración automática
- ✅ Documentación actualizada

### v1.0 - Versión Inicial
- ✅ API FastAPI básica
- ✅ Procesamiento de imágenes con YOLO
- ✅ Integración con Supabase
- ✅ Frontend React
