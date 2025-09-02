from fastapi import APIRouter, HTTPException
from backend.database.supabase_client import supabase_client
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/detections")
async def get_all_detections():
    """Get all detections with frame capture information"""
    try:
        response = supabase_client.client.table('detections')\
            .select('''
                *,
                brands(name),
                frame_captures(public_url, path, frame_number)
            ''')\
            .order('created_at', desc=True)\
            .execute()
        
        # Transform the response to include brand names and frame URLs
        detections = []
        for detection in response.data:
            detection_data = {
                'id': detection['id'],
                'file_id': detection['file_id'],
                'brand_name': detection['brands']['name'] if detection['brands'] else None,
                'score': detection['score'],
                'bbox': detection['bbox'],
                't_start': detection['t_start'],
                't_end': detection['t_end'],
                'frame': detection['frame'],
                'model': detection['model'],
                'created_at': detection['created_at'],
                'frame_capture_url': detection['frame_captures']['public_url'] if detection['frame_captures'] else None,
                'frame_capture_path': detection['frame_captures']['path'] if detection['frame_captures'] else None,
                'frame_number': detection['frame_captures']['frame_number'] if detection['frame_captures'] else None
            }
            detections.append(detection_data)
        
        return {"detections": detections}
    except Exception as e:
        logger.error(f"Error getting all detections: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/detections/{file_id}")
async def get_detections(file_id: int):
    """Get all detections for a file with frame capture information"""
    try:
        response = supabase_client.client.table('detections')\
            .select('''
                *,
                brands(name),
                frame_captures(public_url, path, frame_number)
            ''')\
            .eq('file_id', file_id)\
            .execute()
        
        # Transform the response to include brand names and frame URLs
        detections = []
        for detection in response.data:
            detection_data = {
                'id': detection['id'],
                'file_id': detection['file_id'],
                'brand_name': detection['brands']['name'] if detection['brands'] else None,
                'score': detection['score'],
                'bbox': detection['bbox'],
                't_start': detection['t_start'],
                't_end': detection['t_end'],
                'frame': detection['frame'],
                'model': detection['model'],
                'created_at': detection['created_at'],
                'frame_capture_url': detection['frame_captures']['public_url'] if detection['frame_captures'] else None,
                'frame_capture_path': detection['frame_captures']['path'] if detection['frame_captures'] else None,
                'frame_number': detection['frame_captures']['frame_number'] if detection['frame_captures'] else None
            }
            detections.append(detection_data)
        
        return {"detections": detections}
    except Exception as e:
        logger.error(f"Error getting detections: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/predictions/{file_id}")
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

@router.get("/files")
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

@router.get("/frame-captures/{file_id}")
async def get_frame_captures(file_id: int):
    """Get all frame captures for a file"""
    try:
        response = supabase_client.client.table('frame_captures')\
            .select('*')\
            .eq('file_id', file_id)\
            .order('frame_number')\
            .execute()
        
        return {"frame_captures": response.data}
    except Exception as e:
        logger.error(f"Error getting frame captures: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/frame-captures")
async def get_all_frame_captures():
    """Get all frame captures"""
    try:
        response = supabase_client.client.table('frame_captures')\
            .select('*')\
            .order('created_at', desc=True)\
            .execute()
        
        return {"frame_captures": response.data}
    except Exception as e:
        logger.error(f"Error getting all frame captures: {e}")
        raise HTTPException(status_code=500, detail=str(e))
