import React from 'react';
import './ImageModal.css';

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  title?: string;
  subtitle?: string;
  confidence?: number;
  frameNumber?: number;
  brandName?: string;
  bbox?: number[]; // [x1, y1, x2, y2] bounding box coordinates
  currentIndex?: number;
  totalCount?: number;
  onNavigate?: (direction: 'prev' | 'next') => void;
}

const ImageModal: React.FC<ImageModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  title,
  subtitle,
  confidence,
  frameNumber,
  brandName,
  bbox,
  currentIndex = 0,
  totalCount = 1,
  onNavigate
}) => {
  const [isZoomed, setIsZoomed] = React.useState(false);
  
  // Debug log for props and focus management
  React.useEffect(() => {
    if (isOpen) {
      console.log('🖼️ ImageModal props:', {
        currentIndex,
        totalCount,
        onNavigate: !!onNavigate,
        imageUrl
      });
      
      // Focus the modal for keyboard navigation
      const modalElement = document.querySelector('.image-modal-backdrop') as HTMLElement;
      if (modalElement) {
        modalElement.focus();
      }
    }
  }, [isOpen, currentIndex, totalCount, onNavigate, imageUrl]);

  // Handle keyboard navigation - only when modal is open and focused
  const handleKeyDown = (e: React.KeyboardEvent) => {
    console.log('🔑 Modal key pressed:', e.key, 'onNavigate:', !!onNavigate);
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowLeft' && onNavigate) {
      console.log('⬅️ Modal navigating to previous image');
      onNavigate('prev');
    } else if (e.key === 'ArrowRight' && onNavigate) {
      console.log('➡️ Modal navigating to next image');
      onNavigate('next');
    }
  };
  
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };



  const handleImageClick = () => {
    setIsZoomed(!isZoomed);
  };

  return (
    <div 
      className="image-modal-backdrop" 
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
      autoFocus
    >
      <div className="image-modal-container">
        <button 
          className="image-modal-close" 
          onClick={onClose}
          aria-label="Close modal"
        >
          ×
        </button>
        
        <div className="image-modal-content">
          <div className="image-modal-header">
            <div className="image-modal-header-content">
              <div className="image-modal-title-section">
                {title && <h3 className="image-modal-title">{title}</h3>}
                {subtitle && <p className="image-modal-subtitle">{subtitle}</p>}
              </div>
              {totalCount > 1 && onNavigate && (
                <div className="image-modal-navigation">
                  <button 
                    className="image-modal-nav-btn"
                    onClick={() => {
                      console.log('🔘 Previous button clicked');
                      onNavigate('prev');
                    }}
                    title="Previous image (←)"
                  >
                    ‹
                  </button>
                  <span className="image-modal-counter">
                    {currentIndex + 1} / {totalCount}
                  </span>
                  <button 
                    className="image-modal-nav-btn"
                    onClick={() => {
                      console.log('🔘 Next button clicked');
                      onNavigate('next');
                    }}
                    title="Next image (→)"
                  >
                    ›
                  </button>
                </div>
              )}
            </div>
          </div>
          
          <div className="image-modal-image-container">
            <div className="image-modal-image-wrapper">
              <img 
                src={imageUrl} 
                alt={title || 'Frame capture'} 
                className={`image-modal-image ${isZoomed ? 'zoomed' : ''}`}
                onClick={handleImageClick}
                style={{ cursor: 'zoom-in' }}
                title="Click to zoom in/out"
                onLoad={(e) => {
                  console.log('✅ Image loaded successfully:', imageUrl);
                  // Calculate and position bounding box overlay
                  if (bbox && bbox.length === 4) {
                    const img = e.currentTarget;
                    const wrapper = img.parentElement;
                    if (wrapper) {
                      const overlay = wrapper.querySelector('.image-modal-bbox-overlay') as HTMLElement;
                      if (overlay) {
                        const imgWidth = img.naturalWidth || 1920;
                        const imgHeight = img.naturalHeight || 1080;
                        
                        // Calculate bbox position relative to the image dimensions
                        const bboxLeft = (bbox[0] / imgWidth) * 100;
                        const bboxTop = (bbox[1] / imgHeight) * 100;
                        const bboxWidth = ((bbox[2] - bbox[0]) / imgWidth) * 100;
                        const bboxHeight = ((bbox[3] - bbox[1]) / imgHeight) * 100;
                        
                        // Set overlay position and size as percentages
                        overlay.style.left = `${bboxLeft}%`;
                        overlay.style.top = `${bboxTop}%`;
                        overlay.style.width = `${bboxWidth}%`;
                        overlay.style.height = `${bboxHeight}%`;
                      }
                    }
                  }
                }}
                onError={(e) => {
                  console.error('❌ Failed to load image:', imageUrl, e);
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    parent.innerHTML = `<div class="image-modal-error">Failed to load image<br><small>URL: ${imageUrl}</small></div>`;
                  }
                }}
              />
              {bbox && bbox.length === 4 && (
                <div 
                  className="image-modal-bbox-overlay"
                  style={{
                    left: '0%',
                    top: '0%',
                    width: '0%',
                    height: '0%'
                  }}
                ></div>
              )}
            </div>
          </div>
          
          <div className="image-modal-footer">
            {frameNumber !== undefined && (
              <div className="image-modal-info">
                <span className="image-modal-label">Frame:</span>
                <span className="image-modal-value">{frameNumber}</span>
              </div>
            )}
            
            {brandName && (
              <div className="image-modal-info">
                <span className="image-modal-label">Brand:</span>
                <span className="image-modal-value">{brandName}</span>
              </div>
            )}
            
            {confidence !== undefined && (
              <div className="image-modal-info">
                <span className="image-modal-label">Confidence:</span>
                <span className="image-modal-value confidence-badge">
                  {(confidence * 100).toFixed(1)}%
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageModal;
