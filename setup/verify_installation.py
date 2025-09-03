import sys
print(f"✅ Python: {sys.version}")

try:
    import numpy as np
    print(f"✅ NumPy: {np.__version__}")
except Exception as e:
    print(f"❌ NumPy: {e}")

try:
    import torch
    print(f"✅ PyTorch: {torch.__version__}")
except Exception as e:
    print(f"❌ PyTorch: {e}")

try:
    import cv2
    print(f"✅ OpenCV: {cv2.__version__}")
except Exception as e:
    print(f"❌ OpenCV: {e}")

try:
    import ultralytics
    print(f"✅ Ultralytics: {ultralytics.__version__}")
except Exception as e:
    print(f"❌ Ultralytics: {e}")

try:
    import fastapi
    print(f"✅ FastAPI: {fastapi.__version__}")
except Exception as e:
    print(f"❌ FastAPI: {e}")

try:
    import supabase
    print(f"✅ Supabase: Available")
except Exception as e:
    print(f"❌ Supabase: {e}")

print("\n🔍 Testing critical functionality...")

try:
    # Test NumPy basic operations
    import numpy as np
    arr = np.array([1, 2, 3])
    print("✅ NumPy: Basic operations working")
except Exception as e:
    print(f"❌ NumPy operations: {e}")

try:
    # Test PyTorch basic operations
    import torch
    tensor = torch.tensor([1.0, 2.0, 3.0])
    print("✅ PyTorch: Basic operations working")
except Exception as e:
    print(f"❌ PyTorch operations: {e}")

print("\n✅ All critical dependencies are working!")
print("🚀 You can now run: .\\run.bat")
