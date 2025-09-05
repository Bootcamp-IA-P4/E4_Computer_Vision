import React, { useState, useEffect, useRef } from 'react';
import './HeatmapOverlay.css';

export interface HeatmapData {
  heatmap_image: string;
  intensity_matrix: number[][];
  grid_size: number;
  video_dimensions: {
    width: number;
    height: number;
  };
  grid_dimensions: {
    width: number;
    height: number;
  };
  statistics: {
    total_detections: number;
    max_intensity: number;
    active_cells: number;
    total_cells: number;
  };
  brand_filter?: string;
  file_info?: {
    id: number;
    filename: string;
    file_type: string;
    duration_seconds?: number;
    fps?: number;
  };
}


export interface BrandDistributionData {
  brand_data: Record<string, {
    detection_count: number;
    heatmap_data: HeatmapData;
    average_confidence: number;
    positions: number[][];
  }>;
  total_brands: number;
  total_detections: number;
  video_dimensions: {
    width: number;
    height: number;
  };
  file_info?: {
    id: number;
    filename: string;
    file_type: string;
    duration_seconds?: number;
    fps?: number;
  };
}

interface HeatmapOverlayProps {
  fileId: number;
  videoUrl?: string;
  className?: string;
  onHeatmapClick?: (x: number, y: number, intensity: number) => void;
}

type HeatmapMode = 'spatial' | 'brands';

