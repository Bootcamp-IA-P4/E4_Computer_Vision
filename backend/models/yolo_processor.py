from ultralytics import YOLO
import cv2
import numpy as np
import torch
import os
from typing import List, Dict, Tuple
import logging
from backend.core.config import MODEL_PATH, CONFIDENCE_THRESHOLD

logger = logging.getLogger(__name__)

class YOLOProcessor:
    def __init__(self):
        try:
            # Set environment variable to allow loading older models
            os.environ['TORCH_WEIGHTS_ONLY'] = 'False'
            
            # Try to load the model
            self.model = YOLO(MODEL_PATH)
            logger.info(f"YOLO model loaded successfully from {MODEL_PATH}")
        except Exception as e:
            logger.error(f"Error loading YOLO model: {e}")
            # Create a dummy model for development/testing
            try:
                logger.warning("Creating a YOLOv8n model for testing purposes...")
                self.model = YOLO('yolov8n.pt')  # This will download if not exists
                logger.info("YOLOv8n model loaded as fallback")
            except Exception as e2:
                logger.error(f"Failed to load any YOLO model: {e2}")
                self.model = None
    
    def detect_objects(self, image: np.ndarray) -> List[Dict]:
        """
        Detect objects in image using YOLO model
        Returns list of detections with bbox, confidence, and class
        """
        try:
            if self.model is None:
                logger.warning("YOLO model not loaded, returning empty detections")
                return []
                
            results = self.model(image, conf=CONFIDENCE_THRESHOLD)
            detections = []
            
            for result in results:
                boxes = result.boxes
                if boxes is not None:
                    for box in boxes:
                        # Get box coordinates
                        x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                        confidence = float(box.conf[0].cpu().numpy())
                        class_id = int(box.cls[0].cpu().numpy())
                        class_name = self.model.names[class_id]
                        
                        detection = {
                            'bbox': [float(x1), float(y1), float(x2), float(y2)],
                            'confidence': confidence,
                            'class_id': class_id,
                            'class_name': class_name
                        }
                        detections.append(detection)
            
            return detections
        except Exception as e:
            logger.error(f"Error in object detection: {e}")
            return []
    
    def crop_detection(self, image: np.ndarray, bbox: List[float], padding: int = 10) -> np.ndarray:
        """
        Crop detection from image with optional padding
        """
        try:
            x1, y1, x2, y2 = bbox
            h, w = image.shape[:2]
            
            # Add padding and ensure within image bounds
            x1 = max(0, int(x1 - padding))
            y1 = max(0, int(y1 - padding))
            x2 = min(w, int(x2 + padding))
            y2 = min(h, int(y2 + padding))
            
            return image[y1:y2, x1:x2]
        except Exception as e:
            logger.error(f"Error cropping detection: {e}")
            return image

# Global instance
yolo_processor = YOLOProcessor()
