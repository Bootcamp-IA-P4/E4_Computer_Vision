@echo off
chcp 65001 >nul
echo =====================================
echo   Fix para Python 3.13 Compatibility
echo =====================================
echo.

REM Verificar que estamos en setup
if not exist setup.bat (
    echo ❌ Error: Ejecutar desde carpeta setup
    pause
    exit /b 1
)

REM Verificar entorno virtual
if not exist ..\venv (
    echo ❌ Crear entorno virtual primero con setup.bat
    pause
    exit /b 1
)

echo 🔧 Activando entorno virtual...
call ..\venv\Scripts\activate.bat

echo 📋 Información del sistema:
python --version
pip --version

echo.
echo 🔄 Actualizando herramientas base para Python 3.13...
python -m pip install --upgrade pip setuptools wheel

echo.
echo 📦 Instalando dependencias compatibles con Python 3.13...

REM Desinstalar dependencias problemáticas
echo    Limpiando instalaciones anteriores...
pip uninstall -y numpy torch torchvision ultralytics opencv-python

echo    Instalando NumPy compatible...
pip install "numpy>=1.26.0" --only-binary=numpy

echo    Instalando PyTorch para Python 3.13...
pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu

echo    Instalando OpenCV...
pip install opencv-python --only-binary=opencv-python

echo    Instalando Ultralytics...
pip install ultralytics

echo    Instalando resto de dependencias...
pip install -r requirements.txt --only-binary=:all:

echo.
echo 🔍 Verificando instalación...
python -c "
import sys
print(f'Python: {sys.version}')
try:
    import numpy as np
    print(f'✅ NumPy: {np.__version__}')
except Exception as e:
    print(f'❌ NumPy: {e}')

try:
    import torch
    print(f'✅ PyTorch: {torch.__version__}')
except Exception as e:
    print(f'❌ PyTorch: {e}')

try:
    import cv2
    print(f'✅ OpenCV: {cv2.__version__}')
except Exception as e:
    print(f'❌ OpenCV: {e}')

try:
    import ultralytics
    print(f'✅ Ultralytics: {ultralytics.__version__}')
except Exception as e:
    print(f'❌ Ultralytics: {e}')
"

if %errorlevel% equ 0 (
    echo.
    echo ✅ ¡Instalación exitosa para Python 3.13!
    echo    Ahora puedes ejecutar run.bat
) else (
    echo.
    echo ❌ Algunos módulos fallaron
    echo 💡 Recomendación: Usar Python 3.11 o 3.12 para mejor estabilidad
)

echo.
pause
