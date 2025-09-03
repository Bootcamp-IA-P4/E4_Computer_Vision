FROM python:3.10-slim

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    libgl1-mesa-glx \
    && rm -rf /var/lib/apt/lists/*

# Crear directorio de trabajo
WORKDIR /app

# Copiar requirements y instalar dependencias Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código de la aplicación
COPY . .

# Crear directorios necesarios
RUN mkdir -p temp/uploads temp/frames temp/crops

# Exponer puerto
EXPOSE 8001

# Variables de entorno por defecto
ENV PYTHONPATH=/app
ENV UPLOAD_DIR=temp/uploads
ENV FRAMES_DIR=temp/frames
ENV CROPS_DIR=temp/crops

# Comando por defecto
CMD ["python", "main.py"]
