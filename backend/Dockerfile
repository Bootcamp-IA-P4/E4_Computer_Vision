FROM python:3.10-slim

# Instalar dependencias del sistema necesarias para OpenCV, Torch y YOLO
RUN apt-get update && apt-get install -y \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    libgl1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copiar requirements e instalar dependencias Python
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt


# Copiar el backend y main.py
COPY backend ./backend
COPY main.py .
COPY backend/best.pt .

# Crear directorios necesarios (aunque también se crean en el código)
RUN mkdir -p temp/uploads temp/frames temp/crops

# Exponer el puerto usado en main.py
EXPOSE 8001

# Variables de entorno internas
ENV PYTHONPATH=/app \
    UPLOAD_DIR=temp/uploads \
    FRAMES_DIR=temp/frames \
    CROPS_DIR=temp/crops

# Arranque de la API
CMD ["python", "main.py"]