const HeatmapOverlay: React.FC<HeatmapOverlayProps> = ({
  fileId,
  videoUrl,
  className = '',
  onHeatmapClick
}) => {
  const [heatmapMode, setHeatmapMode] = useState<HeatmapMode>('spatial');
  const [heatmapData, setHeatmapData] = useState<HeatmapData | null>(null);
  const [brandData, setBrandData] = useState<BrandDistributionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [gridSize, setGridSize] = useState(100); // Фиксированный размер для пространственного режима
  const [backgroundType, setBackgroundType] = useState<'transparent' | 'white' | 'gradient' | 'dark' | 'purple'>('transparent'); // Фиксированный фон для пространственного режима
  const [smoothFactor, setSmoothFactor] = useState(0.5); // Фиксированное сглаживание для пространственного режима
  
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Загрузка данных тепловой карты
  const loadHeatmapData = async (mode: HeatmapMode) => {
    setLoading(true);
    setError(null);
    
    console.log(`🔥 Loading heatmap data for fileId: ${fileId}, mode: ${mode}`);
    
    try {
      let response;
      
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
      
      switch (mode) {
        case 'spatial':
          const params = new URLSearchParams();
          params.append('grid_size', gridSize.toString());
          if (selectedBrand) {
            params.append('brand_filter', selectedBrand);
          }
          params.append('background', backgroundType);
          params.append('smooth', smoothFactor.toString());
          response = await fetch(`${API_BASE_URL}/heatmap/${fileId}?${params}`);
          break;
        case 'brands':
          response = await fetch(`${API_BASE_URL}/heatmap/${fileId}/brands`);
          break;
        default:
          throw new Error('Неизвестный режим тепловой карты');
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API Error ${response.status}:`, errorText);
        
        if (response.status === 404) {
          throw new Error('Файл не найден. Убедитесь, что анализ завершен.');
        } else if (response.status === 500) {
          throw new Error('Ошибка сервера. Попробуйте позже.');
        } else {
          throw new Error(`Ошибка загрузки данных: ${response.status}`);
        }
      }
      
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('JSON Parse Error:', jsonError);
        throw new Error('Сервер вернул некорректные данные. Проверьте, что backend запущен.');
      }
      
      switch (mode) {
        case 'spatial':
          setHeatmapData(data);
          break;
        case 'brands':
          setBrandData(data);
          break;
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
      console.error('Ошибка загрузки тепловой карты:', err);
    } finally {
      setLoading(false);
    }
  };

  // Очистка состояния при смене fileId
  useEffect(() => {
    if (fileId) {
      // Очищаем предыдущие данные при смене файла
      setHeatmapData(null);
      setBrandData(null);
      setError(null);
      setSelectedBrand(null);
    }
  }, [fileId]);

  // Загрузка данных при изменении режима или параметров
  useEffect(() => {
    if (fileId) {
      loadHeatmapData(heatmapMode);
    }
  }, [fileId, heatmapMode, selectedBrand, gridSize, backgroundType, smoothFactor]);

  // Обработка клика по тепловой карте
  const handleHeatmapClick = (event: React.MouseEvent<HTMLImageElement>) => {
    if (!heatmapData || !onHeatmapClick) return;
    
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Преобразуем координаты в координаты сетки
    const gridX = Math.floor((x / rect.width) * heatmapData.grid_dimensions.width);
    const gridY = Math.floor((y / rect.height) * heatmapData.grid_dimensions.height);
    
    if (gridX >= 0 && gridX < heatmapData.grid_dimensions.width &&
        gridY >= 0 && gridY < heatmapData.grid_dimensions.height) {
      const intensity = heatmapData.intensity_matrix[gridY]?.[gridX] || 0;
      onHeatmapClick(gridX, gridY, intensity);
    }
  };


  // Рендер пространственной тепловой карты
  const renderSpatialHeatmap = () => {
    if (!heatmapData) return null;
    
    return (
      <div className="spatial-heatmap">
        <div className="heatmap-header">
          <h3>Spatial Heatmap</h3>
          {heatmapData.brand_filter && (
            <span className="brand-filter">Filter: {heatmapData.brand_filter}</span>
          )}
        </div>
        
        <div className={`heatmap-container ${backgroundType}-bg`}>
          {heatmapData.heatmap_image ? (
            <img
              src={heatmapData.heatmap_image}
              alt="Heatmap"
              className="heatmap-image"
              onClick={handleHeatmapClick}
              style={{ cursor: onHeatmapClick ? 'pointer' : 'default' }}
            />
          ) : (
            <div className="no-heatmap">No data to display</div>
          )}
        </div>
        
        <div className="heatmap-stats">
          <div className="stat-item">
            <span className="stat-label">Detections:</span>
            <span className="stat-value">{heatmapData.statistics.total_detections}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Active Cells:</span>
            <span className="stat-value">{heatmapData.statistics.active_cells}</span>
          </div>
        </div>
      </div>
    );
  };


  // Рендер распределения брендов
  const renderBrandDistribution = () => {
    if (!brandData) return null;
    
    return (
      <div className="brand-distribution">
        <div className="heatmap-header">
          <h3>Brand Distribution</h3>
          <span className="brands-count">{brandData.total_brands} brands</span>
        </div>
        
        <div className="brands-grid">
          {Object.entries(brandData.brand_data).map(([brandName, brandInfo]) => {
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

            const logoPath = getLogoPath(brandName);

            return (
              <div key={brandName} className="brand-heatmap-item">
                <div className="brand-header">
                  <div className="brand-logo-container">
                    {logoPath ? (
                      <img 
                        src={logoPath} 
                        alt={brandName} 
                        className="brand-logo"
                      />
                    ) : (
                      <span className="brand-fallback">{brandName.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <span className="brand-stats">
                    {brandInfo.detection_count} detections
                  </span>
                  </div>
                
                <div className="brand-heatmap">
                  {brandInfo.heatmap_data.heatmap_image ? (
                    <img
                      src={brandInfo.heatmap_data.heatmap_image}
                      alt={`Тепловая карта ${brandName}`}
                      className="brand-heatmap-image"
                    />
                  ) : (
                    <div className="no-heatmap">Нет данных</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="heatmap-stats">
          <div className="stat-item">
            <span className="stat-label">Total Brands:</span>
            <span className="stat-value">{brandData.total_brands}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Total Detections:</span>
            <span className="stat-value">{brandData.total_detections}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`heatmap-overlay ${className}`} ref={containerRef}>
      {/* API Status */}
      
      {/* Control Panel */}
      <div className="heatmap-controls">
        <div className="control-group">
          <label>Mode:</label>
          <select 
            value={heatmapMode} 
            onChange={(e) => setHeatmapMode(e.target.value as HeatmapMode)}
          >
            <option value="spatial">Spatial</option>
            <option value="brands">Brands</option>
          </select>
        </div>
        
        {heatmapMode === 'spatial' && (
          <>
            {brandData && (
              <div className="control-group">
                <label>Brand:</label>
                <select 
                  value={selectedBrand || ''} 
                  onChange={(e) => setSelectedBrand(e.target.value || null)}
                >
                  <option value="">All Brands</option>
                  {Object.keys(brandData.brand_data).map(brand => (
                    <option key={brand} value={brand}>{brand}</option>
                  ))}
                </select>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Loading indicator */}
      {loading && (
        <div className="heatmap-loading">
          <div className="loading-spinner"></div>
          <p>Loading heatmap...</p>
        </div>
      )}
      
      {/* Error */}
      {error && (
        <div className="heatmap-error">
          <p>❌ {error}</p>
          <button onClick={() => loadHeatmapData(heatmapMode)}>
            Try Again
          </button>
        </div>
      )}
      
      {/* Heatmap content */}
      {!loading && !error && (
        <>
          {heatmapMode === 'spatial' && renderSpatialHeatmap()}
          {heatmapMode === 'brands' && renderBrandDistribution()}
        </>
      )}
      
      {/* Color legend */}
      <div className="heatmap-legend">
        <span className="legend-label">Intensity:</span>
        <div className="legend-colors">
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: 'rgb(255, 255, 255)' }}></div>
            <span>No Data</span>
            <span className="legend-range">0%</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: 'rgb(220, 200, 255)' }}></div>
            <span>Low</span>
            <span className="legend-range">1-33%</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: 'rgb(140, 80, 255)' }}></div>
            <span>Medium</span>
            <span className="legend-range">34-66%</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: 'rgb(80, 0, 200)' }}></div>
            <span>High</span>
            <span className="legend-range">67-100%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeatmapOverlay;
