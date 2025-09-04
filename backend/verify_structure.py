#!/usr/bin/env python3
"""
LogoVision PRO - Verificación de Estructura
Verifica que todos los archivos y directorios estén en su lugar correcto
"""

import os
from pathlib import Path

def check_structure():
    """Verifica la estructura del proyecto"""
    # Desde backend/, ir al directorio padre del proyecto
    base_dir = Path(__file__).parent.parent.absolute()
    
    print("🔍 Verificando estructura del proyecto LogoVision PRO...")
    print(f"📁 Directorio base: {base_dir}")
    print("=" * 60)
    
    # Estructura esperada
    expected_structure = {
        "📁 Raíz del proyecto": [
            ".env",
            ".gitignore", 
            "README.md",
            "start.py"
        ],
        "📁 backend/": [
            "main.py",
            "README.md",
            "start_backend.py",
            "verify_structure.py",
            "pytest.ini",
            "__init__.py"
        ],
        "📁 backend/api/": [
            "endpoints.py",
            "__init__.py"
        ],
        "📁 backend/core/": [
            "config.py",
            "processing_service.py",
            "stats_calculator.py", 
            "video_processor.py",
            "__init__.py"
        ],
        "📁 backend/database/": [
            "supabase_client.py",
            "__init__.py"
        ],
        "📁 backend/models/": [
            "yolo_processor.py",
            "__init__.py"
        ],
        "📁 backend/models/weights/": [
            "best.pt"
        ],
        "📁 backend/storage/": [
            "README.md",
            "__init__.py"
        ],
        "📁 backend/storage/uploads/": [],
        "📁 backend/storage/frames/": [],
        "📁 backend/storage/crops/": [],
        "📁 backend/tests/": [
            "test_api.py",
            "test_stats_calculator.py",
            "__init__.py"
        ],
        "📁 backend/test_files/": [
            "image.png",
            "microsoft_logo_test.png"
        ],
        "📁 frontend/": [
            "package.json",
            "README.md"
        ],
        "📁 setup/": [
            "setup.bat",
            "setup.sh",
            "run.bat", 
            "run.sh",
            "requirements.txt",
            "README.md"
        ],
        "📁 docs/": []
    }
    
    issues = []
    success_count = 0
    total_checks = 0
    
    for directory, files in expected_structure.items():
        # Limpiar el nombre del directorio
        clean_dir = directory.replace("📁 ", "").rstrip("/")
        
        if clean_dir == "Raíz del proyecto":
            dir_path = base_dir
        else:
            # Convertir barras a separadores de path del sistema
            clean_dir = clean_dir.replace("/", os.sep)
            dir_path = base_dir / clean_dir
        
        print(f"\n{directory}")
        
        # Verificar directorio
        if dir_path.exists():
            print(f"  ✅ Directorio existe")
        else:
            print(f"  ❌ Directorio NO existe: {dir_path}")
            issues.append(f"Falta directorio: {directory}")
            continue
            
        # Verificar archivos
        for file in files:
            total_checks += 1
            file_path = dir_path / file
            
            if file_path.exists():
                print(f"  ✅ {file}")
                success_count += 1
            else:
                print(f"  ❌ {file} (no encontrado)")
                issues.append(f"Falta archivo: {directory}/{file}")
    
    print("\n" + "=" * 60)
    print("📊 RESUMEN DE VERIFICACIÓN")
    print("=" * 60)
    print(f"✅ Archivos encontrados: {success_count}/{total_checks}")
    print(f"❌ Problemas detectados: {len(issues)}")
    
    if issues:
        print("\n🔧 PROBLEMAS DETECTADOS:")
        for issue in issues:
            print(f"   • {issue}")
    else:
        print("\n🎉 ¡ESTRUCTURA PERFECTA! Todos los archivos están en su lugar.")
    
    # Verificaciones adicionales
    print("\n🔍 VERIFICACIONES ADICIONALES:")
    
    # Verificar modelo YOLO
    model_path = base_dir / "backend" / "models" / "weights" / "best.pt"
    if model_path.exists():
        size_mb = model_path.stat().st_size / (1024 * 1024)
        print(f"✅ Modelo YOLO: {size_mb:.1f} MB")
    else:
        print("⚠️  Modelo YOLO no encontrado (se usará YOLOv8n por defecto)")
    
    # Verificar .env
    env_path = base_dir / ".env"
    if env_path.exists():
        print("✅ Archivo .env configurado")
    else:
        print("⚠️  Archivo .env no encontrado")
    
    # Verificar venv
    venv_path = base_dir / "venv"
    if venv_path.exists():
        print("✅ Entorno virtual creado")
    else:
        print("⚠️  Entorno virtual no encontrado")
    
    return len(issues) == 0

if __name__ == "__main__":
    success = check_structure()
    
    if success:
        print("\n🚀 ¡El proyecto está listo para usar!")
        print("   Ejecuta: python start_backend.py")
    else:
        print("\n🔧 Revisa los problemas antes de continuar.")
        print("   Ejecuta: cd setup && setup.bat")
    
    exit(0 if success else 1)
