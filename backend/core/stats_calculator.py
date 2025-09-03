from typing import Dict, List
import logging
from collections import defaultdict

logger = logging.getLogger(__name__)

class StatisticsCalculator:
    def __init__(self):
        pass
    
    def calculate_brand_statistics(self, detections: List[Dict], video_duration: float, video_fps: float) -> Dict[str, Dict]:
        """
        Calculate statistics for each brand detected in the video
        Returns dict with brand statistics matching the database schema
        """
        try:
            brand_stats = defaultdict(lambda: {
                'total_detections': 0,
                'frames_with_detection': set(),
                'total_score': 0.0,
                'max_score': 0.0,
                'min_score': 1.0,
                'first_detection_time': None,
                'last_detection_time': None,
                'detection_times': []
            })
            
            # Process each detection
            for detection in detections:
                brand_name = detection['class_name']
                score = detection.get('confidence', detection.get('score', 0.0))  # Handle both confidence and score
                frame_number = detection.get('frame_number', detection.get('frame', 0))
                
                # Calculate time based on frame number
                time_seconds = (frame_number / video_fps) if video_fps > 0 else 0.0
                
                stats = brand_stats[brand_name]
                stats['total_detections'] += 1
                stats['frames_with_detection'].add(frame_number)
                stats['total_score'] += score
                stats['max_score'] = max(stats['max_score'], score)
                stats['min_score'] = min(stats['min_score'], score)
                stats['detection_times'].append(time_seconds)
                
                # Track first and last detection times
                if stats['first_detection_time'] is None or time_seconds < stats['first_detection_time']:
                    stats['first_detection_time'] = time_seconds
                if stats['last_detection_time'] is None or time_seconds > stats['last_detection_time']:
                    stats['last_detection_time'] = time_seconds
            
            # Calculate final statistics
            final_stats = {}
            
            for brand_name, stats in brand_stats.items():
                frames_count = len(stats['frames_with_detection'])
                
                # Calculate duration as time between first and last detection
                if stats['first_detection_time'] is not None and stats['last_detection_time'] is not None:
                    duration_seconds = stats['last_detection_time'] - stats['first_detection_time']
                    # If only one detection, consider it as having some minimal duration
                    if duration_seconds == 0.0 and stats['total_detections'] > 0:
                        duration_seconds = 1.0 / video_fps if video_fps > 0 else 1.0
                else:
                    duration_seconds = 0.0
                
                avg_score = stats['total_score'] / stats['total_detections'] if stats['total_detections'] > 0 else 0.0
                
                final_stats[brand_name] = {
                    'total_detections': stats['total_detections'],
                    'avg_score': round(avg_score, 3),
                    'max_score': round(stats['max_score'], 3),
                    'min_score': round(stats['min_score'], 3) if stats['total_detections'] > 0 else None,
                    'duration_seconds': round(duration_seconds, 2),
                    'first_detection_time': round(stats['first_detection_time'], 2) if stats['first_detection_time'] is not None else None,
                    'last_detection_time': round(stats['last_detection_time'], 2) if stats['last_detection_time'] is not None else None,
                    'frames_with_detection': frames_count
                }
            
            return final_stats
            
        except Exception as e:
            logger.error(f"Error calculating statistics: {e}")
            return {}
    
    def prepare_prediction_data(self, brand_stats: Dict, brand_id: int, video_id: int, video_duration: float = None) -> Dict:
        """
        Prepare prediction data for database insertion matching the enhanced predictions table schema
        """
        try:
            # Calculate percentage based on duration_seconds and video duration
            total_seconds = brand_stats.get('duration_seconds', 0.0)
            percentage = 0.0
            if video_duration and video_duration > 0:
                percentage = (total_seconds / video_duration) * 100
                percentage = min(100.0, max(0.0, percentage))  # Ensure it's between 0-100
            
            return {
                'video_id': video_id,
                'brand_id': brand_id,
                # Original fields
                'total_seconds': total_seconds,
                'percentage': round(percentage, 2),
                # New enhanced statistics fields
                'total_detections': brand_stats['total_detections'],
                'avg_score': brand_stats['avg_score'],
                'max_score': brand_stats['max_score'],
                'min_score': brand_stats['min_score'],
                'duration_seconds': brand_stats['duration_seconds'],
                'first_detection_time': brand_stats['first_detection_time'],
                'last_detection_time': brand_stats['last_detection_time']
            }
        except Exception as e:
            logger.error(f"Error preparing prediction data: {e}")
            return {}

    def calculate_detection_data(self, detection: Dict, file_id: int, brand_id: int, frame_number: int, video_fps: float) -> Dict:
        """
        Prepare individual detection data for database insertion matching the detections table schema
        """
        try:
            score = detection.get('confidence', detection.get('score', 0.0))
            bbox = detection.get('bbox', detection.get('box', [0, 0, 0, 0]))
            
            # Convert time to seconds if frame number is available
            t_start = (frame_number / video_fps) if video_fps > 0 else 0.0
            t_end = t_start + (1.0 / video_fps) if video_fps > 0 else 1.0
            
            return {
                'file_id': file_id,
                'brand_id': brand_id,
                'score': round(score, 3),
                'bbox': bbox,  # Should be [x, y, width, height]
                't_start': round(t_start, 3),
                't_end': round(t_end, 3),
                'frame': frame_number,
                'model': 'yolov8'
            }
        except Exception as e:
            logger.error(f"Error preparing detection data: {e}")
            return {}

# Global instance
stats_calculator = StatisticsCalculator()
