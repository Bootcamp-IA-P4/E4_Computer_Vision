from fastapi import APIRouter, HTTPException
from database.supabase_client import supabase_client
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
                brands!inner(name),
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
                brands!inner(name),
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
    """Get all predictions for a file with file information"""
    try:
        # Get predictions
        predictions_response = supabase_client.client.table('predictions')\
            .select('*, brands(name)')\
            .eq('video_id', file_id)\
            .execute()
        
        # Get file information including duration
        file_response = supabase_client.client.table('files')\
            .select('id, filename, file_type, duration_seconds, fps')\
            .eq('id', file_id)\
            .execute()
        
        file_info = file_response.data[0] if file_response.data else None
        
        # Ensure duration_seconds is not None
        if file_info and file_info.get('duration_seconds') is None:
            file_info['duration_seconds'] = 0
        
        return {
            "predictions": predictions_response.data,
            "file_info": file_info
        }
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

@router.get("/files/{file_id}/statistics")
async def get_file_statistics(file_id: int):
    """Get comprehensive statistics for a specific file"""
    try:
        # Get file information
        file_response = supabase_client.client.table('files')\
            .select('id, filename, file_type, duration_seconds, fps, created_at')\
            .eq('id', file_id)\
            .execute()
        
        if not file_response.data:
            raise HTTPException(status_code=404, detail="File not found")
        
        file_info = file_response.data[0]
        
        # Get all detections for this file
        detections_response = supabase_client.client.table('detections')\
            .select('*, brands(name)')\
            .eq('file_id', file_id)\
            .execute()
        
        detections = detections_response.data
        
        # Get all predictions for this file
        predictions_response = supabase_client.client.table('predictions')\
            .select('*, brands(name)')\
            .eq('video_id', file_id)\
            .execute()
        
        predictions = predictions_response.data
        
        # Calculate video statistics
        total_detections = len(detections)
        unique_brands = len(set(detection['brand_id'] for detection in detections if detection['brand_id']))
        
        # Calculate average confidence
        avg_confidence = sum(detection['score'] for detection in detections) / total_detections if total_detections > 0 else 0
        
        # Calculate total detection time (sum of all brand durations)
        total_detection_time = sum(prediction.get('duration_seconds', 0) for prediction in predictions)
        
        # Calculate detection density (detections per second)
        video_duration = file_info.get('duration_seconds', 0)
        detection_density = total_detections / video_duration if video_duration > 0 else 0
        
        # Get brand distribution
        brand_distribution = {}
        for prediction in predictions:
            brand_name = prediction['brands']['name'] if prediction['brands'] else 'Unknown'
            if brand_name not in brand_distribution:
                brand_distribution[brand_name] = {
                    'detections': 0,
                    'total_time': 0,
                    'avg_confidence': 0
                }
            brand_distribution[brand_name]['detections'] += prediction.get('total_detections', 0)
            brand_distribution[brand_name]['total_time'] += prediction.get('duration_seconds', 0)
            brand_distribution[brand_name]['avg_confidence'] = prediction.get('avg_score', 0)
        
        # Calculate temporal distribution (detections by time intervals)
        time_intervals = 10  # 10-second intervals
        interval_size = video_duration / time_intervals if video_duration > 0 else 1
        temporal_distribution = {}
        
        for i in range(time_intervals):
            start_time = i * interval_size
            end_time = (i + 1) * interval_size
            interval_detections = [
                d for d in detections 
                if d.get('t_start', 0) >= start_time and d.get('t_start', 0) < end_time
            ]
            temporal_distribution[f"{start_time:.1f}-{end_time:.1f}s"] = len(interval_detections)
        
        statistics = {
            "file_info": file_info,
            "video_statistics": {
                "total_duration_seconds": video_duration,
                "total_detections": total_detections,
                "unique_brands": unique_brands,
                "average_confidence": round(avg_confidence, 3),
                "total_detection_time": round(total_detection_time, 2),
                "detection_density": round(detection_density, 2),
                "detection_coverage": round((total_detection_time / video_duration * 100), 2) if video_duration > 0 else 0
            },
            "brand_distribution": brand_distribution,
            "temporal_distribution": temporal_distribution,
            "detections": detections,
            "predictions": predictions
        }
        
        return statistics
        
    except Exception as e:
        logger.error(f"Error getting file statistics: {e}")
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
