import React, { useState, useEffect } from 'react';
import './App.css';
import VideoUpload from './components/VideoUpload/VideoUpload';
import LogoSelector from './components/LogoSelector/LogoSelector';
import ProgressBar from './components/UI/ProgressBar/ProgressBar';
import ProcessingStatus from './components/ProcessingStatus/ProcessingStatus';
import ResultsDisplay from './components/ResultsDisplay/ResultsDisplay';
import { VideoFile, Logo } from './types';
import { ProcessingResult, apiService } from './services/api';

function App() {
  const [currentStep, setCurrentStep] = useState<'upload' | 'select' | 'process' | 'results'>('upload');
  const [selectedVideos, setSelectedVideos] = useState<VideoFile[]>([]);
  const [selectedLogos, setSelectedLogos] = useState<Logo[]>([]);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [processingResults, setProcessingResults] = useState<ProcessingResult[]>([]);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [currentProcessingIndex, setCurrentProcessingIndex] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize API service on app start
  useEffect(() => {
    const initApi = async () => {
      try {
        await apiService.initialize();
        setIsInitialized(true);
        console.log('✅ API service initialized');
      } catch (error) {
        console.error('❌ Failed to initialize API service:', error);
        setIsInitialized(true); // Continue anyway with default config
      }
    };

    initApi();
  }, []);

  // Debug logging for processing results and selected logos
  useEffect(() => {
    console.log('🎯 App - processingResults updated:', processingResults.length, 'results');
    if (processingResults.length > 0) {
      console.log('🎯 App - processingResults:', processingResults.map(r => ({ file_id: r.file_id, session_id: r.session_id, brands: r.brands_detected })));
      console.log('🎯 App - selectedLogos:', selectedLogos);
      
      // Специальная отладка для Microsoft
      const microsoftInSelected = selectedLogos.find(logo => logo.name.toLowerCase().includes('microsoft'));
      console.log('🎯 App - Microsoft debug:', {
        inSelected: microsoftInSelected,
        selectedLogos: selectedLogos.map(logo => ({ id: logo.id, name: logo.name, selected: logo.selected }))
      });
    }
  }, [processingResults, selectedLogos]);

  const handleVideoUpload = (videos: VideoFile[]) => {
    setSelectedVideos(videos);
    setCurrentStep('select');
  };

  const handleLogoSelection = async (logos: Logo[]) => {
    console.log('🎯 App: handleLogoSelection called with logos:', logos);
    console.log('🎯 App: Microsoft in selected logos:', logos.find(logo => logo.name.toLowerCase().includes('microsoft')));
    
    setSelectedLogos(logos);
    setCurrentStep('process');
    
    // Start processing all uploaded videos
    const uploadedVideos = selectedVideos.filter(video => video.status === 'uploaded' && video.sessionId);
    
    if (uploadedVideos.length === 0) {
      setProcessingError('No uploaded videos found for processing');
      return;
    }

    console.log(`🚀 Starting processing for ${uploadedVideos.length} videos`);
    
    // Start processing the first video
    const firstVideo = uploadedVideos[0];
    if (!firstVideo.sessionId) {
      setProcessingError('No session ID found for first video');
      return;
    }
    
      setCurrentSessionId(firstVideo.sessionId);
    setCurrentProcessingIndex(0);
    setProcessingResults([]);
      
      try {
        console.log('🚀 Starting processing for session:', firstVideo.sessionId);
        await apiService.startProcessing(firstVideo.sessionId);
        console.log('✅ Processing started successfully');
      } catch (error) {
        console.error('❌ Failed to start processing:', error);
        setProcessingError(error instanceof Error ? error.message : 'Failed to start processing');
    }
  };

  const handleProcessingComplete = async (result: ProcessingResult) => {
    console.log('🎯 App: Processing completed for video:', result.file_id, 'session:', result.session_id);
    console.log('🎯 App: Current processing results:', processingResults.map(r => ({ file_id: r.file_id, session_id: r.session_id })));
    
    // Add result to the array first, then check for duplicates
    setProcessingResults(prev => {
      // Check if this result is already in our results array to avoid duplicates
      const isDuplicate = prev.some(existingResult => existingResult.session_id === result.session_id);
      if (isDuplicate) {
        console.log('🎯 App: Duplicate result detected, ignoring session:', result.session_id);
        return prev; // Return existing array without adding duplicate
      }
      
      console.log('🎯 App: Adding new result to array:', result.session_id);
      return [...prev, result];
    });
    
    // Use setTimeout to ensure state update is processed before checking next video
    setTimeout(() => {
      // Check if there are more videos to process
      const uploadedVideos = selectedVideos.filter(video => video.status === 'uploaded' && video.sessionId);
      const nextIndex = currentProcessingIndex + 1;
      
      console.log(`🎯 App: Processing status - currentIndex: ${currentProcessingIndex}, nextIndex: ${nextIndex}, totalVideos: ${uploadedVideos.length}`);
      
      if (nextIndex < uploadedVideos.length) {
        // Process next video
        const nextVideo = uploadedVideos[nextIndex];
        if (!nextVideo.sessionId) {
          console.error('❌ No session ID found for next video');
          setProcessingError('No session ID found for next video');
          setCurrentStep('results');
          return;
        }
        
        // Update current session ID to the next video's session ID
        setCurrentSessionId(nextVideo.sessionId);
        setCurrentProcessingIndex(nextIndex);
        
        try {
          console.log(`🚀 Starting processing for next video (${nextIndex + 1}/${uploadedVideos.length}):`, nextVideo.sessionId);
          apiService.startProcessing(nextVideo.sessionId).then(() => {
            console.log('✅ Processing started for next video');
          }).catch((error) => {
            console.error('❌ Failed to start processing next video:', error);
            setProcessingError(error instanceof Error ? error.message : 'Failed to start processing next video');
            setCurrentStep('results');
          });
        } catch (error) {
          console.error('❌ Failed to start processing next video:', error);
          setProcessingError(error instanceof Error ? error.message : 'Failed to start processing next video');
          setCurrentStep('results');
        }
      } else {
        // All videos processed, show results
        console.log('🎯 App: All videos processed, showing results');
    setCurrentStep('results');
      }
    }, 100); // Small delay to ensure state update is processed
  };

  const handleProcessingError = (error: string) => {
    setProcessingError(error);
    setCurrentStep('results');
  };

  const handleToggleBrand = (brandName: string) => {
    setSelectedLogos(prevLogos => {
      const isSelected = prevLogos.some(logo => logo.name === brandName);
      if (isSelected) {
        return prevLogos.filter(logo => logo.name !== brandName);
      } else {
        return [...prevLogos, { 
          name: brandName, 
          id: Date.now(), // Generate a unique ID
          selected: true 
        }];
      }
    });
  };

  const resetApp = () => {
    setCurrentStep('upload');
    setSelectedVideos([]);
    setSelectedLogos([]);
    setProcessingProgress(0);
    setCurrentSessionId(null);
    setProcessingResults([]);
    setProcessingError(null);
    setCurrentProcessingIndex(0);
  };

  const handleDownloadReport = () => {
    if (processingResults.length === 0) return;
    
    // For now, just show an alert. In a real implementation, this would generate and download a PDF report
    const reportData = {
      totalVideos: processingResults.length,
      totalDetections: processingResults.reduce((sum, result) => sum + (result.detections?.length || result.detections_count || 0), 0),
      totalBrands: processingResults.reduce((sum, result) => sum + (result.brands_detected?.length || 0), 0),
      videos: processingResults.map((result, index) => ({
        videoNumber: index + 1,
        fileId: result.file_id,
        detections: result.detections?.length || result.detections_count || 0,
        brands: result.brands_detected?.join(', ') || 'None'
      }))
    };
    
    console.log('📊 Report data:', reportData);
    alert(`Отчет будет загружен!\n\nОбработано видео: ${reportData.totalVideos}\nВсего обнаружений: ${reportData.totalDetections}\nВсего брендов: ${reportData.totalBrands}`);
  };

  // Show loading screen while initializing
  if (!isInitialized) {
    return (
      <div className="app">
        <div className="loading-screen">
          <div className="loading-spinner"></div>
          <h2>Initializing LogoVision Pro...</h2>
          <p>Loading configuration and connecting to API</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="header-decoration top-right"></div>
        <div className="header-decoration bottom-left"></div>
        <div className="header-decoration center"></div>
        
        <div className="logo-header-container">
          <img 
            src="/logos/Logo-vision-pro-1-B.png" 
            alt="LogoVision Pro" 
            className="main-header-logo"
          />
        </div>
        
        <h1 className="app-title">LogoVision Pro</h1>
        <p className="app-subtitle">Advanced AI-powered logo detection and analysis platform</p>
        
        <div className="hero-stats">
          <div className="stat-item">
            <div className="stat-number">24/7</div>
            <div className="stat-label">Processing</div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {/* Step 1: Video Upload */}
        {currentStep === 'upload' && (
          <div className="step-content">
            <div className="step-section">
              <div className="step-header">
                <div className="step-number">1</div>
                <h2>Video Upload</h2>
                <p className="step-description italic-text">
                  Upload a video file to analyze logos
                </p>
              </div>
              <VideoUpload onVideoUpload={handleVideoUpload} />
            </div>
          </div>
        )}

        {/* Step 2: Logo Selection */}
        {currentStep === 'select' && (
          <div className="step-content">
            <div className="step-section">
              <div className="step-header">
                <div className="step-number">2</div>
                <h2>Logo Selection</h2>
                <p className="step-description">
                  Choose which logos to detect in your video
                </p>
              </div>
              <LogoSelector 
                onNext={handleLogoSelection}
                selectedLogos={selectedLogos}
              />
            </div>
          </div>
        )}

        {/* Step 3: Processing */}
        {currentStep === 'process' && currentSessionId && (
          <div className="step-content">
            <div className="step-section">
              <div className="step-header">
                <div className="step-number">3</div>
                <h2>Processing Video</h2>
                <p className="step-description">
                  AI is analyzing your video{selectedVideos.length > 1 ? 's' : ''} for logo detection
                  {selectedVideos.length > 1 && (
                    <span className="processing-progress">
                      (Video {currentProcessingIndex + 1} of {selectedVideos.filter(v => v.status === 'uploaded').length})
                    </span>
                  )}
                </p>
              </div>
              
              <ProcessingStatus 
                sessionId={currentSessionId}
                onComplete={handleProcessingComplete}
                onError={handleProcessingError}
              />
            </div>
          </div>
        )}

        {/* Step 4: Results */}
        {currentStep === 'results' && (
          <div className="step-content">
            <div className="step-section">
              <div className="step-header">
                <div className="step-number">4</div>
                <h2>Analysis Results</h2>
                <p className="step-description">
                  {processingError ? 'Processing encountered an error' : 
                   processingResults.length > 1 ? 
                     `Successfully analyzed ${processingResults.length} videos` : 
                     'Your video has been analyzed successfully'}
                </p>
              </div>
              
              {processingError ? (
                <div className="error-results">
                  <div className="error-icon">❌</div>
                  <h3>Processing Error</h3>
                  <p className="error-message">{processingError}</p>
                  <div className="action-buttons">
                    <button className="btn btn-primary" onClick={resetApp}>
                      Try Again
                    </button>
                  </div>
                </div>
              ) : processingResults.length > 0 ? (
                <div className="results-container">
                  {processingResults.map((result, index) => (
                    <div key={result.file_id || index} className="video-result">
                      <h3>Video {index + 1} Results</h3>
                      <ResultsDisplay 
                        result={result} 
                        selectedLogos={selectedLogos} 
                        onToggleBrand={handleToggleBrand}
                      />
                    </div>
                  ))}
                  
                  {/* Action buttons outside the map loop */}
                  <div className="action-buttons">
                    <button className="btn btn-primary" onClick={resetApp}>
                      {processingResults.length > 1 ? 'Analyze More Videos' : 'Analyze Another Video'}
                    </button>
                    <button className="btn btn-secondary" onClick={handleDownloadReport}>
                      {processingResults.length > 1 ? 'Download All Reports' : 'Download Report'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="no-results">
                  <p>No results available</p>
                  <button className="btn btn-primary" onClick={resetApp}>
                    Start Over
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-content">
          <p>&copy; 2024 LogoVision Pro. Powered by AI Technology.</p>
          <div className="footer-links">
            <a href="#privacy">Privacy Policy</a>
            <a href="#terms">Terms of Service</a>
            <a href="#support">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
