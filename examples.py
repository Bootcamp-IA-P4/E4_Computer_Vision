"""
Ejemplos de uso de la API de detección de logos
"""

import requests
import json
import time

# Configuración
API_URL = "http://localhost:8000"

def upload_and_process_video(video_path):
    """
    Ejemplo completo: subir video, esperar procesamiento y obtener resultados
    """
    print(f"📹 Procesando video: {video_path}")
    
    # 1. Subir archivo
    with open(video_path, 'rb') as f:
        files = {'file': f}
        response = requests.post(f"{API_URL}/upload", files=files)
    
    if response.status_code != 200:
        print(f"❌ Error subiendo archivo: {response.text}")
        return
    
    upload_data = response.json()
    session_id = upload_data['session_id']
    print(f"✅ Archivo subido. Session ID: {session_id}")
    
    # 2. Esperar y verificar procesamiento
    print("⏳ Esperando procesamiento...")
    time.sleep(10)  # Esperar un poco para que empiece el procesamiento
    
    # 3. Obtener lista de archivos para encontrar nuestro archivo
    response = requests.get(f"{API_URL}/files")
    if response.status_code == 200:
        files = response.json()['files']
        
        # Buscar nuestro archivo por nombre o timestamp reciente
        target_file = None
        for file in files:
            if upload_data['filename'] in file['filename']:
                target_file = file
                break
        
        if target_file:
            file_id = target_file['id']
            print(f"✅ Archivo encontrado en BD. File ID: {file_id}")
            
            # 4. Obtener detecciones
            response = requests.get(f"{API_URL}/detections/{file_id}")
            if response.status_code == 200:
                detections = response.json()['detections']
                print(f"🔍 Detecciones encontradas: {len(detections)}")
                
                for detection in detections[:3]:  # Mostrar primeras 3
                    brand_name = detection['brands']['name']
                    score = detection['score']
                    frame = detection['frame']
                    print(f"  - {brand_name}: {score:.3f} confianza (frame {frame})")
            
            # 5. Obtener estadísticas
            response = requests.get(f"{API_URL}/predictions/{file_id}")
            if response.status_code == 200:
                predictions = response.json()['predictions']
                print(f"📊 Estadísticas por marca:")
                
                for prediction in predictions:
                    brand_name = prediction['brands']['name']
                    total_seconds = prediction['total_seconds']
                    percentage = prediction['percentage']
                    print(f"  - {brand_name}: {total_seconds}s ({percentage:.2f}%)")

def upload_and_process_image(image_path):
    """
    Ejemplo para procesar una imagen
    """
    print(f"🖼️ Procesando imagen: {image_path}")
    
    # Subir imagen
    with open(image_path, 'rb') as f:
        files = {'file': f}
        response = requests.post(f"{API_URL}/upload", files=files)
    
    if response.status_code != 200:
        print(f"❌ Error subiendo imagen: {response.text}")
        return
    
    upload_data = response.json()
    print(f"✅ Imagen subida. Session ID: {upload_data['session_id']}")
    
    # Esperar procesamiento (las imágenes se procesan más rápido)
    time.sleep(5)
    
    # Obtener archivos y encontrar nuestra imagen
    response = requests.get(f"{API_URL}/files")
    if response.status_code == 200:
        files = response.json()['files']
        
        for file in files:
            if upload_data['filename'] in file['filename']:
                file_id = file['id']
                
                # Obtener detecciones
                response = requests.get(f"{API_URL}/detections/{file_id}")
                if response.status_code == 200:
                    detections = response.json()['detections']
                    print(f"🔍 Detecciones en imagen: {len(detections)}")
                    
                    for detection in detections:
                        brand_name = detection['brands']['name']
                        score = detection['score']
                        bbox = detection['bbox']
                        print(f"  - {brand_name}: {score:.3f} confianza")
                        print(f"    Posición: [{bbox[0]:.0f}, {bbox[1]:.0f}, {bbox[2]:.0f}, {bbox[3]:.0f}]")
                break

def check_api_status():
    """
    Verificar estado de la API
    """
    try:
        response = requests.get(f"{API_URL}/health")
        if response.status_code == 200:
            data = response.json()
            print("✅ API funcionando correctamente")
            print(f"   Estado: {data['status']}")
            print(f"   Modelo cargado: {data['model_loaded']}")
            return True
        else:
            print(f"❌ API no responde correctamente: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error conectando con API: {e}")
        print("   Asegúrate de que el servidor esté ejecutándose en http://localhost:8000")
        return False

def list_processed_files():
    """
    Listar todos los archivos procesados
    """
    response = requests.get(f"{API_URL}/files")
    if response.status_code == 200:
        files = response.json()['files']
        print(f"📁 Archivos procesados: {len(files)}")
        
        for i, file in enumerate(files[:10]):  # Mostrar primeros 10
            print(f"  {i+1}. {file['filename']} (ID: {file['id']})")
            print(f"     Tipo: {file['file_type']}, Creado: {file['created_at']}")
            if file['duration_seconds']:
                print(f"     Duración: {file['duration_seconds']}s")
    else:
        print(f"❌ Error obteniendo archivos: {response.status_code}")

def main():
    print("=== Ejemplos de uso - Logo Detection API ===\n")
    
    # Verificar estado de la API
    if not check_api_status():
        return
    
    print("\n" + "="*50)
    
    # Listar archivos existentes
    print("\n1. Archivos ya procesados:")
    list_processed_files()
    
    print("\n" + "="*50)
    
    # Ejemplo de procesamiento si existe image.png
    import os
    if os.path.exists("image.png"):
        print("\n2. Procesando image.png encontrada:")
        upload_and_process_image("image.png")
    else:
        print("\n2. No se encontró image.png para procesar")
    
    print("\n" + "="*50)
    print("\n💡 Para usar con tus propios archivos:")
    print("   upload_and_process_video('path/to/video.mp4')")
    print("   upload_and_process_image('path/to/image.jpg')")
    
    print("\n🌐 Endpoints disponibles:")
    print(f"   - API Docs: {API_URL}/docs")
    print(f"   - Health: {API_URL}/health")
    print(f"   - Files: {API_URL}/files")

if __name__ == "__main__":
    main()
