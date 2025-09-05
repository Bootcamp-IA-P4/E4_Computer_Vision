// Типы для медиа файлов (видео и изображения)
export interface MediaFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  status: 'uploading' | 'uploaded' | 'error' | 'processing';
  progress?: number;
  error?: string;
  sessionId?: string;
  fileType: 'video' | 'image'; // Добавляем тип файла
}

// Оставляем VideoFile для обратной совместимости
export interface VideoFile extends MediaFile {
  fileType: 'video';
}

// Типы для логотипов
export interface Logo {
  id: number;
  name: string;
  selected: boolean;
  icon?: string; // Эмодзи как fallback
  imageUrl?: string; // Путь к изображению логотипа
}

export interface UploadStatus {
  totalFiles: number;
  uploadedFiles: number;
  processingFiles: number;
  errorFiles: number;
}

// Типы для результатов анализа
export interface DetectionResult {
  logoId: number;
  logoName: string;
  frameNumber: number;
  timestamp: number;
  confidence: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

// Типы для статистики
export interface VideoAnalysisStats {
  totalFrames: number;
  totalDetections: number;
  logosDetected: Logo[];
  frameStats: FrameStats[];
}

export interface FrameStats {
  frameNumber: number;
  timestamp: number;
  detections: DetectionResult[];
}

// Типы для API запросов
export interface AnalysisRequest {
  videoFile: File;
  selectedLogos: number[];
  confidence?: number;
}

export interface AnalysisResponse {
  success: boolean;
  taskId: string;
  message: string;
}

export interface AnalysisStatus {
  taskId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  message?: string;
  results?: VideoAnalysisStats;
}

// Типы для ProcessingStatus
export type ProcessingStatusType = 'ready' | 'processing' | 'completed' | 'error' | 'not_found';

export interface ProcessingStatusData {
  status: ProcessingStatusType;
  progress?: number;
  message?: string;
  result?: any;
  stage?: string;
  error?: string;
}

// Типы для настроек приложения
export interface AppSettings {
  confidenceThreshold: number;
  maxFileSize: number;
  supportedFormats: string[];
}

// Типы для UI состояния
export interface UIState {
  isLoading: boolean;
  error: string | null;
}

// Типы для компонентов
export interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export interface ProgressBarProps {
  progress: number;
  label?: string;
  showPercentage?: boolean;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string;
    borderColor: string;
    borderWidth: number;
  }[];
}
