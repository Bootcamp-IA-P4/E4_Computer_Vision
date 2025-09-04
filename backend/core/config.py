import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# Get the backend directory path
BACKEND_DIR = Path(__file__).parent.parent.absolute()

# Supabase Configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
SUPABASE_SERVICE_ROLE = os.getenv("SUPABASE_SERVICE_ROLE")

# Model Configuration - Now inside backend/models/weights/
MODEL_WEIGHTS_DIR = BACKEND_DIR / "models" / "weights"
MODEL_PATH = str(MODEL_WEIGHTS_DIR / "best.pt")
CONFIDENCE_THRESHOLD = 0.5

# File Configuration - Now inside backend/storage/
STORAGE_DIR = BACKEND_DIR / "storage"
UPLOAD_DIR = str(STORAGE_DIR / "uploads")
FRAMES_DIR = str(STORAGE_DIR / "frames") 
CROPS_DIR = str(STORAGE_DIR / "crops")
MAX_FILE_SIZE = 100 * 1024 * 1024  # 100MB

# Video Processing Configuration
TARGET_FPS = 1  # Extract 1 frame per second
SUPPORTED_VIDEO_FORMATS = [".mp4", ".avi", ".mov", ".mkv"]
SUPPORTED_IMAGE_FORMATS = [".jpg", ".jpeg", ".png", ".bmp"]

# Supabase Storage
SUPABASE_IMAGES_BUCKET = "images"
SUPABASE_VIDEOS_BUCKET = "videos"
