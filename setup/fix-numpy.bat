@echo off
chcp 65001 >nul
echo ====================================
echo   Logo Detection API - Fix NumPy
echo ====================================
echo.

REM Verificar que estamos en el directorio setup correcto
if not exist setup.bat (
    echo ❌ Error: Este script debe ejecutarse desde la carpeta setup
    echo    Ubicación actual: %CD%
    echo    Ejecuta: cd setup && fix-numpy.bat
    pause
    exit /b 1
)

REM Verificar si el entorno virtual existe
if not exist ..\venv (
    echo ❌ Entorno virtual no encontrado
    echo    Ejecuta setup.bat primero desde la carpeta setup:
    echo    cd setup
    echo    setup.bat
    pause
    exit /b 1
)

echo 🔧 Activando entorno virtual...
call ..\venv\Scripts\activate.bat

echo � Verificando versión de Python...
python --version

echo.
echo �📦 Reparando instalación de NumPy para Python 3.13...

REM Actualizar herramientas base (crítico para Python 3.13)
echo    Actualizando pip, setuptools y wheel...
python -m pip install --upgrade pip setuptools wheel

echo    Desinstalando NumPy actual...
pip uninstall -y numpy

echo    Instalando NumPy compatible con Python 3.13...
pip install "numpy>=1.26.0" --only-binary=numpy

if %errorlevel% neq 0 (
    echo ⚠️  Intentando instalación alternativa...
    pip install numpy --force-reinstall --no-cache-dir
)

echo    Verificando instalación...
python -c "import numpy; print('✅ NumPy version:', numpy.__version__)" 2>nul
if %errorlevel% neq 0 (
    echo ❌ Error al verificar NumPy
    echo.
    echo 💡 El problema puede ser que Python 3.13 es muy nuevo
    echo    Recomendaciones:
    echo    1. Usar Python 3.11 o 3.12 para mejor compatibilidad
    echo    2. Crear un nuevo entorno virtual con Python más estable
    pause
    exit /b 1
)

echo.
echo ✅ NumPy reparado exitosamente para Python 3.13
echo    Puedes ejecutar run.bat nuevamente
echo.
pause
