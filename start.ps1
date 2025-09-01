# Script para ejecutar la API de detección de logos
# Ejecuta este script desde PowerShell

Write-Host "=== Logo Detection API Setup ===" -ForegroundColor Green

# Verificar si Python está instalado
try {
    $pythonVersion = python --version
    Write-Host "✓ Python encontrado: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Python no encontrado. Por favor instala Python 3.8+" -ForegroundColor Red
    exit 1
}

# Verificar si existe el entorno virtual
if (!(Test-Path "venv")) {
    Write-Host "Creando entorno virtual..." -ForegroundColor Yellow
    python -m venv venv
}

# Activar entorno virtual
Write-Host "Activando entorno virtual..." -ForegroundColor Yellow
& "venv\Scripts\Activate.ps1"

# Verificar si requirements.txt existe
if (!(Test-Path "requirements.txt")) {
    Write-Host "✗ requirements.txt no encontrado" -ForegroundColor Red
    exit 1
}

# Instalar dependencias
Write-Host "Instalando dependencias..." -ForegroundColor Yellow
pip install -r requirements.txt

# Verificar si el modelo existe
if (!(Test-Path "best.pt")) {
    Write-Host "⚠ Advertencia: best.pt no encontrado. Asegúrate de tener el modelo YOLO." -ForegroundColor Yellow
}

# Verificar variables de entorno
if (!(Test-Path ".env")) {
    Write-Host "⚠ Advertencia: .env no encontrado. Configura las variables de entorno." -ForegroundColor Yellow
} else {
    Write-Host "✓ Archivo .env encontrado" -ForegroundColor Green
}

# Crear directorios necesarios
$dirs = @("uploads", "frames", "crops")
foreach ($dir in $dirs) {
    if (!(Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir
        Write-Host "✓ Directorio $dir creado" -ForegroundColor Green
    }
}

Write-Host "`n=== Iniciando servidor ===" -ForegroundColor Green
Write-Host "La API estará disponible en: http://localhost:8000" -ForegroundColor Cyan
Write-Host "Documentación Swagger: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "Presiona Ctrl+C para detener el servidor" -ForegroundColor Yellow

# Ejecutar la aplicación
python main.py
