import cv2
import os
import numpy as np
from typing import List, Tuple, Dict
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

class VideoProcessor:
    def __init__(self):
        pass
    
    def get_video_info(self, video_path: str) -> Dict:
        """Get video information (duration, fps, frame count)"""
        try:
            cap = cv2.VideoCapture(video_path)
            
            if not cap.isOpened():
                raise Exception(f"Could not open video: {video_path}")
            
            fps = cap.get(cv2.CAP_PROP_FPS)
            frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            duration = frame_count / fps if fps > 0 else 0
            
            cap.release()
            
            return {
                'fps': fps,
                'frame_count': frame_count,
                'duration_seconds': duration
            }
        except Exception as e:
            logger.error(f"Error getting video info: {e}")
            raise
    
    def extract_frames(self, video_path: str, output_dir: str, target_fps: float = 1.0) -> List[str]:
        """
        Extract frames from video at specified FPS
        Returns list of frame file paths
        """
        try:
            cap = cv2.VideoCapture(video_path)
            
            if not cap.isOpened():
                raise Exception(f"Could not open video: {video_path}")
            
            # Create output directory
            os.makedirs(output_dir, exist_ok=True)
            
            video_fps = cap.get(cv2.CAP_PROP_FPS)
            frame_interval = int(video_fps / target_fps) if target_fps > 0 else 1
            
            frame_paths = []
            frame_number = 0
            saved_frame_count = 0
            
            while True:
                ret, frame = cap.read()
                if not ret:
                    break
                
                # Extract frame at specified interval
                if frame_number % frame_interval == 0:
                    frame_filename = f"frame_{saved_frame_count:06d}.jpg"
                    frame_path = os.path.join(output_dir, frame_filename)
                    
                    cv2.imwrite(frame_path, frame)
                    frame_paths.append(frame_path)
                    saved_frame_count += 1
                
                frame_number += 1
            
            cap.release()
            logger.info(f"Extracted {len(frame_paths)} frames from {video_path}")
            return frame_paths
            
        except Exception as e:
            logger.error(f"Error extracting frames: {e}")
            raise
    
    def get_frame_timestamp(self, frame_index: int, video_fps: float) -> Tuple[float, float]:
        """
        Get start and end timestamp for a frame
        """
        frame_duration = 1.0 / video_fps if video_fps > 0 else 1.0
        t_start = frame_index * frame_duration
        t_end = t_start + frame_duration
        return t_start, t_end
    
    def save_frame_crop(self, frame: np.ndarray, crop_dir: str, filename: str) -> str:
        """Save cropped frame to directory"""
        try:
            os.makedirs(crop_dir, exist_ok=True)
            crop_path = os.path.join(crop_dir, filename)
            cv2.imwrite(crop_path, frame)
            return crop_path
        except Exception as e:
            logger.error(f"Error saving frame crop: {e}")
            raise

# Global instance
video_processor = VideoProcessor()
