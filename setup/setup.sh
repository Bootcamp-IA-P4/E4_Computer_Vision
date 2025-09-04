#!/bin/bash

echo "===================================="
echo "   Logo Detection API - Setup"
echo "===================================="
echo

# Verificar que estamos en el directorio setup correcto
if [ ! -f "setup.sh" ]; then
    echo "❌ Error: Este script debe ejecutarse desde la carpeta setup"
    echo "   Ubicación actual: $(pwd)"
    echo "   Ejecuta: cd setup && ./setup.sh"
    exit 1
fi

# Verificar que existe el directorio padre del proyecto
if [ ! -d ".." ]; then
    echo "❌ Error: No se encuentra el directorio padre del proyecto"
    echo "   Asegúrate de estar en FactoriaF5API/setup/"
    exit 1
fi

# Verificar si Python está instalado
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 no está instalado"
    echo "   Por favor instala Python 3.8+ desde https://python.org"
    exit 1
fi

echo "✅ Python encontrado:"
python3 --version

echo
echo "📦 Creando entorno virtual..."
python3 -m venv ../venv

echo
echo "🔧 Activando entorno virtual..."
source ../venv/bin/activate

echo
echo "📥 Instalando dependencias..."
echo "   Actualizando pip..."
pip install --upgrade pip
if [ $? -ne 0 ]; then
    echo "❌ Error al actualizar pip"
    echo "   Intenta ejecutar manualmente: python3 -m pip install --upgrade pip"
    exit 1
fi

echo "   Instalando paquetes desde requirements.txt..."
pip install -r requirements.txt
if [ $? -ne 0 ]; then
    echo "❌ Error al instalar dependencias"
    echo "   Verifica tu conexión a internet y que no haya conflictos"
    echo "   Intenta ejecutar manualmente: pip install -r requirements.txt"
    echo
    echo "   Si persiste el error, prueba instalar PyTorch manualmente:"
    echo "   pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu"
    exit 1
fi

echo "✅ Dependencias instaladas correctamente"

echo
echo "📋 Configurando variables de entorno..."
if [ ! -f ../.env ]; then
    cp .env.example ../.env
    echo "✅ Archivo .env creado desde .env.example"
    echo "⚠️  IMPORTANTE: Edita el archivo .env con tus credenciales de Supabase"
else
    echo "ℹ️  El archivo .env ya existe"
fi

echo
echo "📁 Creando directorios necesarios..."
mkdir -p ../backend/storage/uploads
mkdir -p ../backend/storage/frames
mkdir -p ../backend/storage/crops
mkdir -p ../backend/models/weights

echo
echo "🎯 Verificando modelo YOLO..."
echo "Directorio actual: $(pwd)"
echo "Buscando modelo en: $(pwd)/../backend/models/weights/best.pt"
if [ -f "../backend/models/weights/best.pt" ]; then
    echo "✅ Modelo YOLO encontrado: backend/models/weights/best.pt"
elif [ -f "../best.pt" ]; then
    echo "📦 Encontrado modelo en ubicación antigua, copiando..."
    cp ../best.pt ../backend/models/weights/best.pt
    echo "✅ Modelo copiado a nueva ubicación"
else
    echo "⚠️  Modelo YOLO no encontrado en nueva ubicación"
    echo "   Ubicación esperada: $(pwd)/../backend/models/weights/best.pt"
    echo "   El sistema usará yolov8n.pt como fallback"
    echo
    echo "📝 NOTA IMPORTANTE:"
    echo "   Si tienes el modelo best.pt, cópialo a:"
    echo "   backend/models/weights/best.pt"
fi

echo
echo "===================================="
echo "     ✅ INSTALACIÓN COMPLETADA"
echo "===================================="
echo
echo "Próximos pasos:"
echo "1. Edita el archivo .env con tus credenciales de Supabase"
echo "2. Asegúrate de tener el modelo best.pt (opcional)"
echo "3. Ejecuta: setup/run.sh o python backend/main.py"
echo
echo "Para activar el entorno manualmente:"
echo "   source ../venv/bin/activate"
echo
