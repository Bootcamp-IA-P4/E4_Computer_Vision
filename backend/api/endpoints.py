from fastapi import APIRouter, HTTPException
from backend.database.supabase_client import supabase_client
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/detections/{file_id}")
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
