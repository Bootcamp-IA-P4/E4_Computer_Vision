from fastapi import FastAPI, File, UploadFile, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
import os
import tempfile
import shutil
from pathlib import Path
import logging
from typing import List, Optional
import uuid

# Local imports
from backend.database.supabase_client import supabase_client
from backend.models.yolo_processor import yolo_processor
from backend.core.processing_service import processing_service
from backend.core.video_processor import video_processor
from backend.core.stats_calculator import stats_calculator
from backend.api.endpoints import router as api_router
from backend.core.config import (
    UPLOAD_DIR, FRAMES_DIR, CROPS_DIR, 
    SUPPORTED_VIDEO_FORMATS, SUPPORTED_IMAGE_FORMATS,
    MAX_FILE_SIZE, TARGET_FPS, SUPABASE_IMAGES_BUCKET, SUPABASE_VIDEOS_BUCKET
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(title="Logo Detection API", version="1.0.0")

# Include API routes
app.include_router(api_router)

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
            result = await processing_service.process_video(file_path, original_filename, session_id)
        else:
            # Process image
            result = await processing_service.process_image(file_path, original_filename, session_id)
        
        logger.info(f"Processing completed for {original_filename} - File ID: {result.get('file_id')}")
        
        # Store result in memory cache (for session lookup)
        processing_results[session_id] = result
        
        return result
        
    except Exception as e:
        logger.error(f"Error processing file {original_filename}: {e}")
        # Store error in cache
        processing_results[session_id] = {"error": str(e)}
        raise

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """Upload and process image or video file synchronously"""
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
        
        # Process file SYNCHRONOUSLY (no background task)
        logger.info(f"Starting synchronous processing of {file.filename}")
        
        # Determine if it's video or image
        is_video = file_extension in SUPPORTED_VIDEO_FORMATS
        
        if is_video:
            # Process video
            result = await processing_service.process_video(temp_file_path, file.filename, session_id)
        else:
            # Process image
            result = await processing_service.process_image(temp_file_path, file.filename, session_id)
        
        logger.info(f"Processing completed for {file.filename} - File ID: {result.get('file_id')}")
        
        # Store result in memory cache (for backward compatibility)
        processing_results[session_id] = result
        
        # Return complete result with file_id immediately
        return JSONResponse(content={
            "message": "File uploaded and processed successfully",
            "session_id": session_id,
            "file_id": result.get("file_id"),
            "filename": file.filename,
            "file_size": file.size,
            "file_type": "video" if is_video else "image",
            "processing_status": "completed",
            "detections_count": result.get("detections_count", 0),
            "brands_detected": result.get("brands_detected", []),
            "urls": {
                "video_url": result.get("video_url"),
                "image_url": result.get("image_url")
            },
            "statistics": result.get("statistics"),
            "endpoints": {
                "detections": f"/detections/{result.get('file_id')}",
                "frame_captures": f"/frame-captures/{result.get('file_id')}",
                "file_info": f"/file-info/{result.get('file_id')}"
            }
        })
        
    except Exception as e:
        logger.error(f"Error uploading and processing file: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/processing-status/{session_id}")
async def get_processing_status(session_id: str):
    """Get processing status and results by session ID"""
    try:
        if session_id not in processing_results:
            return JSONResponse(content={
                "status": "processing",
                "message": "File is still being processed or session not found",
                "session_id": session_id,
                "file_id": None
            })
        
        result = processing_results[session_id]
        
        if "error" in result:
            return JSONResponse(content={
                "status": "error",
                "error": result["error"],
                "session_id": session_id,
                "file_id": None
            }, status_code=500)
        
        return JSONResponse(content={
            "status": "completed",
            "session_id": session_id,
            "file_id": result.get("file_id"),
            "detections_count": result.get("detections_count", 0),
            "brands_detected": result.get("brands_detected", []),
            "video_url": result.get("video_url"),
            "image_url": result.get("image_url"),
            "result": result
        })
        
    except Exception as e:
        logger.error(f"Error getting processing status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/upload-async")
async def upload_file_async(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    """Upload and process image or video file asynchronously (original behavior)"""
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
            "file_size": file.size,
            "file_type": "video" if file_extension in SUPPORTED_VIDEO_FORMATS else "image",
            "status_endpoint": f"/upload-result/{session_id}",
            "detailed_status_endpoint": f"/processing-status/{session_id}"
        })
        
    except Exception as e:
        logger.error(f"Error uploading file: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/upload-result/{session_id}")
async def get_upload_result(session_id: str):
    """Get simplified upload result for web interface"""
    try:
        if session_id not in processing_results:
            return JSONResponse(content={
                "status": "processing",
                "message": "File is still being processed",
                "session_id": session_id,
                "file_id": None,
                "ready": False
            })
        
        result = processing_results[session_id]
        
        if "error" in result:
            return JSONResponse(content={
                "status": "error",
                "message": result["error"],
                "session_id": session_id,
                "file_id": None,
                "ready": True
            }, status_code=500)
        
        # Simplified response for web interface
        return JSONResponse(content={
            "status": "completed",
            "message": "File processed successfully",
            "session_id": session_id,
            "file_id": result.get("file_id"),
            "detections_count": result.get("detections_count", 0),
            "brands_detected": result.get("brands_detected", []),
            "ready": True,
            "urls": {
                "video_url": result.get("video_url"),
                "image_url": result.get("image_url")
            }
        })
        
    except Exception as e:
        logger.error(f"Error getting upload result: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/file-info/{file_id}")
async def get_file_info(file_id: int):
    """Get file information and detection summary by file_id"""
    try:
        # Get file information
        file_response = supabase_client.client.table('files').select('*').eq('id', file_id).execute()
        
        if not file_response.data:
            raise HTTPException(status_code=404, detail="File not found")
        
        file_info = file_response.data[0]
        
        # Get detection count
        detection_response = supabase_client.client.table('detections').select('id').eq('file_id', file_id).execute()
        detections_count = len(detection_response.data)
        
        # Get brands detected
        brands_response = supabase_client.client.table('detections') \
            .select('brands(name)') \
            .eq('file_id', file_id) \
            .execute()
        
        brands = list(set([d['brands']['name'] for d in brands_response.data if d['brands']]))
        
        # Get frame captures count
        frames_response = supabase_client.client.table('frame_captures').select('id').eq('file_id', file_id).execute()
        frames_count = len(frames_response.data)
        
        return JSONResponse(content={
            "file_id": file_id,
            "filename": file_info.get('filename'),
            "file_type": file_info.get('file_type'),
            "created_at": file_info.get('created_at'),
            "detections_count": detections_count,
            "brands_detected": brands,
            "frame_captures_count": frames_count,
            "duration_seconds": file_info.get('duration_seconds'),
            "fps": file_info.get('fps'),
            "storage": {
                "bucket": file_info.get('bucket'),
                "path": file_info.get('path')
            }
        })
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting file info: {e}")
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

if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting Logo Detection API with modular backend structure...")
    uvicorn.run(app, host="0.0.0.0", port=8001)
