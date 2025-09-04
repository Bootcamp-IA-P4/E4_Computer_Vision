@echo off
echo ====================================
echo   LogoVision PRO - Setup Completo
echo ====================================
echo.

REM Cambiar al directorio del script
cd /d "%~dp0"

echo 🔍 Verificando requisitos...

REM Verificar que Docker está instalado
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker no está instalado
    echo    Descarga Docker Desktop desde: https://docker.com
    echo.
    pause
    exit /b 1
)

echo ✅ Docker instalado

REM Verificar si Docker Desktop está ejecutándose
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo 🔄 Docker Desktop no está ejecutándose...
    echo.
    echo ¿Quieres que intente iniciarlo automáticamente? (s/n)
    set /p auto_start="Respuesta: "
    
    if /i "%auto_start%"=="s" (
        call start-docker.bat
        echo.
        echo ⏳ Esperando a que Docker esté listo...
        timeout /t 5 /nobreak >nul
        
        docker info >nul 2>&1
        if %errorlevel% neq 0 (
            echo ❌ No se pudo iniciar Docker Desktop automáticamente
            echo    Por favor inícialo manualmente y vuelve a ejecutar este script
            pause
            exit /b 1
        )
    ) else (
        echo ❌ Por favor inicia Docker Desktop y vuelve a ejecutar este script
        pause
        exit /b 1
    )
)

echo ✅ Docker Desktop ejecutándose

REM Verificar archivo .env
if not exist ..\.env (
    echo 📄 Creando archivo .env...
    copy .env.docker ..\.env >nul
    echo ✅ Archivo .env creado con valores por defecto
    echo.
    echo ⚠️  IMPORTANTE: Edita el archivo .env con tus credenciales reales:
    echo    - SUPABASE_URL: Tu URL de Supabase
    echo    - SUPABASE_KEY: Tu clave pública de Supabase  
    echo    - SUPABASE_SERVICE_ROLE: Tu clave de servicio de Supabase
    echo.
    echo ¿Quieres continuar con valores de prueba? (s/n)
    set /p continue_demo="Respuesta: "
    
    if /i not "%continue_demo%"=="s" (
        echo 📝 Edita el archivo .env y vuelve a ejecutar este script
        pause
        exit /b 0
    )
) else (
    echo ✅ Archivo .env encontrado
)

echo.
echo 🚀 Iniciando deployment...
call docker-deploy.bat
