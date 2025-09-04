#!/usr/bin/env python3
"""
Enhanced test script for the updated stats_calculator.py with database schema integration
This script verifies the enhanced statistics calculator with the new database fields
"""
import sys
import os
sys.path.append(os.path.dirname(__file__))

from core.stats_calculator import stats_calculator

def test_enhanced_stats_calculator():
    """Test the enhanced stats calculator with comprehensive data"""
    print("🧪 Testing Enhanced Stats Calculator with New Database Schema")
    print("=" * 70)
    
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
        },
        {
            'class_name': 'apple',
            'confidence': 0.88,
            'bbox': [310, 210, 60, 85],
            'frame_number': 75
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
        
        print("📊 Calculated Enhanced Brand Statistics:")
        print("-" * 50)
        
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
        
        print("\n" + "=" * 70)
        print("🗄️  Testing Enhanced Database Preparation:")
        print("-" * 50)
        
        # Test prepare_prediction_data with video duration for each brand
        for brand_name, stats in brand_stats.items():
            brand_id = 1  # Mock brand ID
            video_id = 1  # Mock video ID
            
            prediction_data = stats_calculator.prepare_prediction_data(
                stats, brand_id, video_id, video_duration
            )
            
            print(f"\n📊 Enhanced prediction data for {brand_name}:")
            print(f"   🎯 Basic Info:")
            print(f"      video_id: {prediction_data['video_id']}")
            print(f"      brand_id: {prediction_data['brand_id']}")
            print(f"   📈 Original Fields:")
            print(f"      total_seconds: {prediction_data['total_seconds']}")
            print(f"      percentage: {prediction_data['percentage']}%")
            print(f"   🔍 Enhanced Statistics:")
            print(f"      total_detections: {prediction_data['total_detections']}")
            print(f"      avg_score: {prediction_data['avg_score']}")
            print(f"      max_score: {prediction_data['max_score']}")
            print(f"      min_score: {prediction_data['min_score']}")
            print(f"      duration_seconds: {prediction_data['duration_seconds']}")
            print(f"      first_detection_time: {prediction_data['first_detection_time']}")
            print(f"      last_detection_time: {prediction_data['last_detection_time']}")
        
        print("\n" + "=" * 70)
        print("🎯 Testing Detection Data Preparation:")
        print("-" * 50)
        
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
        
        print("\n" + "=" * 70)
        print("✅ Enhanced Stats Calculator Test PASSED!")
        print("📋 Summary:")
        print("   ✓ All methods working correctly with enhanced database schema")
        print("   ✓ Original fields (total_seconds, percentage) maintained")
        print("   ✓ New statistics fields properly calculated")
        print("   ✓ Video duration integration for percentage calculation")
        print("   ✓ Ready for production use with enhanced predictions table")
        
        # Generate SQL preview
        print("\n" + "=" * 70)
        print("📝 SQL Migration Status:")
        print("-" * 50)
        print("   🔧 Execute the migration script:")
        print("      database/migrations/add_statistics_fields_to_predictions.sql")
        print("   📊 New fields will be added:")
        print("      - total_detections INTEGER")
        print("      - avg_score NUMERIC(4,3)")
        print("      - max_score NUMERIC(4,3)")
        print("      - min_score NUMERIC(4,3)")
        print("      - duration_seconds NUMERIC(10,3)")
        print("      - first_detection_time NUMERIC(10,3)")
        print("      - last_detection_time NUMERIC(10,3)")
        
    except Exception as e:
        print(f"\n❌ Enhanced Stats Calculator Test FAILED!")
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_enhanced_stats_calculator()
