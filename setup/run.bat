@echo off
echo ====================================
echo   Logo Detection API - Starting
echo ====================================
echo.

REM Verificar que estamos en el directorio setup correcto
if not exist run.bat (
    echo ❌ Error: Este script debe ejecutarse desde la carpeta setup
    echo    Ubicación actual: %CD%
    echo    Ejecuta: cd setup && run.bat
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

REM Verificar si el archivo .env existe
if not exist ..\.env (
    echo ❌ Archivo .env no encontrado
    echo    Copia .env.example a .env y configura tus credenciales:
    echo    copy setup\.env.example .env
    pause
    exit /b 1
)

echo 🔧 Activando entorno virtual...
call ..\venv\Scripts\activate.bat

REM Verificar que la activación fue exitosa
if %errorlevel% neq 0 (
    echo ❌ Error al activar el entorno virtual
    echo    Intenta ejecutar setup.bat nuevamente
    pause
    exit /b 1
)

echo 📦 Verificando instalación de FastAPI...
python -c "import fastapi; print('FastAPI version:', fastapi.__version__)" >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ FastAPI no está instalado en el entorno virtual
    echo    Ejecuta setup.bat para instalar las dependencias:
    echo    cd setup
    echo    setup.bat
    pause
    exit /b 1
)

echo ✅ FastAPI encontrado

echo 🚀 Iniciando servidor...
echo.
echo Servidor disponible en: http://localhost:8001
echo Documentación API: http://localhost:8001/docs
echo.
echo Presiona Ctrl+C para detener el servidor
echo.

cd ..
python main.py
