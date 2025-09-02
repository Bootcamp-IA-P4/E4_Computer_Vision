import requests
import json
import sys
import os
import time
from pathlib import Path
import urllib.request

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Configuración
API_BASE_URL = "http://localhost:8000"

def download_microsoft_logo():
    """
    Descarga una imagen de prueba con el logo de Microsoft
    """
    logo_url = "https://img-prod-cms-rt-microsoft-com.akamaized.net/cms/api/am/imageFileData/RE1Mu3b?ver=5c31"
    logo_path = "microsoft_logo_test.png"
    
    try:
        if not os.path.exists(logo_path):
            print(f"📥 Descargando imagen de prueba con logo de Microsoft...")
            urllib.request.urlretrieve(logo_url, logo_path)
            print(f"✅ Imagen descargada: {logo_path}")
        else:
            print(f"✅ Imagen de prueba ya existe: {logo_path}")
        return logo_path
    except Exception as e:
        print(f"❌ Error descargando imagen: {e}")
        return None

def test_health():
    """Test health endpoint"""
    try:
        response = requests.get(f"{API_BASE_URL}/health")
        if response.status_code == 200:
            data = response.json()
            print("✅ Health check passed")
            print(f"  Status: {data['status']}")
            print(f"  Model loaded: {data['model_loaded']}")
            return True
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Health check error: {e}")
        return False

def test_upload(file_path, test_name=""):
    """Test file upload"""
    try:
        if not os.path.exists(file_path):
            print(f"❌ File not found: {file_path}")
            return None
        
        print(f"📤 Subiendo {test_name}: {file_path}")
        
        with open(file_path, 'rb') as f:
            files = {'file': (Path(file_path).name, f, 'multipart/form-data')}
            response = requests.post(f"{API_BASE_URL}/upload", files=files)
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Upload successful")
            print(f"  Session ID: {data['session_id']}")
            print(f"  Filename: {data['filename']}")
            return data['session_id']
        else:
            print(f"❌ Upload failed: {response.status_code}")
            print(f"  Response: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Upload error: {e}")
        return None

def wait_for_processing(timeout=30):
    """Espera a que se complete el procesamiento"""
    print(f"⏳ Esperando procesamiento (máximo {timeout}s)...")
    for i in range(timeout):
        time.sleep(1)
        if i % 5 == 0:
            print(f"  ... {i}s transcurridos")
    print("✅ Tiempo de espera completado")

def test_get_files():
    """Test get files endpoint"""
    try:
        response = requests.get(f"{API_BASE_URL}/files")
        if response.status_code == 200:
            data = response.json()
            files = data['files']
            print(f"✅ Get files successful - {len(files)} archivos encontrados")
            
            for i, file in enumerate(files[-5:], 1):  # Mostrar últimos 5
                print(f"  {i}. {file['filename']} (ID: {file['id']})")
                print(f"     Tipo: {file['file_type']}, Creado: {file['created_at']}")
            
            return files
        else:
            print(f"❌ Get files failed: {response.status_code}")
            return None
    except Exception as e:
        print(f"❌ Get files error: {e}")
        return None

def test_get_detections(file_id, filename=""):
    """Test get detections endpoint"""
    try:
        response = requests.get(f"{API_BASE_URL}/detections/{file_id}")
        if response.status_code == 200:
            data = response.json()
            detections = data['detections']
            print(f"🔍 Detecciones para {filename} (ID: {file_id}): {len(detections)} encontradas")
            
            if detections:
                for i, detection in enumerate(detections[:3], 1):  # Mostrar primeras 3
                    brand_name = detection.get('brands', {}).get('name', 'Unknown')
                    score = detection.get('score', 0)
                    bbox = detection.get('bbox', [])
                    print(f"  {i}. {brand_name}: {score:.3f} confianza")
                    if bbox:
                        print(f"     BBox: [{bbox[0]:.0f}, {bbox[1]:.0f}, {bbox[2]:.0f}, {bbox[3]:.0f}]")
            else:
                print("  ℹ️ No se encontraron detecciones")
            
            return detections
        else:
            print(f"❌ Get detections failed: {response.status_code}")
            return None
    except Exception as e:
        print(f"❌ Get detections error: {e}")
        return None

