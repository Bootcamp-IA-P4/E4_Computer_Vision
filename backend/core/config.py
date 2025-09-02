import os
from dotenv import load_dotenv

load_dotenv()

# Supabase Configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
SUPABASE_SERVICE_ROLE = os.getenv("SUPABASE_SERVICE_ROLE")

# Model Configuration
MODEL_PATH = "best.pt"
CONFIDENCE_THRESHOLD = 0.5

# File Configuration
UPLOAD_DIR = "uploads"
FRAMES_DIR = "frames"
CROPS_DIR = "crops"
MAX_FILE_SIZE = 100 * 1024 * 1024  # 100MB

# Video Processing Configuration
TARGET_FPS = 1  # Extract 1 frame per second
SUPPORTED_VIDEO_FORMATS = [".mp4", ".avi", ".mov", ".mkv"]
SUPPORTED_IMAGE_FORMATS = [".jpg", ".jpeg", ".png", ".bmp"]

# Supabase Storage
SUPABASE_IMAGES_BUCKET = "images"
SUPABASE_VIDEOS_BUCKET = "videos"
