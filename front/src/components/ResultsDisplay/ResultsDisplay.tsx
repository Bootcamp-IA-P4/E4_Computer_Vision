import React, { useState, useEffect, useRef } from 'react';
import './ResultsDisplay.css';
import { ProcessingResult, DetectionRecord, apiService } from '../../services/api';
import VideoPlayer from '../VideoPlayer/VideoPlayer';
import BrandLogo from '../BrandLogo/BrandLogo';
import TemporalAnalytics from '../TemporalAnalytics/TemporalAnalytics';
import ImageModal from '../UI/ImageModal/ImageModal';

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

  const [predictions, setPredictions] = useState<any[]>([]);
  const [loadingPredictions, setLoadingPredictions] = useState(false);
  const [fileInfo, setFileInfo] = useState<{ duration_seconds?: number; fps?: number } | null>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalImage, setModalImage] = useState<DetectionRecord | null>(null);
  const [currentModalIndex, setCurrentModalIndex] = useState(0);

  // Log fileInfo changes
  useEffect(() => {
    if (fileInfo) {
      console.log('🎬 Video duration from fileInfo:', fileInfo.duration_seconds);
    }
  }, [fileInfo]);

  // Log detections changes
  useEffect(() => {
    console.log('🔍 Frame Captures - detections.length:', detections.length);
  }, [detections]);

  // Log brands condition check
  useEffect(() => {
    console.log('🔍 Brands condition check:', {
      brands_detected: result.brands_detected,
      length: result.brands_detected?.length || 0,
      condition: (result.brands_detected?.length || 0) > 0
    });
  }, [result.brands_detected]);

  // Log frame captures condition check
  useEffect(() => {
    console.log('🔍 Frame Captures condition check:', {
      detections: detections,
      length: detections.length,
      condition: detections.length > 0
    });
  }, [detections]);

  console.log('🎨 ResultsDisplay render with result:', result);
  console.log('🎨 ResultsDisplay - result.detections_count:', result.detections_count);
  console.log('🎨 ResultsDisplay - result.brands_detected:', result.brands_detected);
  console.log('🎨 ResultsDisplay - result.brands_detected.length:', result.brands_detected?.length || 0);
  console.log('🎨 ResultsDisplay - result.statistics:', result.statistics);
  console.log('🎨 ResultsDisplay - selectedLogos:', selectedLogos);
  console.log('🎨 ResultsDisplay - selectedLogos.length:', selectedLogos.length);
  
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
      
      // Removed slider reset code
      
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
          console.log('🔍 Last detection sample:', detectionsResponse.detections[detectionsResponse.detections.length - 1]);
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
        
        // Store file info for duration
        if (predictionsResponse.file_info) {
          setFileInfo(predictionsResponse.file_info);
        }
        
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

  const getScoreQuality = (score: number) => {
    if (score >= 0.8) return 'high';
    if (score >= 0.6) return 'medium';
    return 'low';
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
      
      // Reverse match: if detected name is longer and contains the selected name
      // This handles cases like "Microsoft" (selected) matching "microsoft" (detected)
      if (detectedName.length > selectedName.length && detectedName.includes(selectedName)) {
        const words = detectedName.split(/\s+/);
        return words.length > 0 && words[0] === selectedName;
      }
      
      // Additional flexible matching for common variations
      const normalizeName = (name: string) => {
        return name.replace(/[^a-z0-9]/g, ''); // Remove all non-alphanumeric characters
      };
      
      const normalizedSelected = normalizeName(selectedName);
      const normalizedDetected = normalizeName(detectedName);
      
      if (normalizedSelected === normalizedDetected) return true;
      
      return false;
    });
  };

  // Toggle brand selection
  const toggleBrandSelection = (brandName: string) => {
    if (onToggleBrand) {
      onToggleBrand(brandName);
    }
  };



  // Alternative approach using transform
  // Removed slider navigation state
  
  // Removed nextFrameTransform function
  
  // Removed all slider navigation functions

  // Modal functions
  const openModal = (detection: DetectionRecord) => {
    console.log('🖼️ Opening modal for detection:', detection);
    setModalImage(detection);
    
    // Calculate current index in filtered detections
    const filteredDetections = detections.filter(det => {
      let detectionBrand = (det as any).brand_name || det.brands?.name;
      if (!detectionBrand && det.brand_id) {
        const brandIndex = det.brand_id - 1;
        if (brandIndex >= 0 && brandIndex < result.brands_detected.length) {
          detectionBrand = result.brands_detected[brandIndex];
        }
      }
      return selectedLogos.length === 0 || selectedLogos.some(logo => 
        isBrandSelected(detectionBrand || '')
      );
    });
    
    const currentIndex = filteredDetections.findIndex(det => det.id === detection.id);
    setCurrentModalIndex(currentIndex);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    console.log('🖼️ Closing modal');
    setIsModalOpen(false);
    setModalImage(null);
    setCurrentModalIndex(0);
  };

  const navigateModal = (direction: 'prev' | 'next') => {
    console.log('🖼️ Modal navigation:', direction);
    
    // Get filtered detections for navigation
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

    if (filteredDetections.length === 0) return;

    let newIndex = currentModalIndex;
    if (direction === 'next') {
      newIndex = (currentModalIndex + 1) % filteredDetections.length;
    } else {
      newIndex = currentModalIndex === 0 ? filteredDetections.length - 1 : currentModalIndex - 1;
    }

    setCurrentModalIndex(newIndex);
    setModalImage(filteredDetections[newIndex]);
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
      
      const isSelected = isBrandSelected(brandName || '');
      
      // Специальная отладка для Microsoft
      if (brandName && brandName.toLowerCase().includes('microsoft')) {
        console.log('🔍 MICROSOFT FILTER DEBUG:', {
          detectionId: detection.id,
          brandName: brandName,
          isSelected: isSelected,
          selectedLogos: getSelectedLogoNames(),
          detection: detection
        });
      }
      
      return isSelected;
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
  
  // Debug: Check what brands are actually detected vs selected
  console.log('🔍 DEBUG - Selected logos:', selectedLogos.map(logo => logo.name));
  console.log('🔍 DEBUG - Available brands:', result.brands_detected);
  console.log('🔍 DEBUG - All detections brands:', detections.map(d => {
    let brand = (d as any).brand_name || d.brands?.name;
    if (!brand && d.brand_id) {
      const brandIndex = d.brand_id - 1;
      if (brandIndex >= 0 && brandIndex < result.brands_detected.length) {
        brand = result.brands_detected[brandIndex];
      }
    }
    return brand;
  }).filter(Boolean));
  
  // Special debug for Microsoft
  const microsoftSelected = selectedLogos.find(logo => logo.name.toLowerCase().includes('microsoft'));
  const microsoftDetected = result.brands_detected?.find(brand => brand.toLowerCase().includes('microsoft'));
  const microsoftInDetections = detections.some(d => {
    let brand = (d as any).brand_name || d.brands?.name;
    if (!brand && d.brand_id) {
      const brandIndex = d.brand_id - 1;
      if (brandIndex >= 0 && brandIndex < result.brands_detected.length) {
        brand = result.brands_detected[brandIndex];
      }
    }
    return brand && brand.toLowerCase().includes('microsoft');
  });
  
  console.log('🔍 MICROSOFT DEBUG:', {
    selected: microsoftSelected,
    detected: microsoftDetected,
    inDetections: microsoftInDetections,
    isSelected: microsoftDetected ? isBrandSelected(microsoftDetected) : false
  });
  
  // Дополнительная отладка для Microsoft детекций
  const microsoftDetections = detections.filter(d => {
    let brand = (d as any).brand_name || d.brands?.name;
    if (!brand && d.brand_id) {
      const brandIndex = d.brand_id - 1;
      if (brandIndex >= 0 && brandIndex < result.brands_detected.length) {
        brand = result.brands_detected[brandIndex];
      }
    }
    return brand && brand.toLowerCase().includes('microsoft');
  });
  
  console.log('🔍 MICROSOFT DETECTIONS DEBUG:', microsoftDetections.map(d => ({
    id: d.id,
    brandName: (d as any).brand_name || d.brands?.name,
    t_start: d.t_start,
    t_end: d.t_end,
    frame: d.frame,
    score: d.score,
    bbox: d.bbox
  })));

  return (
    <>
      {/* Main Content - Full Width Video */}
      <div className="dashboard-content" data-file-id={result.file_id}>
        {/* Video Analysis - Full Width */}
        <div className="analysis-card">
          <h3 className="card-title universal-header">
            Analysis
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
          <h3 className="card-title universal-header">
            Detected Brands
          </h3>
          
      {result.brands_detected && result.brands_detected.length > 0 && (
            <div className="brands-list">
            {result.brands_detected
              .filter(brand => {
                const isSelected = isBrandSelected(brand);
                console.log(`🔍 Brand "${brand}" isSelected:`, isSelected);
                return isSelected;
              })
                .map((brand, index) => {
                  const stats = result.statistics?.[brand];
                  // Get logo path for the brand
                  const getLogoPath = (brandName: string) => {
                    const logoMap: { [key: string]: string } = {
                      'Factoria': '/logos/Factoria.jpeg',
                      'F5': '/logos/F5.jpg',
                      'SomosF5': '/logos/somos F5.jpeg',
                      'Microsoft': '/logos/Microsoft.jpeg',
                      'FemCoders': '/logos/fem coders.jpeg',
                      'fem coders': '/logos/fem coders.jpeg',
                      'Fundacion Orange': '/logos/Fundacion Orange.jpeg'
                    };
                    return logoMap[brandName] || null;
                  };

                  const logoPath = getLogoPath(brand);
                  
                  // Специальная отладка для FemCoders
                  if (brand.toLowerCase().includes('femcoders')) {
                    console.log('🎨 ResultsDisplay: FemCoders brand processing:', {
                      brand: brand,
                      logoPath: logoPath,
                      stats: stats
                    });
                  }
                  
                  return (
                    <div key={index} className="brand-item">
                      <div className="brand-icon">
                        {logoPath ? (
                          <img 
                            src={logoPath} 
                            alt={brand} 
                            className="brand-logo"
                          />
                        ) : (
                          <span>{brand.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                      <div className="brand-details">
                        <div className="brand-name">{brand}</div>
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
          <h3 className="universal-header">Detailed Statistics</h3>
          <div className="statistics-table">
                         <div className="table-header">
               <div className="col-brand">Brand</div>
               <div className="col-detections">Detections</div>
               <div className="col-visibility">Visibility</div>
               <div className="col-min-score">Min Score</div>
               <div className="col-avg-score">Avg Score</div>
               <div className="col-max-score">Max Score</div>
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
                   <div className="col-visibility">
                     {(() => {
                       const totalDuration = fileInfo?.duration_seconds || 0;
                       const brandDuration = prediction.duration_seconds || 0;
                       if (totalDuration > 0) {
                         const visibilityRatio = (brandDuration / totalDuration) * 100;
                         return `${visibilityRatio.toFixed(1)}%`;
                       }
                       return 'N/A';
                     })()}
                   </div>
                   <div className="col-min-score" data-score={getScoreQuality(prediction.min_score || 0)}>
                     {formatConfidence(prediction.min_score || 0)}
                   </div>
                   <div className="col-avg-score" data-score={getScoreQuality(prediction.avg_score || 0)}>
                     {formatConfidence(prediction.avg_score || 0)}
                   </div>
                   <div className="col-max-score" data-score={getScoreQuality(prediction.max_score || 0)}>
                     {formatConfidence(prediction.max_score || 0)}
                   </div>
                 </div>
            ))}
          </div>
        </div>
      )}


      {/* Frame Captures Section */}
      {detections.length > 0 && (
        <div className="frame-captures-section" data-file-id={result.file_id}>
          <div className="frame-captures-header">
            <h3 className="universal-header">Frame Captures with Detected Brands</h3>
          </div>

          <div style={{
            fontSize: '12px',
            color: '#666',
            marginBottom: '15px'
          }}>
            Total: {detections.filter(detection => {
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
            }).length} frames
          </div>

          <div className="frame-grid">
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

                .map((detection, index) => {
                  let detectionBrand = (detection as any).brand_name || detection.brands?.name;
                  if (!detectionBrand && detection.brand_id) {
                    const brandIndex = detection.brand_id - 1;
                    if (brandIndex >= 0 && brandIndex < result.brands_detected.length) {
                      detectionBrand = result.brands_detected[brandIndex];
                    }
                  }
                  
                  return (
                    <div key={index} className="frame-item">
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
                                onClick={() => openModal(detection)}
                                style={{ cursor: 'pointer' }}
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
        </div>
      )}

      {/* Temporal and Comparative Analytics Section */}
      {detections.length > 0 && (
        <TemporalAnalytics 
          detections={detections}
          brandsDetected={result.brands_detected}
          videoDuration={fileInfo?.duration_seconds || 0}
          videoFPS={fileInfo?.fps || 30}
        />
      )}

      {/* Image Modal */}
      {modalImage && (
        <ImageModal
          isOpen={isModalOpen}
          onClose={closeModal}
          imageUrl={(modalImage as any).frame_capture_url || ''}
          title={`Frame ${modalImage.frame}`}
          subtitle={`Video ID: ${result.file_id}`}
          confidence={modalImage.score}
          frameNumber={modalImage.frame}
          brandName={(() => {
            let brandName = (modalImage as any).brand_name || modalImage.brands?.name;
            if (!brandName && modalImage.brand_id) {
              const brandIndex = modalImage.brand_id - 1;
              if (brandIndex >= 0 && brandIndex < result.brands_detected.length) {
                brandName = result.brands_detected[brandIndex];
              }
            }
            return brandName;
          })()}
          bbox={modalImage.bbox}
          currentIndex={currentModalIndex}
          totalCount={detections.filter(detection => {
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
          }).length}
          onNavigate={navigateModal}
        />
      )}

    </>
  );
};

export default ResultsDisplay;
