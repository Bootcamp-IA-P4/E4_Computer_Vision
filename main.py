from fastapi import FastAPI, File, UploadFile, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
import os
import tempfile
import shutil
from pathlib import Path
import cv2
import logging
from typing import List, Optional
import uuid

# Local imports
from database import supabase_client
from yolo_processor import yolo_processor
from video_processor import video_processor
from stats_calculator import stats_calculator
from config import (
    UPLOAD_DIR, FRAMES_DIR, CROPS_DIR, 
    SUPPORTED_VIDEO_FORMATS, SUPPORTED_IMAGE_FORMATS,
    MAX_FILE_SIZE, TARGET_FPS, SUPABASE_IMAGES_BUCKET, SUPABASE_VIDEOS_BUCKET
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(title="Logo Detection API", version="1.0.0")

# Create directories
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(FRAMES_DIR, exist_ok=True)
os.makedirs(CROPS_DIR, exist_ok=True)

# Global cache for processing results
processing_results = {}

@app.get("/")
async def root():
    return {"message": "Logo Detection API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "model_loaded": yolo_processor.model is not None}

async def process_media_file(file_path: str, original_filename: str, file_type: str, session_id: str):
    """Background task to process uploaded media file"""
    try:
        logger.info(f"Starting processing of {original_filename} with session {session_id}")
        
        # Determine if it's video or image
        file_extension = Path(original_filename).suffix.lower()
        is_video = file_extension in SUPPORTED_VIDEO_FORMATS
        
        if is_video:
            # Process video
            result = await process_video(file_path, original_filename, session_id)
        else:
            # Process image
            result = await process_image(file_path, original_filename, session_id)
        
        logger.info(f"Processing completed for {original_filename} - File ID: {result.get('file_id')}")
        
        # Store result in memory cache (for session lookup)
        processing_results[session_id] = result
        
        return result
        
    except Exception as e:
        logger.error(f"Error processing file {original_filename}: {e}")
        # Store error in cache
        processing_results[session_id] = {"error": str(e)}
        raise

async def process_video(video_path: str, original_filename: str, session_id: str):
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
                    'model': 'yolov8'
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

async def process_image(image_path: str, original_filename: str, session_id: str):
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
                'model': 'yolov8'
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

@app.post("/upload")
async def upload_file(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    """Upload and process image or video file"""
    try:
        # Validate file size
        if file.size > MAX_FILE_SIZE:
            raise HTTPException(status_code=413, detail="File too large")
        
        # Validate file type
        file_extension = Path(file.filename).suffix.lower()
        if file_extension not in SUPPORTED_VIDEO_FORMATS + SUPPORTED_IMAGE_FORMATS:
            raise HTTPException(
                status_code=400, 
                detail=f"Unsupported file format. Supported formats: {SUPPORTED_VIDEO_FORMATS + SUPPORTED_IMAGE_FORMATS}"
            )
        
        # Save uploaded file temporarily
        session_id = str(uuid.uuid4())
        temp_dir = os.path.join(UPLOAD_DIR, session_id)
        os.makedirs(temp_dir, exist_ok=True)
        
        temp_file_path = os.path.join(temp_dir, file.filename)
        
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Process file in background
        background_tasks.add_task(
            process_media_file, 
            temp_file_path, 
            file.filename, 
            file.content_type,
            session_id
        )
        
        return JSONResponse(content={
            "message": "File uploaded successfully and processing started",
            "session_id": session_id,
            "filename": file.filename,
            "file_size": file.size
        })
        
    except Exception as e:
        logger.error(f"Error uploading file: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/processing-status/{session_id}")
async def get_processing_status(session_id: str):
    """Get processing status and results by session ID"""
    try:
        if session_id not in processing_results:
            return JSONResponse(content={
                "status": "processing",
                "message": "File is still being processed or session not found",
                "session_id": session_id
            })
        
        result = processing_results[session_id]
        
        if "error" in result:
            return JSONResponse(content={
                "status": "error",
                "error": result["error"],
                "session_id": session_id
            }, status_code=500)
        
        return JSONResponse(content={
            "status": "completed",
            "session_id": session_id,
            "file_id": result.get("file_id"),
            "result": result
        })
        
    except Exception as e:
        logger.error(f"Error getting processing status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/processing-status/{session_id}")
async def clear_processing_status(session_id: str):
    """Clear processing result from cache"""
    try:
        if session_id in processing_results:
            del processing_results[session_id]
            return {"message": "Processing result cleared", "session_id": session_id}
        else:
            return {"message": "Session not found", "session_id": session_id}
    except Exception as e:
        logger.error(f"Error clearing processing status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/detections/{file_id}")
async def get_detections(file_id: int):
    """Get all detections for a file"""
    try:
        response = supabase_client.client.table('detections')\
            .select('*, brands(name)')\
            .eq('file_id', file_id)\
            .execute()
        
        return {"detections": response.data}
    except Exception as e:
        logger.error(f"Error getting detections: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/predictions/{file_id}")
async def get_predictions(file_id: int):
    """Get all predictions for a file"""
    try:
        response = supabase_client.client.table('predictions')\
            .select('*, brands(name)')\
            .eq('video_id', file_id)\
            .execute()
        
        return {"predictions": response.data}
    except Exception as e:
        logger.error(f"Error getting predictions: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/files")
async def get_files():
    """Get all processed files"""
    try:
        response = supabase_client.client.table('files')\
            .select('*')\
            .order('created_at', desc=True)\
            .execute()
        
        return {"files": response.data}
    except Exception as e:
        logger.error(f"Error getting files: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
