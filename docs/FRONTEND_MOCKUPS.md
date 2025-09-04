# Frontend UI/UX Mockups - Logo Detection System

## 🎨 Diseño Principal - Wireframes

### 📱 **Vista Principal (Dashboard)**
```
╔═══════════════════════════════════════════════════════════════╗
║ 🎯 Logo Detection System                    👤 User   🔧 Settings ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║  ┌─────────────────────────────────────────────────────────┐  ║
║  │              📁 UPLOAD NEW FILE                        │  ║
║  │                                                        │  ║
║  │     🎬 Drag & drop video or image here                │  ║
║  │           or click to browse                          │  ║
║  │                                                        │  ║
║  │     Supported: MP4, AVI, MOV, JPG, PNG               │  ║
║  │     Max size: 100MB                                   │  ║
║  └─────────────────────────────────────────────────────────┘  ║
║                                                               ║
║  📊 RECENT UPLOADS                              🔍 [Search]    ║
║  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐             ║
║  │ 📹 vid1 │ │ 🖼️ img1 │ │ 📹 vid2 │ │ 🖼️ img2 │             ║
║  │ 3 logos │ │ 2 logos │ │ 5 logos │ │ 1 logo  │             ║
║  │ Nike    │ │ Adidas  │ │ Nike    │ │ Apple   │             ║
║  │ Adidas  │ │ Nike    │ │ Samsung │ │         │             ║
║  │ Apple   │ │         │ │ Apple   │ │         │             ║
║  │ 2min ago│ │ 5min ago│ │ 1hr ago │ │ 2hr ago │             ║
║  └─────────┘ └─────────┘ └─────────┘ └─────────┘             ║
║                                                               ║
║  📈 STATISTICS                                                ║
║  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐  ║
║  │ Total Files: 24 │ │ Brands Found: 8 │ │ Success Rate: 95%│  ║
║  └─────────────────┘ └─────────────────┘ └─────────────────┘  ║
╚═══════════════════════════════════════════════════════════════╝
```

### 🎬 **Vista de Detecciones (Video/Image Viewer)**
```
╔═══════════════════════════════════════════════════════════════╗
║ ← Back to Dashboard          📁 video1.mp4          🔗 Share   ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║  ┌─────────────────────────────────────┐ ┌─────────────────┐  ║
║  │                                     │ │  🎯 DETECTIONS  │  ║
║  │           VIDEO PLAYER              │ │                 │  ║
║  │                                     │ │ Frame 465:      │  ║
║  │     [▶️] ████████████░░░ 00:15      │ │ • Nike (95%)    │  ║
║  │         🎯    🎯     🎯             │ │ • Adidas (87%)  │  ║
║  │      Detection markers              │ │                 │  ║
║  │                                     │ │ Frame 512:      │  ║
║  └─────────────────────────────────────┘ │ • Apple (92%)   │  ║
║                                          │                 │  ║
║  🖼️ FRAME CAPTURES                       │ 📊 STATISTICS   │  ║
║  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐       │ Total: 8 logos  │  ║
║  │ F465│ │ F512│ │ F678│ │ F890│       │ Confidence: 91% │  ║
║  │Nike │ │Apple│ │Nike │ │Sams │       │ Duration: 0:15  │  ║
║  │Adi  │ │     │ │     │ │ung │       │ Brands: 4       │  ║
║  └─────┘ └─────┘ └─────┘ └─────┘       └─────────────────┘  ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
```

### 📊 **Vista de Estadísticas**
```
╔═══════════════════════════════════════════════════════════════╗
║ 📊 Analytics Dashboard                                        ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║  📈 BRAND DETECTION TRENDS                                    ║
║  ┌─────────────────────────────────────────────────────────┐  ║
║  │     📊                                                  │  ║
║  │  Nike ████████████████████████ 45%                     │  ║
║  │ Adidas ██████████████████ 32%                          │  ║
║  │ Apple ████████████ 18%                                 │  ║
║  │Samsung ██████ 12%                                      │  ║
║  │ Google ████ 8%                                         │  ║
║  └─────────────────────────────────────────────────────────┘  ║
║                                                               ║
║  ⏱️ TIMELINE                        📈 CONFIDENCE SCORES      ║
║  ┌─────────────────────────────┐   ┌─────────────────────────┐ ║
║  │ Today:     12 detections   │   │ Average: 91.2%          │ ║
║  │ Yesterday:  8 detections   │   │ Highest: 98.5% (Nike)   │ ║
║  │ This Week: 45 detections   │   │ Lowest:  82.1% (Google) │ ║
║  │ This Month:127 detections  │   │ Trend: ↗️ +2.3%          │ ║
║  └─────────────────────────────┘   └─────────────────────────┘ ║
╚═══════════════════════════════════════════════════════════════╝
```

