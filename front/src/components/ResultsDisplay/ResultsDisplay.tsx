import React, { useState, useEffect } from 'react';
import './ResultsDisplay.css';
import { ProcessingResult, DetectionRecord, apiService } from '../../services/api';
import VideoPlayer from '../VideoPlayer/VideoPlayer';
import BrandLogo from '../BrandLogo/BrandLogo';
import TemporalAnalytics from '../TemporalAnalytics/TemporalAnalytics';
import { Logo } from '../../types';

interface ResultsDisplayProps {
  result: ProcessingResult;
  selectedLogos?: Logo[];
  onToggleBrand?: (brandName: string) => void;
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ result, selectedLogos = [], onToggleBrand }) => {
  const [detections, setDetections] = useState<DetectionRecord[]>([]);
  const [loadingDetections, setLoadingDetections] = useState(false);
  const [isFramesExpanded, setIsFramesExpanded] = useState(false);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [loadingPredictions, setLoadingPredictions] = useState(false);

  console.log('🎨 ResultsDisplay render with result:', result);
  console.log('🎨 ResultsDisplay - result.detections_count:', result.detections_count);
  console.log('🎨 ResultsDisplay - result.brands_detected:', result.brands_detected);
  console.log('🎨 ResultsDisplay - result.statistics:', result.statistics);
  console.log('🎨 ResultsDisplay - selectedLogos:', selectedLogos);
  
  // Debug statistics for each brand
  if (result.statistics) {
    Object.entries(result.statistics).forEach(([brand, stats]) => {
      console.log(`🎨 Statistics for ${brand}:`, {
        avg_score: stats.avg_score,
        max_score: stats.max_score,
        total_detections: stats.total_detections,
        duration_seconds: stats.duration_seconds,
        total_seconds: stats.total_seconds,
        percentage: stats.percentage
      });
    });
  }

  // Load detailed detections and predictions when component mounts
  useEffect(() => {
    const loadData = async () => {
      if (!result.file_id) return;
      
      // Load detections
      setLoadingDetections(true);
      try {
        console.log('🔍 Loading detections for file_id:', result.file_id);
        const detectionsResponse = await apiService.getDetections(result.file_id);
        setDetections(detectionsResponse.detections);
        console.log('✅ Loaded detections:', detectionsResponse.detections);
        console.log('📊 Total detections loaded:', detectionsResponse.detections.length);
        
        // Debug: show first few detections in detail
        if (detectionsResponse.detections.length > 0) {
          console.log('🔍 First detection sample:', detectionsResponse.detections[0]);
          console.log('🖼️ Frame capture URLs available:', {
            frame_capture_url: (detectionsResponse.detections[0] as any).frame_capture_url,
            frame_capture_path: (detectionsResponse.detections[0] as any).frame_capture_path,
            frame_number: (detectionsResponse.detections[0] as any).frame_number
          });
          console.log('📐 Bounding box info:', {
            bbox: detectionsResponse.detections[0].bbox,
            calculated_percentages: {
              left: `${(detectionsResponse.detections[0].bbox[0] / 1920) * 100}%`,
              top: `${(detectionsResponse.detections[0].bbox[1] / 1080) * 100}%`,
              width: `${((detectionsResponse.detections[0].bbox[2] - detectionsResponse.detections[0].bbox[0]) / 1920) * 100}%`,
              height: `${((detectionsResponse.detections[0].bbox[3] - detectionsResponse.detections[0].bbox[1]) / 1080) * 100}%`
            }
          });
        }
        
        // Debug: show detections by brand
        const detectionsByBrand = detectionsResponse.detections.reduce((acc: any, detection: any) => {
          // Try to get brand name from detection - API returns brand_name directly
          let brand = detection.brand_name || detection.brands?.name;
          
          if (!brand && detection.brand_id) {
            // If we have brand_id but no name, try to match with result.brands_detected
            const brandIndex = detection.brand_id - 1; // Assuming brand_id starts from 1
            if (brandIndex >= 0 && brandIndex < result.brands_detected.length) {
              brand = result.brands_detected[brandIndex];
            }
          }
          brand = brand || 'Unknown';
          acc[brand] = (acc[brand] || 0) + 1;
          return acc;
        }, {});
        console.log('📈 Detections by brand:', detectionsByBrand);
        console.log('📊 Available brands from result:', result.brands_detected);
      } catch (error) {
        console.error('❌ Error loading detections:', error);
      } finally {
        setLoadingDetections(false);
      }

      // Load predictions (statistics from database)
      setLoadingPredictions(true);
      try {
        console.log('🔍 Loading predictions for file_id:', result.file_id);
        const predictionsResponse = await apiService.getPredictions(result.file_id);
        setPredictions(predictionsResponse.predictions);
        console.log('✅ Loaded predictions:', predictionsResponse.predictions);
        console.log('📊 Predictions data structure:', predictionsResponse.predictions.map(p => ({
          id: p.id,
          brand_name: p.brands?.name,
          total_detections: p.total_detections,
          duration_seconds: p.duration_seconds,
          total_seconds: p.total_seconds,
          avg_score: p.avg_score,
          max_score: p.max_score,
          all_fields: Object.keys(p)
        })));
      } catch (error) {
        console.error('❌ Error loading predictions:', error);
      } finally {
        setLoadingPredictions(false);
      }
    };

    loadData();
  }, [result.file_id]);
  
  const formatDuration = (seconds: number): string => {
    return `${seconds.toFixed(2)}s`;
  };

  const formatConfidence = (confidence: number): string => {
    return `${(confidence * 100).toFixed(1)}%`;
  };

  // Filter functions for selected logos
  const getSelectedLogoNames = (): string[] => {
    return selectedLogos.map(logo => logo.name);
  };

  // More precise brand name matching
  const isBrandSelected = (brandName: string): boolean => {
    if (!selectedLogos.length) return true;
    
    return selectedLogos.some(logo => {
      const selectedName = logo.name.toLowerCase().trim();
      const detectedName = brandName.toLowerCase().trim();
      
      // Exact match
      if (selectedName === detectedName) return true;
      
      // If selected name is longer and contains the detected name
      // This handles cases like "Factoria F5" (selected) matching "Factoria" (detected)
      if (selectedName.length > detectedName.length && selectedName.includes(detectedName)) {
        // Make sure it's a word boundary match, not just substring
        const words = selectedName.split(/\s+/);
        // Only match the first word of the selected name
        return words.length > 0 && words[0] === detectedName;
      }
      
      return false;
    });
  };

  // Toggle brand selection
  const toggleBrandSelection = (brandName: string) => {
    if (onToggleBrand) {
      onToggleBrand(brandName);
    }
  };

  // Frame slider navigation
  const nextFrame = () => {
    const filteredDetections = detections.filter(detection => {
      let detectionBrand = (detection as any).brand_name || detection.brands?.name;
      if (!detectionBrand && detection.brand_id) {
        const brandIndex = detection.brand_id - 1;
        if (brandIndex >= 0 && brandIndex < result.brands_detected.length) {
          detectionBrand = result.brands_detected[brandIndex];
        }
      }
      return selectedLogos.length === 0 || selectedLogos.some(logo => 
        isBrandSelected(detectionBrand || '')
      );
    });
    
    if (currentFrameIndex < filteredDetections.length - 1) {
      setCurrentFrameIndex(currentFrameIndex + 1);
    }
  };

  const prevFrame = () => {
    if (currentFrameIndex > 0) {
      setCurrentFrameIndex(currentFrameIndex - 1);
    }
  };

  const filterStatisticsBySelectedLogos = (statistics: any) => {
    if (!selectedLogos.length) return statistics;
    
    const filteredStats: any = {};
    
    Object.entries(statistics).forEach(([brandName, stats]: [string, any]) => {
      if (isBrandSelected(brandName)) {
        filteredStats[brandName] = stats;
      }
    });
    
    return filteredStats;
  };

  const filterDetectionsBySelectedLogos = (detections: DetectionRecord[]): DetectionRecord[] => {
    if (!selectedLogos.length) return detections;
    
    const filtered = detections.filter(detection => {
      // Get brand name with fallback logic - API returns brand_name directly
      let brandName = (detection as any).brand_name || detection.brands?.name;
      if (!brandName && detection.brand_id) {
        const brandIndex = detection.brand_id - 1;
        if (brandIndex >= 0 && brandIndex < result.brands_detected.length) {
          brandName = result.brands_detected[brandIndex];
        }
      }
      return isBrandSelected(brandName || '');
    });
    
    console.log('🔍 Filtering detections:', {
      total: detections.length,
      filtered: filtered.length,
      selectedLogos: getSelectedLogoNames(),
      detectionsByBrand: detections.reduce((acc: any, detection: any) => {
        let brand = detection.brands?.name;
        if (!brand && detection.brand_id) {
          const brandIndex = detection.brand_id - 1;
          if (brandIndex >= 0 && brandIndex < result.brands_detected.length) {
            brand = result.brands_detected[brandIndex];
          }
        }
        brand = brand || 'Unknown';
        acc[brand] = (acc[brand] || 0) + 1;
        return acc;
      }, {})
    });
    
    return filtered;
  };

  // Debug selected logos after functions are defined
  console.log('🎨 ResultsDisplay - selectedLogoNames:', getSelectedLogoNames());
  console.log('🎨 ResultsDisplay - available brands:', result.brands_detected);
  
  // Test each available brand against selected logos
  const brandMatchingResults = result.brands_detected.map(brand => ({
    brand,
    isSelected: isBrandSelected(brand),
    selectedLogos: selectedLogos.map(logo => {
      const selectedName = logo.name.toLowerCase().trim();
      const detectedName = brand.toLowerCase().trim();
      const words = selectedName.split(/\s+/);
      
      return {
      name: logo.name,
        exactMatch: selectedName === detectedName,
        firstWordMatch: selectedName.length > detectedName.length && selectedName.includes(detectedName) && words.length > 0 && words[0] === detectedName,
        finalMatch: isBrandSelected(brand)
      };
    })
  }));
  
  console.log('🎨 ResultsDisplay - brand matching results:', brandMatchingResults);

  return (
    <>


            {/* Main Content - Full Width Video */}
      <div className="dashboard-content">
        {/* Video Analysis - Full Width */}
        <div className="analysis-card">
          <h3 className="card-title">
            <span className="card-icon">📹</span>
            Video Analysis
          </h3>
          
      {(result.video_url || result.image_url) && (
          <div className="media-container">
            {result.video_url ? (
              <div className="video-preview-section">
                {loadingDetections ? (
                  <div className="loading-detections">
                    <div className="loading-spinner"></div>
                    <p>Loading detection data...</p>
                  </div>
                ) : (
                  <VideoPlayer 
                    videoUrl={result.video_url}
                    detections={filterDetectionsBySelectedLogos(detections)}
                    onTimeUpdate={(currentTime) => {
                      console.log('Video time:', currentTime);
                    }}
                  />
                )}
              </div>
            ) : (
              <img 
                src={result.image_url} 
                alt="Processed image" 
                className="media-image"
              />
            )}
          </div>
          )}
        </div>

        {/* Detected Brands - Below Video */}
        <div className="brands-card">
          <h3 className="card-title">
            <span className="card-icon">🏷️</span>
            Detected Brands
          </h3>
          
      {result.brands_detected.length > 0 && (
            <div className="brands-list">
            {result.brands_detected
              .filter(brand => isBrandSelected(brand))
                .map((brand, index) => {
                  const stats = result.statistics?.[brand];
                  const avgScore = stats?.avg_score || 0;
                  const maxScore = stats?.max_score || 0;
                  
                  return (
                    <div key={index} className="brand-item">
                      <div className="brand-icon">
                        <span>{brand.charAt(0).toUpperCase()}</span>
                      </div>
                      <div className="brand-details">
                        <div className="brand-name">{brand}</div>
                        <div className="brand-stats">
                          Average: {(avgScore * 100).toFixed(1)}% | Max: {(maxScore * 100).toFixed(1)}%
                        </div>
                </div>
                      <div className="brand-actions">
                        <button
                          className={`brand-toggle ${isBrandSelected(brand) ? 'selected' : ''}`}
                          onClick={() => toggleBrandSelection(brand)}
                        >
                          {isBrandSelected(brand) ? '✓' : '+'}
                        </button>
                </div>
              </div>
                  );
                })}
          </div>
          )}
        </div>
      </div>

      {/* Detailed Statistics */}
      {predictions.length > 0 && (
        <div className="statistics-section">
          <h3>📊 Detailed Statistics</h3>
          <div className="statistics-table">
            <div className="table-header">
              <div className="col-brand">Brand</div>
              <div className="col-detections">Detections</div>
              <div className="col-avg-score">Avg Score</div>
              <div className="col-max-score">Max Score</div>
              <div className="col-duration">Duration (s)</div>
            </div>
            {predictions
              .filter(prediction => {
                if (!selectedLogos.length) return true;
                const brandName = prediction.brands?.name || '';
                return selectedLogos.some(logo => isBrandSelected(brandName));
              })
              .map((prediction: any) => (
                <div key={prediction.id} className="table-row">
                  <div className="col-brand">{prediction.brands?.name || 'Unknown'}</div>
                  <div className="col-detections">{prediction.total_detections || 0}</div>
                  <div className="col-avg-score">{formatConfidence(prediction.avg_score || 0)}</div>
                  <div className="col-max-score">{formatConfidence(prediction.max_score || 0)}</div>
                <div className="col-duration">
                    {prediction.duration_seconds ? formatDuration(prediction.duration_seconds) : 
                     prediction.total_seconds ? formatDuration(prediction.total_seconds) : 'N/A'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Individual Detections */}
      {result.detections && result.detections.length > 0 && (
        <div className="detections-section">
          <h3>🔍 Individual Detections</h3>
          <div className="detections-grid">
            {result.detections.map((detection, index) => (
              <div key={index} className="detection-card">
                <div className="detection-header">
                  <span className="detection-brand">{detection.class_name}</span>
                  <span className="detection-confidence">
                    {formatConfidence(detection.confidence)}
                  </span>
                </div>
                <div className="detection-details">
                  <div className="detection-bbox">
                    <span>Position: [{detection.bbox.map(b => Math.round(b)).join(', ')}]</span>
                  </div>
                  {detection.frame_number !== undefined && (
                    <div className="detection-frame">
                      <span>Frame: {detection.frame_number}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Frame Captures Section */}
      {detections.length > 0 && (
        <div className="frame-captures-section">
          <div className="frame-captures-header">
            <h3>Frame Captures with Detected Brands</h3>
          </div>

          <div className="frame-slider">
            <button 
              className="slider-btn prev-btn" 
              onClick={prevFrame}
              disabled={currentFrameIndex === 0}
            >
              ‹
            </button>
            
            <div className="frame-slider-container">
              {detections
                .filter(detection => {
                  let detectionBrand = (detection as any).brand_name || detection.brands?.name;
                  if (!detectionBrand && detection.brand_id) {
                    const brandIndex = detection.brand_id - 1;
                    if (brandIndex >= 0 && brandIndex < result.brands_detected.length) {
                      detectionBrand = result.brands_detected[brandIndex];
                    }
                  }
                  return selectedLogos.length === 0 || selectedLogos.some(logo => 
                    isBrandSelected(detectionBrand || '')
                  );
                })
                .slice(currentFrameIndex, currentFrameIndex + 5)
                .map((detection, index) => {
                  let detectionBrand = (detection as any).brand_name || detection.brands?.name;
                  if (!detectionBrand && detection.brand_id) {
                    const brandIndex = detection.brand_id - 1;
                    if (brandIndex >= 0 && brandIndex < result.brands_detected.length) {
                      detectionBrand = result.brands_detected[brandIndex];
                    }
                  }
                  
                  return (
                    <div key={index} className="frame-slide">
                      <div className="frame-card">
                        <div className="frame-confidence-badge">
                          {formatConfidence(detection.score)}
                        </div>
                        <div className="frame-image-container">
                          {(detection as any).frame_capture_url ? (
                            <>
                              <img
                                src={(detection as any).frame_capture_url}
                                alt={`Frame ${detection.frame} - ${detectionBrand}`}
                                className="frame-slide-image"
                                onLoad={(e) => {
                                  const img = e.currentTarget;
                                  const container = img.parentElement;
                                  if (container) {
                                    const overlay = container.querySelector('.frame-bbox-overlay') as HTMLElement;
                                    if (overlay) {
                                      const imgWidth = img.naturalWidth || 1920;
                                      const imgHeight = img.naturalHeight || 1080;
                                      
                                      // Get the actual displayed image dimensions
                                      const containerWidth = container.clientWidth;
                                      const containerHeight = container.clientHeight;
                                      
                                      // Calculate the actual image size within the container (with object-fit: contain)
                                      const imgAspectRatio = imgWidth / imgHeight;
                                      const containerAspectRatio = containerWidth / containerHeight;
                                      
                                      let actualImgWidth, actualImgHeight, offsetX, offsetY;
                                      
                                      if (imgAspectRatio > containerAspectRatio) {
                                        // Image is wider than container
                                        actualImgWidth = containerWidth;
                                        actualImgHeight = containerWidth / imgAspectRatio;
                                        offsetX = 0;
                                        offsetY = (containerHeight - actualImgHeight) / 2;
                                      } else {
                                        // Image is taller than container
                                        actualImgHeight = containerHeight;
                                        actualImgWidth = containerHeight * imgAspectRatio;
                                        offsetX = (containerWidth - actualImgWidth) / 2;
                                        offsetY = 0;
                                      }
                                      
                                      // Calculate bbox position relative to the actual displayed image
                                      const bboxLeft = (detection.bbox[0] / imgWidth) * actualImgWidth + offsetX;
                                      const bboxTop = (detection.bbox[1] / imgHeight) * actualImgHeight + offsetY;
                                      const bboxWidth = ((detection.bbox[2] - detection.bbox[0]) / imgWidth) * actualImgWidth;
                                      const bboxHeight = ((detection.bbox[3] - detection.bbox[1]) / imgHeight) * actualImgHeight;
                                      
                                      // Set overlay position and size
                                      overlay.style.left = `${bboxLeft}px`;
                                      overlay.style.top = `${bboxTop}px`;
                                      overlay.style.width = `${bboxWidth}px`;
                                      overlay.style.height = `${bboxHeight}px`;
                                    }
                                  }
                                }}
                              />
                              <div 
                                className="frame-bbox-overlay"
                                style={{
                                  left: '0px',
                                  top: '0px',
                                  width: '0px',
                                  height: '0px'
                                }}
                              ></div>
                            </>
                          ) : (
                            <div className="frame-placeholder">
                              <span>📷</span>
                            </div>
                          )}
                        </div>
                        <div className="frame-info">
                          <div className="frame-number">Frame {detection.frame}</div>
                          <div className="frame-brand">{detectionBrand}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
          </div>
            
            <button 
              className="slider-btn next-btn" 
              onClick={nextFrame}
              disabled={currentFrameIndex >= detections.filter(detection => {
                let detectionBrand = (detection as any).brand_name || detection.brands?.name;
                if (!detectionBrand && detection.brand_id) {
                  const brandIndex = detection.brand_id - 1;
                  if (brandIndex >= 0 && brandIndex < result.brands_detected.length) {
                    detectionBrand = result.brands_detected[brandIndex];
                  }
                }
                return selectedLogos.length === 0 || selectedLogos.some(logo => 
                  isBrandSelected(detectionBrand || '')
                );
              }).length - 5}
            >
              ›
            </button>
          </div>
        </div>
      )}

      {/* Temporal Analytics Section */}
      {detections.length > 0 && (
        <TemporalAnalytics 
          detections={detections}
          brandsDetected={result.brands_detected}
          videoDuration={undefined}
        />
      )}
    </>
  );
};

export default ResultsDisplay;
