#!/usr/bin/env python3
"""
Test upload functionality after database migration
This script tests that uploads work correctly after fixing the frame_captures table
"""
import requests
import os
import sys

def test_api_upload():
    """Test the upload functionality with the API"""
    print("🧪 Testing Upload Functionality After Database Migration")
    print("=" * 60)
    
    # API endpoint
    api_url = "http://localhost:8001"
    
    # Check if API is running
    try:
        health_response = requests.get(f"{api_url}/health", timeout=10)
        if health_response.status_code == 200:
            print("✅ API is running and healthy")
        else:
            print(f"❌ API health check failed: {health_response.status_code}")
            return
    except requests.exceptions.RequestException as e:
        print(f"❌ Cannot connect to API: {e}")
        print("   Make sure the API is running on localhost:8001")
        return
    
    # Test with a sample image (check if exists)
    test_files = [
        "image.png",
        "microsoft_logo_test.png",
        "test_image.jpg",
        "test_image.png"
    ]
    
    test_file_path = None
    for file_name in test_files:
        if os.path.exists(file_name):
            test_file_path = file_name
            break
    
    if not test_file_path:
        print("⚠️  No test image found in current directory")
        print("   Create a test image or use one of these names:")
        for file_name in test_files:
            print(f"   - {file_name}")
        return
    
    print(f"📁 Using test file: {test_file_path}")
    
    # Test upload
    try:
        print("📤 Testing upload...")
        
        with open(test_file_path, 'rb') as f:
            files = {'file': (test_file_path, f, 'image/png')}
            
            response = requests.post(
                f"{api_url}/upload", 
                files=files,
                timeout=120  # 2 minutes timeout
            )
        
        print(f"📊 Response Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Upload successful!")
            print("📋 Response data:")
            print(f"   File ID: {result.get('file_id', 'N/A')}")
            print(f"   Session ID: {result.get('session_id', 'N/A')}")
            print(f"   Detections: {result.get('detections_count', 0)}")
            print(f"   Brands detected: {len(result.get('brands_detected', []))}")
            
            if result.get('brands_detected'):
                print("   Brands found:")
                for brand in result.get('brands_detected', []):
                    print(f"     - {brand}")
            
            # Test statistics if available
            if result.get('statistics'):
                print("📊 Statistics calculated:")
                for brand, stats in result.get('statistics', {}).items():
                    print(f"   {brand}:")
                    print(f"     Total detections: {stats.get('total_detections', 0)}")
                    print(f"     Avg score: {stats.get('avg_score', 0):.3f}")
                    
            print("\n✅ Upload test PASSED! Database migration was successful.")
            
        else:
            print(f"❌ Upload failed with status: {response.status_code}")
            try:
                error_data = response.json()
                print(f"Error details: {error_data}")
                
                # Check if it's still the frame_captures error
                if 'detections_count' in str(error_data) and 'frame_captures' in str(error_data):
                    print("\n🔧 SOLUTION NEEDED:")
                    print("   The frame_captures table still needs to be created.")
                    print("   Execute this migration in Supabase:")
                    print("   database/migrations/complete_database_migration.sql")
                
            except:
                print(f"Raw response: {response.text}")
                
    except requests.exceptions.Timeout:
        print("❌ Upload timed out - this might indicate processing is working but slow")
    except requests.exceptions.RequestException as e:
        print(f"❌ Upload request failed: {e}")

def main():
    """Main test function"""
    test_api_upload()

if __name__ == "__main__":
    main()
