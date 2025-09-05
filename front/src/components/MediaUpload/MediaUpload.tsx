import React, { useState, useCallback } from 'react';
import './MediaUpload.css';
import { MediaFile } from '../../types';
import { apiService } from '../../services/api';

interface MediaUploadProps {
  onMediaUpload: (files: MediaFile[]) => void;
}

const MediaUpload: React.FC<MediaUploadProps> = ({ onMediaUpload }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<MediaFile[]>([]);
  const [error, setError] = useState<string | null>(null);

  const validateFile = (file: File): string | null => {
    // Поддерживаемые форматы видео и изображений
    const validVideoTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/mkv', 'video/webm'];
    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/bmp'];
    const validTypes = [...validVideoTypes, ...validImageTypes];
    
    const maxSize = 100 * 1024 * 1024; // 100MB

    if (!validTypes.includes(file.type)) {
      return 'Please select a valid video or image file (MP4, AVI, MOV, MKV, WebM, JPG, PNG, BMP)';
    }

    if (file.size > maxSize) {
      return 'File size must be less than 100MB';
    }

    return null;
  };

  const getFileType = (file: File): 'video' | 'image' => {
    return file.type.startsWith('video/') ? 'video' : 'image';
  };

  const handleFile = useCallback(async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    const fileId = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const mediaFile: MediaFile = {
      id: fileId,
      name: file.name,
      size: file.size,
      type: file.type,
      url: URL.createObjectURL(file),
      status: 'uploading',
      progress: 0,
      fileType: getFileType(file)
    };

    setUploadedFiles(prev => [...prev, mediaFile]);

    try {
      console.log('🚀 Starting upload for file:', fileId, file.name, 'Type:', mediaFile.fileType);
      // Upload file to backend with progress tracking
      const response = await apiService.uploadFile(file, (progress) => {
        console.log('📊 Upload progress:', progress + '%');
        setUploadedFiles(prev => 
          prev.map(f => 
            f.id === fileId 
              ? { ...f, progress }
              : f
          )
        );
      });
      
      console.log('📡 Upload response:', response);

      // Update file with session ID and mark as uploaded
      setUploadedFiles(prev => 
        prev.map(f => 
          f.id === fileId 
            ? { 
                ...f, 
                status: 'uploaded', 
                progress: 100,
                sessionId: response.session_id 
              }
            : f
        )
      );
      
      console.log('✅ File status updated to uploaded:', fileId);
      console.log('✅ File uploaded successfully:', response);
    } catch (error) {
      console.error('❌ Upload failed:', error);
      console.error('❌ Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      setUploadedFiles(prev => 
        prev.map(f => 
          f.id === fileId 
            ? { ...f, status: 'error', error: error instanceof Error ? error.message : 'Upload failed' }
            : f
        )
      );
      setError(error instanceof Error ? error.message : 'Upload failed');
    }
  }, []);

  const handleMultipleFiles = useCallback((files: FileList) => {
    Array.from(files).forEach(handleFile);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleMultipleFiles(files);
    }
  }, [handleMultipleFiles]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleMultipleFiles(files);
    }
  }, [handleMultipleFiles]);

  const removeFile = useCallback((fileId: string) => {
    setUploadedFiles(prev => {
      const fileToRemove = prev.find(f => f.id === fileId);
      if (fileToRemove) {
        URL.revokeObjectURL(fileToRemove.url);
      }
      return prev.filter(f => f.id !== fileId);
    });
  }, []);

  const handleContinue = useCallback(() => {
    console.log('🔍 Current uploaded files:', uploadedFiles.map(f => ({ id: f.id, name: f.name, status: f.status, fileType: f.fileType })));
    const validFiles = uploadedFiles.filter(f => f.status === 'uploaded' || f.status === 'processing');
    console.log('✅ Valid files for continue:', validFiles.map(f => ({ id: f.id, name: f.name, status: f.status, fileType: f.fileType })));
    if (validFiles.length > 0) {
      onMediaUpload(validFiles);
    }
  }, [uploadedFiles, onMediaUpload]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: 'video' | 'image'): string => {
    return fileType === 'video' ? '🎬' : '🖼️';
  };

  return (
    <div className="media-upload">
      <div className="upload-container">
        <div 
          className={`upload-area ${isDragOver ? 'drag-over' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="upload-content">
            <div className="upload-button-container">
              <label className="upload-button">
                <span className="button-text">Select Media Files</span>
                <input
                  type="file"
                  accept="video/*,image/*"
                  multiple
                  onChange={handleFileInput}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
            
            <div className="upload-info">
              <p className="formats-text">Supported formats: MP4, AVI, MOV, MKV, WebM, JPG, PNG, BMP</p>
              <p className="size-limit">Maximum size: 100MB per file</p>
              <p className="drag-drop-hint">Drag and drop multiple files here</p>
            </div>
          </div>
        </div>
        
        {error && (
          <div className="error-message">
            <div className="error-icon">⚠️</div>
            <div className="error-text">{error}</div>
          </div>
        )}

        {/* File List */}
        {uploadedFiles.length > 0 && (
          <div className="uploaded-files">
            <h3>Uploaded Files ({uploadedFiles.length})</h3>
            <div className="files-grid">
              {uploadedFiles.map(file => (
                <div key={file.id} className={`file-card ${file.status}`}>
                  <div className="file-header">
                    <div className="file-name">
                      <span className="file-icon">{getFileIcon(file.fileType)}</span>
                      {file.name}
                    </div>
                    <button 
                      className="remove-file-btn"
                      onClick={() => removeFile(file.id)}
                      title="Remove file"
                    >
                      ×
                    </button>
                  </div>
                  
                  <div className="file-info">
                    <span className="file-size">{formatFileSize(file.size)}</span>
                    <span className="file-type">{file.fileType.toUpperCase()}</span>
                  </div>
                  
                  {file.status === 'uploading' && (
                    <div className="upload-progress">
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ width: `${file.progress || 0}%` }}
                        ></div>
                      </div>
                      <span className="progress-text">{Math.round(file.progress || 0)}%</span>
                    </div>
                  )}
                  
                  <div className="file-status">
                    <span className={`status-badge ${file.status}`}>
                      {file.status === 'uploading' && '⏳ Uploading...'}
                      {file.status === 'uploaded' && '✅ Uploaded'}
                      {file.status === 'error' && '❌ Error'}
                      {file.status === 'processing' && '🔄 Processing'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="upload-actions">
              <button 
                className="continue-btn"
                onClick={handleContinue}
                disabled={uploadedFiles.filter(f => f.status === 'uploaded' || f.status === 'processing').length === 0}
              >
                Continue with {uploadedFiles.filter(f => f.status === 'uploaded' || f.status === 'processing').length} File(s)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MediaUpload;
