#!/usr/bin/env python3
"""
LogoVision PRO - Startup Script
Starts the FastAPI backend server from within the backend directory
"""

import os
import sys
from pathlib import Path

# We're already in the backend directory
backend_dir = Path(__file__).parent.absolute()
sys.path.insert(0, str(backend_dir))

# Ensure we're in the backend directory
os.chdir(backend_dir)

# Import and run the main application
if __name__ == "__main__":
    from main import app
    import uvicorn
    
    print("🚀 Starting LogoVision PRO Backend...")
    print(f"📁 Working directory: {os.getcwd()}")
    print(f"🌐 Server will be available at: http://localhost:8001")
    print("=" * 50)
    
    uvicorn.run(app, host="0.0.0.0", port=8001, reload=True)
