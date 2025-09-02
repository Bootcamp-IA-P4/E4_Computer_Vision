"""
Script de prueba mejorado para la API de detección de logos
Incluye seguimiento del procesamiento y obtención del file_id
"""

import requests
import time
import os
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

API_BASE_URL = "http://localhost:8000"

def upload_and_track_file(file_path, description=""):
    """
    Sube un archivo y hace seguimiento completo del procesamiento
    """
    print(f"\n{'='*60}")
    print(f"🚀 PROCESANDO: {description or Path(file_path).name}")
    print(f"{'='*60}")
    
    # 1. Verificar que el archivo existe
    if not os.path.exists(file_path):
        print(f"❌ Archivo no encontrado: {file_path}")
        return None
    
    print(f"📁 Archivo: {file_path} ({os.path.getsize(file_path)} bytes)")
    
    # 2. Subir archivo
    print(f"\n📤 Subiendo archivo...")
    try:
        with open(file_path, 'rb') as f:
            files = {'file': (Path(file_path).name, f, 'multipart/form-data')}
            response = requests.post(f"{API_BASE_URL}/upload", files=files)
        
        if response.status_code == 200:
            data = response.json()
            session_id = data['session_id']
            print(f"✅ Upload exitoso")
            print(f"   📝 Session ID: {session_id}")
            print(f"   📄 Filename: {data['filename']}")
        else:
            print(f"❌ Error en upload: {response.status_code}")
            print(f"   {response.text}")
            return None
    except Exception as e:
        print(f"❌ Error en upload: {e}")
        return None
    
    # 3. Hacer seguimiento del procesamiento
    print(f"\n⏳ Haciendo seguimiento del procesamiento...")
    max_attempts = 30  # 30 segundos máximo
    attempt = 0
    
    while attempt < max_attempts:
        try:
            response = requests.get(f"{API_BASE_URL}/processing-status/{session_id}")
            
            if response.status_code == 200:
                status_data = response.json()
                status = status_data.get('status')
                
                if status == 'completed':
                    file_id = status_data.get('file_id')
                    result = status_data.get('result', {})
                    
                    print(f"✅ Procesamiento completado!")
                    print(f"   🆔 File ID: {file_id}")
                    print(f"   🔍 Detecciones: {result.get('detections_count', 0)}")
                    
                    if 'brands_detected' in result:
                        brands = result['brands_detected']
                        if brands:
                            print(f"   🏷️ Marcas detectadas: {', '.join(brands)}")
                        else:
                            print(f"   🏷️ Marcas detectadas: Ninguna")
                    
                    return {
                        'session_id': session_id,
                        'file_id': file_id,
                        'result': result
                    }
                    
                elif status == 'error':
                    error = status_data.get('error')
                    print(f"❌ Error en procesamiento: {error}")
                    return None
                    
                else:  # status == 'processing'
                    print(f"   ⏳ Procesando... ({attempt + 1}s)")
            
            else:
                print(f"   ⚠️ Error consultando estado: {response.status_code}")
            
        except Exception as e:
            print(f"   ⚠️ Error en consulta: {e}")
        
        time.sleep(1)
        attempt += 1
    
    print(f"⚠️ Timeout: El procesamiento tomó más de {max_attempts} segundos")
    return {'session_id': session_id, 'file_id': None, 'timeout': True}

