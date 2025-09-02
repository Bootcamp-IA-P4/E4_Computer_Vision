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
  const [processingResult, setProcessingResult] = useState<ProcessingResult | null>(null);
  const [processingError, setProcessingError] = useState<string | null>(null);
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

  const handleVideoUpload = (videos: VideoFile[]) => {
    setSelectedVideos(videos);
    setCurrentStep('select');
  };

  const handleLogoSelection = async (logos: Logo[]) => {
    setSelectedLogos(logos);
    setCurrentStep('process');
    
    // Get session ID from the first uploaded video
    const firstVideo = selectedVideos[0];
    if (firstVideo?.sessionId) {
      setCurrentSessionId(firstVideo.sessionId);
      
      // Start processing after logo selection
      try {
        console.log('🚀 Starting processing for session:', firstVideo.sessionId);
        await apiService.startProcessing(firstVideo.sessionId);
        console.log('✅ Processing started successfully');
      } catch (error) {
        console.error('❌ Failed to start processing:', error);
        setProcessingError(error instanceof Error ? error.message : 'Failed to start processing');
      }
    } else {
      setProcessingError('No session ID found for processing');
    }
  };

  const handleProcessingComplete = (result: ProcessingResult) => {
    setProcessingResult(result);
    setCurrentStep('results');
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
    setProcessingResult(null);
    setProcessingError(null);
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
        
        <div className="feature-badge">
          <span className="badge-icon"></span>
          <span className="badge-text">LOREM IPSUM</span>
        </div>
        
        <h1 className="app-title">LogoVision Pro</h1>
        <p className="app-subtitle">Advanced AI-powered logo detection and analysis platform</p>
        
        <div className="hero-stats">
          <div className="stat-item">
            <div className="stat-number">99.8%</div>
            <div className="stat-label">Accuracy</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">50+</div>
            <div className="stat-label">Logo Types</div>
          </div>
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
                  AI is analyzing your video for logo detection
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
                  {processingError ? 'Processing encountered an error' : 'Your video has been analyzed successfully'}
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
              ) : processingResult ? (
                <div className="results-container">
                  <ResultsDisplay 
                    result={processingResult} 
                    selectedLogos={selectedLogos} 
                    onToggleBrand={handleToggleBrand}
                  />
                  <div className="action-buttons">
                    <button className="btn btn-primary" onClick={resetApp}>
                      Analyze Another Video
                    </button>
                    <button className="btn btn-secondary">
                      Download Report
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
