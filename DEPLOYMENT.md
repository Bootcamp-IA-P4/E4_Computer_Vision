# Guía de Despliegue - Logo Detection API

## 📋 Checklist de Instalación

### ✅ Preparación del Repositorio
- [ ] Subir código a Git (sin .env)
- [ ] Incluir best.pt o documentar dónde obtenerlo
- [ ] Verificar que .gitignore esté correcto

### ✅ Configuración de Supabase
- [ ] Crear proyecto en Supabase
- [ ] Ejecutar script `setup/database_schema.sql`
- [ ] Crear buckets de almacenamiento:
  - [ ] `images` bucket (público o privado según necesidades)
  - [ ] `videos` bucket (público o privado según necesidades)
- [ ] Obtener URL del proyecto y Service Role Key

### ✅ Instalación en Nueva Máquina

#### Opción 1: Instalación Automática
```bash
# 1. Clonar repositorio
git clone <tu-repo-url>
cd FactoriaF5API

# 2. Ejecutar instalador
# Windows:
setup\setup.bat
# Linux/Mac:
chmod +x setup/setup.sh
./setup/setup.sh

# 3. Configurar .env
# Editar .env con credenciales de Supabase

# 4. Ejecutar
# Windows:
setup\run.bat
# Linux/Mac:
chmod +x setup/run.sh
./setup/run.sh
```

#### Opción 2: Docker
```bash
# 1. Clonar y configurar
git clone <tu-repo-url>
cd FactoriaF5API
cp setup/.env.example .env
# Editar .env

# 2. Ejecutar con Docker
docker-compose -f setup/docker-compose.yml up -d
```

## 🔧 Configuración de Variables de Entorno

### Variables Requeridas
```env
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE=tu-service-role-key
```

### Variables Opcionales
```env
SUPABASE_IMAGES_BUCKET=images
SUPABASE_VIDEOS_BUCKET=videos
TARGET_FPS=1
MAX_FILE_SIZE=104857600
MODEL_PATH=best.pt
CONFIDENCE_THRESHOLD=0.5
```

## 🚀 Opciones de Despliegue

### 1. Servidor Local/VPS
- Usar scripts de instalación incluidos
- Configurar reverse proxy (nginx) si es necesario
- Configurar SSL/HTTPS

### 2. Docker
- Usar Docker Compose incluido
- Configurar volúmenes para persistencia
- Configurar redes si es necesario

### 3. Cloud Platforms

#### Railway
```bash
# 1. Instalar Railway CLI
npm install -g @railway/cli

# 2. Desplegar
railway login
railway init
railway up
```

#### Heroku
```bash
# 1. Crear Procfile
echo "web: python main.py" > Procfile

# 2. Desplegar
heroku create tu-app-name
git push heroku main
```

#### AWS/GCP/Azure
- Usar Dockerfile incluido
- Configurar variables de entorno en la plataforma
- Configurar load balancer si es necesario

## 🔍 Verificación Post-Instalación

### Tests Básicos
```bash
# 1. Health check
curl http://localhost:8001/health

# 2. Upload test
curl -X POST -F "file=@imagen_test.jpg" http://localhost:8001/upload

# 3. Docs
curl http://localhost:8001/docs
```

### Tests con Scripts Incluidos
```bash
python tests/test_api.py
python tests/test_improved.py
```

## 🛠️ Troubleshooting

### Problemas Comunes

#### Error: No module named 'supabase'
```bash
# Solución: Activar entorno virtual
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate.bat  # Windows
```

#### Error: UploadResponse object has no attribute 'status_code'
- ✅ Ya está solucionado en la versión actual

#### Error: Supabase connection failed
- Verificar variables SUPABASE_URL y SUPABASE_SERVICE_ROLE
- Verificar que los buckets existan

#### Error: YOLO model not found
- Asegurarse de que best.pt esté en el directorio raíz
- El sistema usará yolov8n.pt como fallback automáticamente

#### Error: Permission denied en scripts
```bash
# Linux/Mac:
chmod +x setup.sh run.sh
```

## 📊 Monitoreo y Logs

### Logs de la Aplicación
```bash
# Ver logs en tiempo real
tail -f logs/app.log

# O usar Docker logs
docker-compose logs -f
```

### Métricas
- Endpoint de health: `/health`
- Documentación API: `/docs`
- Métricas de archivos: `/files`

## 🔒 Seguridad

### Variables de Entorno
- Nunca subir .env a Git
- Usar variables de entorno del sistema en producción
- Rotar claves regularmente

### Supabase Security
- Configurar RLS (Row Level Security) si es necesario
- Usar buckets privados para datos sensibles
- Configurar políticas de acceso apropiadas

## 📈 Escalabilidad

### Para Alto Volumen
- Usar Redis para cache de sesiones
- Implementar cola de trabajos (Celery)
- Usar múltiples workers de uvicorn
- Configurar load balancer

### Optimizaciones
- Usar GPU para YOLO si está disponible
- Implementar cache de modelos
- Optimizar tamaño de batch processing
