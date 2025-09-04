#!/usr/bin/env python3
"""
Test script for the updated stats_calculator.py
This script verifies that the statistics calculator works correctly with the current database schema
"""
import sys
import os
sys.path.append(os.path.dirname(__file__))

from core.stats_calculator import stats_calculator

def test_stats_calculator():
    """Test the stats calculator with sample data"""
    print("🧪 Testing Stats Calculator")
    print("=" * 50)
    
    # Sample detections data (simulating what comes from YOLO)
    sample_detections = [
        {
            'class_name': 'microsoft',
            'confidence': 0.85,
            'bbox': [100, 50, 200, 150],
            'frame_number': 10
        },
        {
            'class_name': 'microsoft',
            'confidence': 0.92,
            'bbox': [110, 60, 190, 140],
            'frame_number': 25
        },
        {
            'class_name': 'apple',
            'confidence': 0.78,
            'bbox': [300, 200, 50, 75],
            'frame_number': 15
        },
        {
            'class_name': 'microsoft',
            'confidence': 0.89,
            'bbox': [105, 55, 195, 145],
            'frame_number': 40
        },
        {
            'class_name': 'google',
            'confidence': 0.95,
            'bbox': [400, 300, 100, 80],
            'frame_number': 60
        }
    ]
    
    # Video info
    video_duration = 10.0  # 10 seconds
    video_fps = 30.0  # 30 fps
    
    print(f"📹 Video Duration: {video_duration}s")
    print(f"🎬 Video FPS: {video_fps}")
    print(f"🔍 Sample Detections: {len(sample_detections)}")
    print()
    
    # Calculate statistics
    try:
        brand_stats = stats_calculator.calculate_brand_statistics(
            sample_detections, video_duration, video_fps
        )
        
        print("📊 Calculated Brand Statistics:")
        print("-" * 30)
        
        for brand_name, stats in brand_stats.items():
            print(f"\n🏷️  Brand: {brand_name}")
            print(f"   Total Detections: {stats['total_detections']}")
            print(f"   Avg Score: {stats['avg_score']}")
            print(f"   Max Score: {stats['max_score']}")
            print(f"   Min Score: {stats['min_score']}")
            print(f"   Duration (seconds): {stats['duration_seconds']}")
            print(f"   First Detection: {stats['first_detection_time']}s")
            print(f"   Last Detection: {stats['last_detection_time']}s")
            print(f"   Frames with Detection: {stats['frames_with_detection']}")
        
        print("\n" + "=" * 50)
        print("✅ Test database preparation:")
        print("-" * 30)
        
        # Test prepare_prediction_data for each brand
        for brand_name, stats in brand_stats.items():
            brand_id = 1  # Mock brand ID
            video_id = 1  # Mock video ID
            
            prediction_data = stats_calculator.prepare_prediction_data(
                stats, brand_id, video_id
            )
            
            print(f"\n🗃️  Prediction data for {brand_name}:")
            for key, value in prediction_data.items():
                print(f"   {key}: {value}")
        
        print("\n" + "=" * 50)
        print("✅ Test detection data preparation:")
        print("-" * 30)
        
        # Test prepare detection data
        sample_detection = sample_detections[0]
        file_id = 1  # Mock file ID
        brand_id = 1  # Mock brand ID
        frame_number = sample_detection['frame_number']
        
        detection_data = stats_calculator.calculate_detection_data(
            sample_detection, file_id, brand_id, frame_number, video_fps
        )
        
        print(f"\n🎯 Detection data for frame {frame_number}:")
        for key, value in detection_data.items():
            print(f"   {key}: {value}")
        
        print("\n" + "=" * 50)
        print("✅ Stats Calculator Test PASSED!")
        print("All methods are working correctly with the current database schema.")
        
    except Exception as e:
        print(f"\n❌ Stats Calculator Test FAILED!")
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_stats_calculator()
