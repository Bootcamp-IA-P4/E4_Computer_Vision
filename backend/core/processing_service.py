import os
import shutil
import uuid
from pathlib import Path
import cv2
import logging
from typing import Dict

from backend.database.supabase_client import supabase_client
from backend.models.yolo_processor import yolo_processor
from backend.core.video_processor import video_processor
from backend.core.stats_calculator import stats_calculator
from backend.core.config import (
    FRAMES_DIR, CROPS_DIR, SUPPORTED_VIDEO_FORMATS, SUPPORTED_IMAGE_FORMATS,
    TARGET_FPS, SUPABASE_IMAGES_BUCKET, SUPABASE_VIDEOS_BUCKET
)

logger = logging.getLogger(__name__)

class ProcessingService:
    def __init__(self):
        pass
    
    async def process_video(self, video_path: str, original_filename: str, session_id: str) -> Dict:
        """Process video file"""
        try:
            # Get video information
            video_info = video_processor.get_video_info(video_path)
            logger.info(f"Video info: {video_info}")
            
            # Upload video to Supabase storage
            storage_path = f"videos/{session_id}/{original_filename}"
            public_url = await supabase_client.upload_file_to_storage(
                video_path, SUPABASE_VIDEOS_BUCKET, storage_path
            )
            
            # Insert file record
            file_data = {
                'bucket': SUPABASE_VIDEOS_BUCKET,
                'path': storage_path,
                'filename': original_filename,
                'file_type': 'video',
                'duration_seconds': int(video_info['duration_seconds']),
                'fps': video_info['fps']
            }
            file_id = await supabase_client.insert_file_record(file_data)
            
            # Extract frames
            frames_dir = os.path.join(FRAMES_DIR, session_id)
            frame_paths = video_processor.extract_frames(video_path, frames_dir, TARGET_FPS)
            
            # Process each frame
            all_detections = []
            crops_dir = os.path.join(CROPS_DIR, session_id)
            
            for frame_idx, frame_path in enumerate(frame_paths):
                # Read frame
                frame = cv2.imread(frame_path)
                if frame is None:
                    continue
                
                # Get frame timestamp
                t_start, t_end = video_processor.get_frame_timestamp(frame_idx, TARGET_FPS)
                
                # Detect objects in frame
                detections = yolo_processor.detect_objects(frame)
                
                # If there are detections in this frame, save the full frame
                frame_capture_id = None
                if detections:
                    # Save full frame with detections
                    frame_filename = f"frame_{frame_idx:06d}.jpg"
                    frame_capture_path = video_processor.save_full_frame(frame, frames_dir, frame_filename)
                    
                    # Upload frame to storage
                    frame_storage_path = f"frames/{session_id}/{frame_filename}"
                    frame_url = await supabase_client.upload_file_to_storage(
                        frame_capture_path, SUPABASE_IMAGES_BUCKET, frame_storage_path
                    )
                    
                    # Insert frame capture record
                    frame_capture_data = {
                        'file_id': file_id,
                        'frame_number': frame_idx,
                        'bucket': SUPABASE_IMAGES_BUCKET,
                        'path': frame_storage_path,
                        'public_url': frame_url,
                        't_start': t_start,
                        't_end': t_end
                    }
                    frame_capture_id = await supabase_client.insert_frame_capture(frame_capture_data)
                
                for detection in detections:
                    # Crop detection area
                    crop = yolo_processor.crop_detection(frame, detection['bbox'])
                    
                    # Save crop
                    crop_filename = f"frame_{frame_idx:06d}_detection_{len(all_detections):04d}.jpg"
                    crop_path = video_processor.save_frame_crop(crop, crops_dir, crop_filename)
                    
                    # Upload crop to storage
                    crop_storage_path = f"crops/{session_id}/{crop_filename}"
                    crop_url = await supabase_client.upload_file_to_storage(
                        crop_path, SUPABASE_IMAGES_BUCKET, crop_storage_path
                    )
                    
                    # Get or create brand
                    brand_id = await supabase_client.get_or_create_brand(detection['class_name'])
                    
                    # Prepare detection data
                    detection_data = {
                        'file_id': file_id,
                        'brand_id': brand_id,
                        'score': detection['confidence'],
                        'bbox': detection['bbox'],
                        't_start': t_start,
                        't_end': t_end,
                        'frame': frame_idx,
                        'model': 'yolov8',
                        'frame_capture_id': frame_capture_id  # Link to frame capture
                    }
                    
                    # Insert detection
                    detection_id = await supabase_client.insert_detection(detection_data)
                    
                    # Add to all detections for statistics
                    detection['frame_number'] = frame_idx
                    all_detections.append(detection)
            
            # Calculate statistics
            brand_stats = stats_calculator.calculate_brand_statistics(
                all_detections, video_info['duration_seconds'], video_info['fps']
            )
            
            # Insert predictions
            prediction_ids = []
            for brand_name, stats in brand_stats.items():
                brand_id = await supabase_client.get_or_create_brand(brand_name)
                prediction_data = stats_calculator.prepare_prediction_data(stats, brand_id, file_id)
                prediction_id = await supabase_client.insert_prediction(prediction_data)
                prediction_ids.append(prediction_id)
            
            # Cleanup temporary files
            shutil.rmtree(frames_dir, ignore_errors=True)
            shutil.rmtree(crops_dir, ignore_errors=True)
            os.remove(video_path)
            
            return {
                'file_id': file_id,
                'session_id': session_id,
                'detections_count': len(all_detections),
                'brands_detected': list(brand_stats.keys()),
                'statistics': brand_stats,
                'video_url': public_url
            }
            
        except Exception as e:
            logger.error(f"Error processing video: {e}")
            raise

    async def process_image(self, image_path: str, original_filename: str, session_id: str) -> Dict:
        """Process image file"""
        try:
            # Upload image to Supabase storage
            storage_path = f"images/{session_id}/{original_filename}"
            public_url = await supabase_client.upload_file_to_storage(
                image_path, SUPABASE_IMAGES_BUCKET, storage_path
            )
            
            # Insert file record
            file_data = {
                'bucket': SUPABASE_IMAGES_BUCKET,
                'path': storage_path,
                'filename': original_filename,
                'file_type': 'image'
            }
            file_id = await supabase_client.insert_file_record(file_data)
            
            # Read and process image
            image = cv2.imread(image_path)
            detections = yolo_processor.detect_objects(image)
            
            # Process detections
            crops_dir = os.path.join(CROPS_DIR, session_id)
            detection_ids = []
            
            # If there are detections, save the full image as frame capture
            frame_capture_id = None
            if detections:
                # Create frames directory for this session
                frames_dir = os.path.join(FRAMES_DIR, session_id)
                
                # Save full image with detections
                frame_filename = f"image_frame.jpg"
                frame_capture_path = video_processor.save_full_frame(image, frames_dir, frame_filename)
                
                # Upload frame to storage
                frame_storage_path = f"frames/{session_id}/{frame_filename}"
                frame_url = await supabase_client.upload_file_to_storage(
                    frame_capture_path, SUPABASE_IMAGES_BUCKET, frame_storage_path
                )
                
                # Insert frame capture record
                frame_capture_data = {
                    'file_id': file_id,
                    'frame_number': 0,  # Single image, frame 0
                    'bucket': SUPABASE_IMAGES_BUCKET,
                    'path': frame_storage_path,
                    'public_url': frame_url,
                    't_start': 0.0,
                    't_end': 0.0
                }
                frame_capture_id = await supabase_client.insert_frame_capture(frame_capture_data)
                
                # Cleanup frames directory after upload
                shutil.rmtree(frames_dir, ignore_errors=True)
            
            for idx, detection in enumerate(detections):
                # Crop detection area
                crop = yolo_processor.crop_detection(image, detection['bbox'])
                
                # Save crop
                crop_filename = f"image_detection_{idx:04d}.jpg"
                crop_path = video_processor.save_frame_crop(crop, crops_dir, crop_filename)
                
                # Upload crop to storage
                crop_storage_path = f"crops/{session_id}/{crop_filename}"
                crop_url = await supabase_client.upload_file_to_storage(
                    crop_path, SUPABASE_IMAGES_BUCKET, crop_storage_path
                )
                
                # Get or create brand
                brand_id = await supabase_client.get_or_create_brand(detection['class_name'])
                
                # Prepare detection data
                detection_data = {
                    'file_id': file_id,
                    'brand_id': brand_id,
                    'score': detection['confidence'],
                    'bbox': detection['bbox'],
                    'frame': 0,
                    'model': 'yolov8',
                    'frame_capture_id': frame_capture_id  # Link to frame capture
                }
                
                # Insert detection
                detection_id = await supabase_client.insert_detection(detection_data)
                detection_ids.append(detection_id)
            
            # Cleanup
            shutil.rmtree(crops_dir, ignore_errors=True)
            os.remove(image_path)
            
            return {
                'file_id': file_id,
                'session_id': session_id,
                'detections_count': len(detections),
                'brands_detected': [d['class_name'] for d in detections],
                'detections': detections,
                'image_url': public_url
            }
            
        except Exception as e:
            logger.error(f"Error processing image: {e}")
            raise

# Global instance
processing_service = ProcessingService()
