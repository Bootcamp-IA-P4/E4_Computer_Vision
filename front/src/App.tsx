import React, { useState } from 'react';
import './App.css';
import VideoUpload from './components/VideoUpload/VideoUpload';
import LogoSelector from './components/LogoSelector/LogoSelector';
import ProgressBar from './components/UI/ProgressBar/ProgressBar';
import { VideoFile, Logo } from './types';

function App() {
  const [currentStep, setCurrentStep] = useState<'upload' | 'select' | 'process' | 'results'>('upload');
  const [selectedVideos, setSelectedVideos] = useState<VideoFile[]>([]);
  const [selectedLogos, setSelectedLogos] = useState<Logo[]>([]);
  const [processingProgress, setProcessingProgress] = useState(0);

  const handleVideoUpload = (videos: VideoFile[]) => {
    setSelectedVideos(videos);
    setCurrentStep('select');
  };

  const handleLogoSelection = (logos: Logo[]) => {
    setSelectedLogos(logos);
    setCurrentStep('process');
    
    // Simulate processing
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setCurrentStep('results');
      }
      setProcessingProgress(progress);
    }, 200);
  };

  const resetApp = () => {
    setCurrentStep('upload');
    setSelectedVideos([]);
    setSelectedLogos([]);
    setProcessingProgress(0);
  };

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
        {currentStep === 'process' && (
          <div className="step-content">
            <div className="step-section">
              <div className="step-header">
                <div className="step-number">3</div>
                <h2>Processing Video</h2>
                <p className="step-description">
                  AI is analyzing your video for logo detection
                </p>
              </div>
              
              <div className="processing-status">
                <div className="video-info">
                  <h3>Video Information</h3>
                  <p><strong>Total Files:</strong> {selectedVideos.length}</p>
                  <p><strong>Total Size:</strong> {selectedVideos.reduce((total, video) => total + video.size, 0) / 1024 / 1024} MB</p>
                  <p><strong>Files:</strong></p>
                  <ul className="video-files-list">
                    {selectedVideos.map((video, index) => (
                      <li key={video.id}>
                        {index + 1}. {video.name} ({(video.size / 1024 / 1024).toFixed(2)} MB)
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="process-info">
                  <h3>Processing Progress</h3>
                  <ProgressBar progress={processingProgress} />
                  <p>Analyzing {selectedLogos.length} selected logos...</p>
                </div>
              </div>
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
                  Your video has been analyzed successfully
                </p>
              </div>
              
              <div className="results-summary">
                <div className="summary-stats">
                  <div className="stat-card">
                    <div className="stat-icon"></div>
                    <div className="stat-number">12</div>
                    <div className="stat-label">Logos Found</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon"></div>
                    <div className="stat-number">2.3s</div>
                    <div className="stat-label">Processing Time</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon"></div>
                    <div className="stat-number">98.5%</div>
                    <div className="stat-label">Accuracy</div>
                  </div>
                </div>
                
                <div className="detected-logos">
                  <h3>Detected Logos</h3>
                  <div className="logo-results">
                    {selectedLogos.map(logo => (
                      <div key={logo.id} className="result-logo">
                        <span className="logo-name">{logo.name}</span>
                        <span className="detection-count">3 instances</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="recommendations">
                  <h3>Recommendations</h3>
                  <ul>
                    <li>High-quality logos detected with confidence</li>
                    <li>Consider optimizing video resolution for better results</li>
                    <li>Multiple logo instances found throughout the video</li>
                  </ul>
                </div>
                
                <div className="action-buttons">
                  <button className="btn btn-primary" onClick={resetApp}>
                    Analyze Another Video
                  </button>
                  <button className="btn btn-secondary">
                    Download Report
                  </button>
                </div>
              </div>
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
