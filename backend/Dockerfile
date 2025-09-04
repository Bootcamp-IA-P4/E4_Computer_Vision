FROM python:3.10-slim AS base

# Instalar dependencias de sistema mínimas
RUN apt-get update && apt-get install -y \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    libgomp1 \
    libgl1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copiar requirements e instalar dependencias (CPU-only Torch)
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar el código del backend
COPY backend ./backend
COPY main.py .
COPY backend/best.pt .

# Crear directorios necesarios
RUN mkdir -p temp/uploads temp/frames temp/crops

EXPOSE 8001

ENV PYTHONPATH=/app \
    UPLOAD_DIR=temp/uploads \
    FRAMES_DIR=temp/frames \
    CROPS_DIR=temp/crops

CMD ["python", "main.py"]
