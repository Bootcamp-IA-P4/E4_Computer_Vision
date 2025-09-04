# Frame Capture Feature Implementation

## Overview
This feature allows the system to save full frame captures when logos are detected in videos or images, providing team members with complete visual context of the detections.

## Database Schema

### New Table: `frame_captures`
```sql
CREATE TABLE frame_captures (
    id SERIAL PRIMARY KEY,
    file_id INTEGER NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    frame_number INTEGER NOT NULL,
    bucket VARCHAR(255) NOT NULL,
    path TEXT NOT NULL,
    public_url TEXT NOT NULL,
    t_start DECIMAL(10, 3),
    t_end DECIMAL(10, 3),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Updated Table: `detections`
- Added `frame_capture_id INTEGER` column
- Foreign key reference to `frame_captures(id)`

## Implementation Details

### 1. Video Processing (`processing_service.py`)
- When detections are found in a frame, the complete frame is saved
- Frame is uploaded to Supabase storage in the `frames/` directory
- A `frame_captures` record is created with metadata
- Each detection is linked to its corresponding frame capture

### 2. Image Processing (`processing_service.py`)
- When logos are detected in images, the full image is saved as a frame capture
- Maintains consistency with video processing workflow

### 3. Database Operations (`supabase_client.py`)
- New method: `insert_frame_capture()` - Saves frame capture metadata
- Updated: `insert_detection()` - Now supports `frame_capture_id` linking

### 4. API Enhancements (`endpoints.py`)

#### Enhanced Endpoints:
- `GET /detections/{file_id}` - Now includes frame capture URLs and paths
- `GET /detections` - Get all detections with frame capture information

#### New Endpoints:
- `GET /frame-captures/{file_id}` - Get all frame captures for a specific file
- `GET /frame-captures` - Get all frame captures in the system

## API Response Format

### Detection Response (Enhanced)
```json
{
  "detections": [
    {
      "id": 1,
      "file_id": 1,
      "brand_name": "Nike",
      "score": 0.95,
      "bbox": [100, 200, 300, 400],
      "t_start": 15.5,
      "t_end": 16.0,
      "frame": 465,
      "model": "yolov8",
      "created_at": "2024-01-01T12:00:00Z",
      "frame_capture_url": "https://supabase.co/.../frames/session123/frame_000465.jpg",
      "frame_capture_path": "frames/session123/frame_000465.jpg",
      "frame_number": 465
    }
  ]
}
```

### Frame Captures Response
```json
{
  "frame_captures": [
    {
      "id": 1,
      "file_id": 1,
      "frame_number": 465,
      "bucket": "factoria-images",
      "path": "frames/session123/frame_000465.jpg",
      "public_url": "https://supabase.co/.../frames/session123/frame_000465.jpg",
      "t_start": 15.5,
      "t_end": 16.0,
      "created_at": "2024-01-01T12:00:00Z"
    }
  ]
}
```

## Storage Structure

```
Supabase Storage: factoria-images bucket
├── images/           # Original uploaded images
├── videos/           # Original uploaded videos  
├── crops/            # Cropped detection areas
└── frames/           # NEW: Full frame captures with detections
    └── {session_id}/
        ├── frame_000465.jpg
        ├── frame_000512.jpg
        └── ...
```

## Benefits

1. **Complete Visual Context**: Team can see the full frame where logos were detected
2. **Better Quality Control**: Easier to verify detection accuracy
3. **Enhanced Analysis**: Full frame context helps understand brand placement and environment
4. **API Consistency**: Detection responses now include both crop and full frame URLs

## Database Migration

Run the SQL scripts in order:
1. `setup/sql/01_create_frame_captures_table.sql` - Creates the frame_captures table
2. `setup/sql/02_add_frame_capture_to_detections.sql` - Adds frame_capture_id to detections

## Usage Examples

### Get detections with frame captures
```python
# Get detections for a specific file
response = requests.get("/detections/123")
detections = response.json()["detections"]

for detection in detections:
    print(f"Brand: {detection['brand_name']}")
    print(f"Frame URL: {detection['frame_capture_url']}")
    print(f"Detection confidence: {detection['score']}")
```

### Get all frame captures for a file
```python
# Get frame captures for analysis
response = requests.get("/frame-captures/123")
frames = response.json()["frame_captures"]

for frame in frames:
    print(f"Frame {frame['frame_number']}: {frame['public_url']}")
```

## Performance Considerations

- Frame captures are only saved when detections are found (not for every frame)
- Indexes are created on `file_id` and `frame_capture_id` for efficient queries
- Foreign key constraints ensure data integrity
- Old frame captures are automatically cleaned up when files are deleted (CASCADE)

## Future Enhancements

- Add frame thumbnail generation for faster loading
- Implement frame capture compression options
- Add batch download capabilities for frame captures
- Consider video preview generation with detection highlights