def get_detailed_results(file_id, filename=""):
    """
    Obtiene resultados detallados de detecciones y predicciones
    """
    if not file_id:
        print("❌ No hay file_id para consultar")
        return
    
    print(f"\n📊 RESULTADOS DETALLADOS PARA {filename} (ID: {file_id})")
    print(f"{'='*50}")
    
    # Obtener detecciones
    try:
        response = requests.get(f"{API_BASE_URL}/detections/{file_id}")
        if response.status_code == 200:
            detections = response.json()['detections']
            print(f"\n🔍 DETECCIONES ({len(detections)} encontradas):")
            
            if detections:
                for i, detection in enumerate(detections, 1):
                    brand_name = detection.get('brands', {}).get('name', 'Unknown')
                    score = detection.get('score', 0)
                    bbox = detection.get('bbox', [])
                    
                    print(f"   {i}. {brand_name}")
                    print(f"      Confianza: {score:.3f}")
                    if bbox and len(bbox) >= 4:
                        print(f"      BBox: [{bbox[0]:.0f}, {bbox[1]:.0f}, {bbox[2]:.0f}, {bbox[3]:.0f}]")
                    print(f"      Frame: {detection.get('frame', 'N/A')}")
            else:
                print("   ℹ️ No se encontraron detecciones")
        else:
            print(f"❌ Error obteniendo detecciones: {response.status_code}")
    except Exception as e:
        print(f"❌ Error en detecciones: {e}")
    
    # Obtener predicciones
    try:
        response = requests.get(f"{API_BASE_URL}/predictions/{file_id}")
        if response.status_code == 200:
            predictions = response.json()['predictions']
            print(f"\n📈 PREDICCIONES ({len(predictions)} encontradas):")
            
            if predictions:
                for prediction in predictions:
                    brand_name = prediction.get('brands', {}).get('name', 'Unknown')
                    total_seconds = prediction.get('total_seconds', 0)
                    percentage = prediction.get('percentage', 0)
                    
                    print(f"   - {brand_name}: {total_seconds}s ({percentage:.2f}%)")
            else:
                print("   ℹ️ No se encontraron predicciones")
        else:
            print(f"❌ Error obteniendo predicciones: {response.status_code}")
    except Exception as e:
        print(f"❌ Error en predicciones: {e}")

def main():
    print("🧪 PRUEBA MEJORADA DE LA API DE DETECCIÓN DE LOGOS")
    print("Esta prueba incluye seguimiento completo del procesamiento")
    
    # Verificar que la API esté funcionando
    try:
        response = requests.get(f"{API_BASE_URL}/health")
        if response.status_code == 200:
            data = response.json()
            print(f"\n✅ API funcionando - Estado: {data['status']}, Modelo: {data['model_loaded']}")
        else:
            print(f"\n❌ API no disponible: {response.status_code}")
            return
    except Exception as e:
        print(f"\n❌ Error conectando con API: {e}")
        return
    
    # Lista de archivos a probar
    test_files = []
    
    # Agregar imagen actual si existe
    if os.path.exists("image.png"):
        test_files.append(("image.png", "Imagen actual del proyecto"))
    
    # Agregar imagen de Microsoft si existe
    if os.path.exists("microsoft_logo_test.png"):
        test_files.append(("microsoft_logo_test.png", "Imagen con logo de Microsoft"))
    
    if not test_files:
        print("\n⚠️ No se encontraron archivos de prueba")
        print("   Asegúrate de que existan 'image.png' o 'microsoft_logo_test.png'")
        return
    
    # Procesar cada archivo
    results = []
    for file_path, description in test_files:
        result = upload_and_track_file(file_path, description)
        if result:
            results.append((file_path, description, result))
            
            # Obtener resultados detallados
            if result.get('file_id'):
                get_detailed_results(result['file_id'], Path(file_path).name)
                
                # Limpiar cache del servidor
                session_id = result['session_id']
                try:
                    requests.delete(f"{API_BASE_URL}/processing-status/{session_id}")
                except:
                    pass
    
    # Resumen final
    print(f"\n{'='*60}")
    print(f"📋 RESUMEN FINAL")
    print(f"{'='*60}")
    
    for file_path, description, result in results:
        file_id = result.get('file_id')
        detections_count = result.get('result', {}).get('detections_count', 0)
        
        print(f"\n📄 {Path(file_path).name}:")
        print(f"   🆔 File ID: {file_id}")
        print(f"   🔍 Detecciones: {detections_count}")
        if result.get('timeout'):
            print(f"   ⚠️ Procesamiento con timeout")

if __name__ == "__main__":
    main()
