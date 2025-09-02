from supabase import create_client, Client
from backend.core.config import SUPABASE_URL, SUPABASE_SERVICE_ROLE
import logging

logger = logging.getLogger(__name__)

class SupabaseClient:
    def __init__(self):
        self.client: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE)
    
    async def upload_file_to_storage(self, file_path: str, bucket: str, destination_path: str) -> str:
        """Upload file to Supabase storage"""
        try:
            with open(file_path, 'rb') as f:
                response = self.client.storage.from_(bucket).upload(destination_path, f)
            
            # Supabase storage upload returns different response format
            # Check if upload was successful and get public URL
            if response:
                # Get public URL
                public_url = self.client.storage.from_(bucket).get_public_url(destination_path)
                logger.info(f"File uploaded successfully: {destination_path}")
                return public_url
            else:
                raise Exception(f"Upload failed: {response}")
        except Exception as e:
            logger.error(f"Error uploading file: {e}")
            raise
    
    async def insert_file_record(self, file_data: dict) -> int:
        """Insert file record into files table"""
        try:
            response = self.client.table('files').insert(file_data).execute()
            return response.data[0]['id']
        except Exception as e:
            logger.error(f"Error inserting file record: {e}")
            raise
    
    async def insert_detection(self, detection_data: dict) -> int:
        """Insert detection record"""
        try:
            response = self.client.table('detections').insert(detection_data).execute()
            return response.data[0]['id']
        except Exception as e:
            logger.error(f"Error inserting detection: {e}")
            raise
    
    async def insert_prediction(self, prediction_data: dict) -> int:
        """Insert prediction record"""
        try:
            response = self.client.table('predictions').insert(prediction_data).execute()
            return response.data[0]['id']
        except Exception as e:
            logger.error(f"Error inserting prediction: {e}")
            raise
    
    async def get_or_create_brand(self, brand_name: str) -> int:
        """Get brand ID or create new brand"""
        try:
            # Try to get existing brand
            response = self.client.table('brands').select('id').eq('name', brand_name).execute()
            
            if response.data:
                return response.data[0]['id']
            else:
                # Create new brand
                response = self.client.table('brands').insert({'name': brand_name}).execute()
                return response.data[0]['id']
        except Exception as e:
            logger.error(f"Error getting/creating brand: {e}")
            raise
    
    async def insert_frame_capture(self, frame_capture_data: dict) -> int:
        """Insert frame capture record"""
        try:
            response = self.client.table('frame_captures').insert(frame_capture_data).execute()
            return response.data[0]['id']
        except Exception as e:
            logger.error(f"Error inserting frame capture: {e}")
            raise

# Global instance
supabase_client = SupabaseClient()
