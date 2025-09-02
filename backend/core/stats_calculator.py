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
        Returns dict with brand statistics
        """
        try:
            brand_stats = defaultdict(lambda: {
                'total_detections': 0,
                'frames_with_detection': set(),
                'total_confidence': 0.0,
                'max_confidence': 0.0,
                'min_confidence': 1.0
            })
            
            # Process each detection
            for detection in detections:
                brand_name = detection['class_name']
                confidence = detection['confidence']
                frame_number = detection.get('frame_number', 0)
                
                stats = brand_stats[brand_name]
                stats['total_detections'] += 1
                stats['frames_with_detection'].add(frame_number)
                stats['total_confidence'] += confidence
                stats['max_confidence'] = max(stats['max_confidence'], confidence)
                stats['min_confidence'] = min(stats['min_confidence'], confidence)
            
            # Calculate final statistics
            final_stats = {}
            frame_duration = 1.0 / video_fps if video_fps > 0 else 1.0
            
            for brand_name, stats in brand_stats.items():
                frames_count = len(stats['frames_with_detection'])
                total_seconds = frames_count * frame_duration
                percentage = (total_seconds / video_duration * 100) if video_duration > 0 else 0
                
                final_stats[brand_name] = {
                    'total_detections': stats['total_detections'],
                    'frames_with_detection': frames_count,
                    'total_seconds': round(total_seconds, 2),
                    'percentage': round(percentage, 2),
                    'average_confidence': round(stats['total_confidence'] / stats['total_detections'], 3) if stats['total_detections'] > 0 else 0,
                    'max_confidence': round(stats['max_confidence'], 3),
                    'min_confidence': round(stats['min_confidence'], 3)
                }
            
            return final_stats
            
        except Exception as e:
            logger.error(f"Error calculating statistics: {e}")
            return {}
    
    def prepare_prediction_data(self, brand_stats: Dict, brand_id: int, video_id: int) -> Dict:
        """
        Prepare prediction data for database insertion
        """
        try:
            return {
                'video_id': video_id,
                'brand_id': brand_id,
                'total_seconds': brand_stats['total_seconds'],
                'percentage': brand_stats['percentage']
            }
        except Exception as e:
            logger.error(f"Error preparing prediction data: {e}")
            return {}

# Global instance
stats_calculator = StatisticsCalculator()
