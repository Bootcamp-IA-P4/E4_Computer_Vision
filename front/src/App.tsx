import React, { useState, useEffect } from 'react';
import './App.css';
import MediaUpload from './components/MediaUpload/MediaUpload';
import LogoSelector from './components/LogoSelector/LogoSelector';
import ProgressBar from './components/UI/ProgressBar/ProgressBar';
import ProcessingStatus from './components/ProcessingStatus/ProcessingStatus';
import ResultsDisplay from './components/ResultsDisplay/ResultsDisplay';
import { MediaFile, Logo } from './types';
import { ProcessingResult, apiService } from './services/api';
import { SimplePDFGenerator } from './components/PDFReport/SimplePDFGenerator';
import { AdvancedPDFGenerator } from './components/PDFReport/AdvancedPDFGenerator';

function App() {
  const [currentStep, setCurrentStep] = useState<'upload' | 'select' | 'process' | 'results'>('upload');
  const [selectedMedia, setSelectedMedia] = useState<MediaFile[]>([]);
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

  const handleMediaUpload = (media: MediaFile[]) => {
    setSelectedMedia(media);
    setCurrentStep('select');
  };

  const handleLogoSelection = async (logos: Logo[]) => {
    console.log('🎯 App: handleLogoSelection called with logos:', logos);
    console.log('🎯 App: Microsoft in selected logos:', logos.find(logo => logo.name.toLowerCase().includes('microsoft')));
    
    setSelectedLogos(logos);
    setCurrentStep('process');
    
    // Start processing all uploaded videos
    const uploadedMedia = selectedMedia.filter(media => media.status === 'uploaded' && media.sessionId);
    
    if (uploadedMedia.length === 0) {
      setProcessingError('No uploaded videos found for processing');
      return;
    }

    console.log(`🚀 Starting processing for ${uploadedMedia.length} videos`);
    
    // Start processing the first video
    const firstVideo = uploadedMedia[0];
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
      const uploadedMedia = selectedMedia.filter(media => media.status === 'uploaded' && media.sessionId);
      const nextIndex = currentProcessingIndex + 1;
      
      console.log(`🎯 App: Processing status - currentIndex: ${currentProcessingIndex}, nextIndex: ${nextIndex}, totalVideos: ${uploadedMedia.length}`);
      
      if (nextIndex < uploadedMedia.length) {
        // Process next video
        const nextVideo = uploadedMedia[nextIndex];
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
          console.log(`🚀 Starting processing for next video (${nextIndex + 1}/${uploadedMedia.length}):`, nextVideo.sessionId);
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
    setSelectedMedia([]);
    setSelectedLogos([]);
    setProcessingProgress(0);
    setCurrentSessionId(null);
    setProcessingResults([]);
    setProcessingError(null);
    setCurrentProcessingIndex(0);
  };

  const handleDownloadReport = async () => {
    if (processingResults.length === 0) return;
    
    try {
      // Показываем индикатор загрузки
      console.log('📊 Generating report...');
      
      // Загружаем дополнительные данные для каждого файла
      const enrichedResults = await Promise.all(
        processingResults.map(async (result) => {
          try {
            // Загружаем predictions и temporal analytics для каждого файла
            const [predictionsResponse, detectionsResponse] = await Promise.all([
              apiService.getPredictions(result.file_id).catch(() => ({ predictions: [], file_info: null })),
              apiService.getDetections(result.file_id).catch(() => ({ detections: [] }))
            ]);
            
            return {
              ...result,
              predictions: predictionsResponse.predictions || [],
              temporal_analytics: predictionsResponse.predictions || [], // Используем predictions как temporal data
              detections: detectionsResponse.detections || result.detections || [],
              file_info: predictionsResponse.file_info
            };
          } catch (error) {
            console.warn(`Failed to load additional data for file ${result.file_id}:`, error);
            return result;
          }
        })
      );
      
      // Предлагаем пользователю выбор формата
      const formatChoice = window.confirm(
        'Выберите формат отчета:\n\n' +
        'OK - Настоящий PDF файл (рекомендуется)\n' +
        'Отмена - HTML отчет для печати'
      );
      
      if (formatChoice) {
        // Генерируем настоящий PDF
        const reportData = AdvancedPDFGenerator.createReportData(enrichedResults, currentSessionId || undefined);
        const pdfGenerator = AdvancedPDFGenerator.getInstance();
        await pdfGenerator.generatePDFReport(reportData);
        console.log('✅ PDF report generated successfully');
      } else {
        // Генерируем HTML отчет
        const reportData = SimplePDFGenerator.createReportData(enrichedResults, currentSessionId || undefined);
        const htmlGenerator = SimplePDFGenerator.getInstance();
        
        // Предлагаем выбор: открыть для печати или скачать HTML
        const htmlChoice = window.confirm(
          'Выберите действие с HTML отчетом:\n\n' +
          'OK - Открыть для печати (можно сохранить как PDF)\n' +
          'Отмена - Скачать HTML файл'
        );
        
        if (htmlChoice) {
          htmlGenerator.openReportForPrint(reportData);
        } else {
          htmlGenerator.downloadHTMLReport(reportData);
        }
        console.log('✅ HTML report generated successfully');
      }
      
    } catch (error) {
      console.error('❌ Error generating report:', error);
      alert(`Ошибка при генерации отчета: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    }
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
                <h2>Media Upload</h2>
                <p className="step-description italic-text">
                  Upload video or image files to analyze logos
                </p>
              </div>
              <MediaUpload onMediaUpload={handleMediaUpload} />
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
                <h2>Processing Media</h2>
                <p className="step-description">
                  AI is analyzing your media file{selectedMedia.length > 1 ? 's' : ''} for logo detection
                  {selectedMedia.length > 1 && (
                    <span className="processing-progress">
                      (File {currentProcessingIndex + 1} of {selectedMedia.filter(v => v.status === 'uploaded').length})
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
                      <h3>{index + 1} Results</h3>
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
                    {/* Download Report button hidden but functionality preserved */}
                    {/* <button className="btn btn-secondary" onClick={handleDownloadReport}>
                      {processingResults.length > 1 ? 'Download All Reports' : 'Download Report'}
                    </button> */}
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
