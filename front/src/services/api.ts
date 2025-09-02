// API service for Logo Detection Backend
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8001';

export interface UploadResponse {
  message: string;
  session_id: string;
  filename: string;
  file_size: number;
}

export interface ProcessingStatus {
  status: 'processing' | 'completed' | 'error';
  session_id: string;
  file_id?: number;
  result?: ProcessingResult;
  error?: string;
  message?: string;
  progress?: number;
  stage?: string;
}

export interface ProcessingResult {
  file_id: number;
  session_id: string;
  detections_count: number;
  brands_detected: string[];
  statistics?: Record<string, any>;
  video_url?: string;
  image_url?: string;
  detections?: Detection[];
}

export interface Detection {
  bbox: [number, number, number, number];
  confidence: number;
  class_id: number;
  class_name: string;
  frame_number?: number;
}

export interface FileInfo {
  id: number;
  bucket: string;
  path: string;
  filename: string;
  file_type: 'image' | 'video';
  duration_seconds?: number;
  fps?: number;
  created_at: string;
}

export interface DetectionRecord {
  id: number;
  file_id: number;
  brand_id: number;
  score: number;
  bbox: [number, number, number, number];
  t_start?: number;
  t_end?: number;
  frame: number;
  model: string;
  created_at: string;
  brands: {
    name: string;
  };
  frame_capture_url?: string;
  frame_capture_path?: string;
  frame_number?: number;
}

export interface PredictionRecord {
  id: number;
  video_id: number;
  brand_id: number;
  total_detections: number;
  avg_score: number;
  max_score: number;
  min_score: number;
  duration_seconds: number;
  total_seconds?: number; // Optional field for backward compatibility
  first_detection_time: number;
  last_detection_time: number;
  created_at: string;
  brands: {
    name: string;
  };
}

class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  // Load configuration from config.json
  private async loadConfig(): Promise<void> {
    try {
      const configResponse = await fetch('/config.json');
      if (configResponse.ok) {
        const config = await configResponse.json();
        const configUrl = config.api?.url || config.frontend?.api_url;
        if (configUrl) {
          this.baseUrl = configUrl;
          console.log('📋 Loaded API URL from config:', this.baseUrl);
        }
      }
    } catch (error) {
      console.log('📋 Using default API URL:', this.baseUrl);
    }
  }

  // Initialize service with config
  async initialize(): Promise<void> {
    await this.loadConfig();
  }

  // Upload file for processing
  async uploadFile(file: File, onProgress?: (progress: number) => void): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      // Track upload progress
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = Math.round((event.loaded / event.total) * 100);
          onProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (error) {
            reject(new Error('Invalid response format'));
          }
        } else {
          try {
            const error = JSON.parse(xhr.responseText);
            reject(new Error(error.detail || 'Upload failed'));
          } catch {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'));
      });

      xhr.open('POST', `${this.baseUrl}/upload`);
      xhr.send(formData);
    });
  }

  // Start processing for uploaded file
  async startProcessing(sessionId: string): Promise<{ message: string; session_id: string; filename: string }> {
    console.log(`🚀 API: Starting processing for session ${sessionId}`);
    try {
      const response = await fetch(`${this.baseUrl}/start-processing/${sessionId}`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to start processing');
      }

      const result = await response.json();
      console.log(`✅ API: Processing started for session ${sessionId}`);
      return result;
    } catch (error) {
      console.error(`❌ API: Error starting processing:`, error);
      throw error;
    }
  }

  // Check processing status
  async getProcessingStatus(sessionId: string): Promise<ProcessingStatus> {
    console.log(`🌐 API: Checking status for session ${sessionId}`);
    try {
      const response = await fetch(`${this.baseUrl}/processing-status/${sessionId}`);
      console.log(`📡 API: Response status: ${response.status}`);
      console.log(`📡 API: Response headers:`, Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ API: Error response: ${errorText}`);
        throw new Error(`Failed to get processing status: ${response.status} ${errorText}`);
      }
      
      const result = await response.json();
      console.log(`📄 API: Status result:`, result);
      console.log(`📄 API: Result status:`, result.status);
      console.log(`📄 API: Result has result field:`, !!result.result);
      
      return result;
    } catch (error) {
      console.error(`❌ API: Network error:`, error);
      throw error;
    }
  }

  // Clear processing status
  async clearProcessingStatus(sessionId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/processing-status/${sessionId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to clear processing status');
    }
  }

  // Get all processed files
  async getFiles(): Promise<{ files: FileInfo[] }> {
    const response = await fetch(`${this.baseUrl}/files`);
    
    if (!response.ok) {
      throw new Error('Failed to get files');
    }

    return response.json();
  }

  // Get detections for a file
  async getDetections(fileId: number): Promise<{ detections: DetectionRecord[] }> {
    const response = await fetch(`${this.baseUrl}/detections/${fileId}`);
    
    if (!response.ok) {
      throw new Error('Failed to get detections');
    }

    return response.json();
  }

  // Get predictions for a file
  async getPredictions(fileId: number): Promise<{ predictions: PredictionRecord[] }> {
    const response = await fetch(`${this.baseUrl}/predictions/${fileId}`);
    
    if (!response.ok) {
      throw new Error('Failed to get predictions');
    }

    return response.json();
  }

  // Health check
  async healthCheck(): Promise<{ status: string; model_loaded: boolean }> {
    const response = await fetch(`${this.baseUrl}/health`);
    
    if (!response.ok) {
      throw new Error('Backend is not available');
    }

    return response.json();
  }
}

export const apiService = new ApiService();