## 🎨 Paleta de Colores Propuesta

### 🌈 **Scheme 1: Tech Blue (Recomendado)**
```css
:root {
  --primary: #3B82F6;     /* Blue 500 */
  --secondary: #1E40AF;   /* Blue 700 */
  --accent: #10B981;      /* Emerald 500 */
  --success: #059669;     /* Emerald 600 */
  --warning: #F59E0B;     /* Amber 500 */
  --error: #EF4444;       /* Red 500 */
  --background: #F8FAFC;  /* Slate 50 */
  --surface: #FFFFFF;     /* White */
  --text: #1E293B;        /* Slate 800 */
  --text-muted: #64748B;  /* Slate 500 */
}
```

### 🌈 **Scheme 2: Modern Purple**
```css
:root {
  --primary: #8B5CF6;     /* Violet 500 */
  --secondary: #7C3AED;   /* Violet 600 */
  --accent: #06B6D4;      /* Cyan 500 */
  --success: #10B981;     /* Emerald 500 */
  --warning: #F59E0B;     /* Amber 500 */
  --error: #EF4444;       /* Red 500 */
}
```

## 🧩 Componentes UI Específicos

### 📤 **Upload Component**
```javascript
// Features:
✅ Drag & drop zone
✅ File validation
✅ Progress indicator
✅ Preview thumbnail
✅ Error handling
✅ Multiple file support

// States:
- idle: "Drop files here"
- dragover: "Release to upload"
- uploading: "Processing... 45%"
- success: "Upload complete!"
- error: "Invalid file format"
```

### 🎬 **Video Player Component**
```javascript
// Features:
✅ Custom controls
✅ Detection markers on timeline
✅ Bounding box overlay
✅ Frame seeking
✅ Fullscreen mode
✅ Playback speed control

// Integration:
- API: /detections/{file_id}
- Markers: t_start, t_end positions
- Overlay: bbox coordinates
- Frames: frame_capture_url links
```

### 🖼️ **Frame Gallery Component**
```javascript
// Features:
✅ Grid layout
✅ Lazy loading
✅ Lightbox modal
✅ Bounding box overlay
✅ Brand labels
✅ Confidence scores

// Data source:
- API: /frame-captures/{file_id}
- API: /detections/{file_id}
```

### 📊 **Statistics Component**
```javascript
// Chart types:
✅ Bar chart: Brand frequency
✅ Line chart: Detection trends
✅ Pie chart: Brand distribution
✅ Gauge: Average confidence
✅ Cards: Quick stats

// Libraries:
- Chart.js / Recharts
- Data from multiple endpoints
```

## 🎯 User Experience Flow

### 🔄 **Happy Path:**
```
1. User lands on dashboard
   ↓
2. Drags video file to upload zone
   ↓
3. Sees progress bar during processing
   ↓
4. Gets redirected to results view
   ↓
5. Sees video with detection markers
   ↓
6. Clicks on markers to see frames
   ↓
7. Views detailed statistics
   ↓
8. Shares results or processes new file
```

### ⚠️ **Error Handling:**
```
- File too large → Clear message + recommendations
- Invalid format → Supported formats list
- Network error → Retry button + offline notice
- No detections → "No logos found" + suggestions
- API error → Technical details + support contact
```

## 🚀 Tecnologías por Propuesta

### **Propuesta 1: React Stack**
```json
{
  "core": ["react", "vite", "typescript"],
  "styling": ["tailwindcss", "@headlessui/react"],
  "state": ["zustand", "@tanstack/react-query"],
  "media": ["video.js", "react-player"],
  "charts": ["recharts", "chart.js"],
  "utils": ["axios", "react-dropzone", "react-hot-toast"],
  "icons": ["lucide-react", "@heroicons/react"]
}
```

### **Propuesta 2: Vue Stack**
```json
{
  "core": ["vue", "nuxt", "typescript"],
  "styling": ["tailwindcss", "@nuxtjs/tailwindcss"],
  "state": ["pinia", "@pinia/nuxt"],
  "media": ["video.js", "@nuxtjs/google-fonts"],
  "charts": ["vue-chartjs", "chart.js"],
  "utils": ["axios", "@nuxtjs/axios"],
  "icons": ["@heroicons/vue", "lucide-vue-next"]
}
```

¿Qué opinas de estos mockups y propuestas? ¿Te gusta algún diseño en particular o prefieres que ajuste algo específico?
