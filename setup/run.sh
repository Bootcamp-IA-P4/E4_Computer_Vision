#!/bin/bash

echo "===================================="
echo "  Logo Detection API - Starting"
echo "===================================="
echo

# Verificar que estamos en el directorio setup correcto
if [ ! -f "run.sh" ]; then
    echo "❌ Error: Este script debe ejecutarse desde la carpeta setup"
    echo "   Ubicación actual: $(pwd)"
    echo "   Ejecuta: cd setup && ./run.sh"
    exit 1
fi

# Verificar si el entorno virtual existe
if [ ! -d "../venv" ]; then
    echo "❌ Entorno virtual no encontrado"
    echo "   Ejecuta ./setup.sh primero desde la carpeta setup:"
    echo "   cd setup"
    echo "   ./setup.sh"
    exit 1
fi

# Verificar si el archivo .env existe
if [ ! -f "../.env" ]; then
    echo "❌ Archivo .env no encontrado"
    echo "   Copia .env.example a .env y configura tus credenciales:"
    echo "   cp setup/.env.example .env"
    exit 1
fi

echo "🔧 Activando entorno virtual..."
source ../venv/bin/activate

# Verificar que la activación fue exitosa
if [ $? -ne 0 ]; then
    echo "❌ Error al activar el entorno virtual"
    echo "   Intenta ejecutar setup.sh nuevamente"
    exit 1
fi

echo "📦 Verificando instalación de FastAPI..."
python -c "import fastapi; print('FastAPI version:', fastapi.__version__)" >/dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "❌ FastAPI no está instalado en el entorno virtual"
    echo "   Ejecuta setup.sh para instalar las dependencias:"
    echo "   cd setup"
    echo "   ./setup.sh"
    exit 1
fi

echo "✅ FastAPI encontrado"

echo "� Verificando modelo best.pt..."
if [ ! -f "../best.pt" ]; then
    echo "❌ Modelo best.pt no encontrado en directorio principal"
    echo "   Ubicación esperada: ../best.pt"
    echo "   Directorio actual: $(pwd)"
    echo "   Contenido del directorio padre:"
    ls -la ../ | grep -E '\.(pt|pth)$' || echo "   No se encontraron archivos de modelo (.pt/.pth)"
    exit 1
fi

echo "✅ Modelo best.pt encontrado"
echo "�🚀 Iniciando servidor..."
echo
echo "Servidor disponible en: http://localhost:8001"
echo "Documentación API: http://localhost:8001/docs"
echo
echo "Presiona Ctrl+C para detener el servidor"
echo

cd ..
python main.py