def test_get_predictions(file_id, filename=""):
    """Test get predictions endpoint"""
    try:
        response = requests.get(f"{API_BASE_URL}/predictions/{file_id}")
        if response.status_code == 200:
            data = response.json()
            predictions = data['predictions']
            print(f"📊 Predicciones para {filename} (ID: {file_id}): {len(predictions)} encontradas")
            
            if predictions:
                for prediction in predictions:
                    brand_name = prediction.get('brands', {}).get('name', 'Unknown')
                    total_seconds = prediction.get('total_seconds', 0)
                    percentage = prediction.get('percentage', 0)
                    print(f"  - {brand_name}: {total_seconds}s ({percentage:.2f}%)")
            else:
                print("  ℹ️ No se encontraron predicciones")
            
            return predictions
        else:
            print(f"❌ Get predictions failed: {response.status_code}")
            return None
    except Exception as e:
        print(f"❌ Get predictions error: {e}")
        return None

def run_comprehensive_test():
    """Ejecuta una prueba completa del sistema"""
    print("=" * 60)
    print("🧪 PRUEBA COMPLETA DEL SISTEMA DE DETECCIÓN DE LOGOS")
    print("=" * 60)
    
    # 1. Test health
    print("\n1️⃣ VERIFICANDO ESTADO DE LA API")
    print("-" * 40)
    if not test_health():
        print("❌ La API no está disponible. Asegúrate de que el servidor esté ejecutándose.")
        return False
    
    # 2. Preparar imágenes de prueba
    print("\n2️⃣ PREPARANDO IMÁGENES DE PRUEBA")
    print("-" * 40)
    
    test_images = []
    
    # Imagen actual (probablemente sin detecciones)
    if os.path.exists("image.png"):
        test_images.append(("image.png", "Imagen actual del proyecto"))
        print("✅ Imagen actual encontrada: image.png")
    
    # Descargar imagen con logo de Microsoft
    microsoft_logo = download_microsoft_logo()
    if microsoft_logo:
        test_images.append((microsoft_logo, "Imagen con logo de Microsoft"))
    
    if not test_images:
        print("❌ No se encontraron imágenes de prueba")
        return False
    
    # 3. Procesar cada imagen
    uploaded_files = []
    
    for image_path, description in test_images:
        print(f"\n3️⃣ PROCESANDO: {description.upper()}")
        print("-" * 40)
        
        # Subir imagen
        session_id = test_upload(image_path, description)
        if session_id:
            uploaded_files.append((image_path, description, session_id))
        
        # Esperar procesamiento
        wait_for_processing(15)
    
    # 4. Verificar resultados
    print(f"\n4️⃣ VERIFICANDO RESULTADOS")
    print("-" * 40)
    
    files = test_get_files()
    if not files:
        print("❌ No se pudieron obtener los archivos")
        return False
    
    # 5. Analizar detecciones para cada archivo
    print(f"\n5️⃣ ANÁLISIS DE DETECCIONES")
    print("-" * 40)
    
    results_summary = []
    
    for file in files[-len(uploaded_files):]:  # Últimos archivos subidos
        file_id = file['id']
        filename = file['filename']
        
        print(f"\n📋 Analizando: {filename}")
        print("." * 30)
        
        # Obtener detecciones
        detections = test_get_detections(file_id, filename)
        
        # Obtener predicciones
        predictions = test_get_predictions(file_id, filename)
        
        results_summary.append({
            'filename': filename,
            'detections_count': len(detections) if detections else 0,
            'predictions_count': len(predictions) if predictions else 0,
            'brands_detected': [d.get('brands', {}).get('name', 'Unknown') for d in (detections or [])]
        })
    
    # 6. Resumen final
    print(f"\n6️⃣ RESUMEN FINAL")
    print("=" * 40)
    
    for result in results_summary:
        print(f"\n📄 {result['filename']}:")
        print(f"   🔍 Detecciones: {result['detections_count']}")
        print(f"   📊 Predicciones: {result['predictions_count']}")
        if result['brands_detected']:
            print(f"   🏷️ Marcas detectadas: {', '.join(set(result['brands_detected']))}")
        else:
            print(f"   🏷️ Marcas detectadas: Ninguna")
    
    print(f"\n🎯 PRUEBA COMPLETADA")
    print(f"   ✅ Archivos procesados: {len(results_summary)}")
    print(f"   ✅ Total detecciones: {sum(r['detections_count'] for r in results_summary)}")
    print(f"   ✅ API funcionando correctamente")
    
    return True

def main():
    """Función principal"""
    print("🚀 Iniciando pruebas del sistema...")
    
    if len(sys.argv) > 1 and sys.argv[1] == "--comprehensive":
        run_comprehensive_test()
    else:
        print("💡 Para ejecutar la prueba completa, usa: python test_api.py --comprehensive")
        print("\n🔧 Ejecutando prueba básica...")
        
        # Prueba básica
        if test_health():
            if os.path.exists("image.png"):
                test_upload("image.png", "Prueba básica")
            test_get_files()

if __name__ == "__main__":
    main()
