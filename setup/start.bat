@echo off
cls
echo.
echo ================================================
echo            LOGOVISION PRO - STARTER
echo ================================================
echo.
echo Bienvenido al sistema de desarrollo LogoVision PRO
echo.
echo ================================================
echo.

cd /d "%~dp0"

echo 🎯 Selecciona cómo quieres ejecutar LogoVision PRO:
echo.
echo   [1] Desarrollo Local (Python + React)
echo   [2] Docker (Containerizado)  
echo   [3] Ver estado actual
echo   [4] Configuración y diagnósticos
echo.
echo ================================================
echo.
set /p choice="Elige una opción (1-4): "

if "%choice%"=="1" goto :local
if "%choice%"=="2" goto :docker
if "%choice%"=="3" goto :status
if "%choice%"=="4" goto :config
echo ❌ Opción no válida
pause
exit /b 1

:local
echo.
echo ================================================
echo         MODO DESARROLLO LOCAL
echo ================================================
echo.
echo Configurando entorno Python + React...
echo.
call setup.bat
if %errorlevel% equ 0 (
    echo.
    echo [OK] Entorno configurado correctamente
    echo [INFO] Iniciando servidor backend...
    echo.
    call run.bat
)
goto :end

:docker
echo.
echo ================================================
echo             MODO DOCKER
echo ================================================
echo.
echo Preparando deployment con Docker...
echo.
call run-all.bat
goto :end

:status
echo.
echo ================================================
echo         ESTADO DEL SISTEMA
echo ================================================
echo.
echo [INFO] Verificando dependencias instaladas...
echo.

python --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Python instalado
    python --version
) else (
    echo [ERROR] Python no encontrado
)

node --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Node.js instalado
    node --version
) else (
    echo [ERROR] Node.js no encontrado
)

docker --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Docker instalado
    docker --version
    
    docker info >nul 2>&1
    if %errorlevel% equ 0 (
        echo [OK] Docker Desktop ejecutándose
    ) else (
        echo [WARNING] Docker Desktop no está ejecutándose
    )
) else (
    echo [ERROR] Docker no encontrado
)

echo.
echo [INFO] Verificando estructura del proyecto...
echo.
if exist ..\backend\main.py (
    echo [OK] Backend configurado
) else (
    echo [ERROR] Backend no configurado
)

if exist ..\frontend\package.json (
    echo [OK] Frontend configurado
) else (
    echo [ERROR] Frontend no configurado
)

if exist ..\.env (
    echo [OK] Archivo .env configurado
) else (
    echo [WARNING] Archivo .env no encontrado
)

goto :end

:config
echo.
echo ================================================
echo       CONFIGURACION Y DIAGNOSTICOS
echo ================================================
echo.
echo Selecciona una opción de configuración:
echo.
echo   [1] Configurar entorno completo
echo   [2] Solucionar problemas Python
echo   [3] Configurar Docker
echo   [4] Crear archivo .env
echo   [5] Verificar instalación
echo.
echo ================================================
set /p config_choice="Elige una opción (1-5): "

if "%config_choice%"=="1" (
    echo.
    echo [INFO] Iniciando configuración completa...
    call setup.bat
) else if "%config_choice%"=="2" (
    echo.
    echo [INFO] Solucionando problemas de Python...
    if exist fix-python313.bat call fix-python313.bat
    if exist fix-numpy.bat call fix-numpy.bat
) else if "%config_choice%"=="3" (
    echo.
    echo [INFO] Configurando Docker...
    call start-docker.bat
) else if "%config_choice%"=="4" (
    if exist .env.docker (
        copy .env.docker ..\.env
        echo [OK] Archivo .env creado
        echo [INFO] Edita .env con tus credenciales reales
    ) else (
        echo [ERROR] Archivo .env.docker no encontrado
    )
) else if "%config_choice%"=="5" (
    if exist verify_installation.py (
        echo.
        echo [INFO] Ejecutando verificación...
        python verify_installation.py
    ) else (
        echo [ERROR] Script de verificación no encontrado
    )
) else (
    echo [ERROR] Opción no válida
)

:end
echo.
echo ================================================
echo        GRACIAS POR USAR LOGOVISION PRO
echo ================================================
echo.
pause
