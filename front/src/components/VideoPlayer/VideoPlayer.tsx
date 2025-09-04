import React, { useRef, useEffect, useState } from 'react';
import './VideoPlayer.css';
import { DetectionRecord } from '../../services/api';
import BrandLogo from '../BrandLogo/BrandLogo';

interface VideoPlayerProps {
  videoUrl: string;
  detections: DetectionRecord[];
  onTimeUpdate?: (currentTime: number) => void;
}

interface DetectionOverlay {
  id: number;
  brandName: string;
  confidence: number;
  bbox: [number, number, number, number];
  isVisible: boolean;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoUrl, detections, onTimeUpdate }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [overlays, setOverlays] = useState<DetectionOverlay[]>([]);
  const [videoDimensions, setVideoDimensions] = useState({ width: 0, height: 0 });

  // Convert detections to overlays
  useEffect(() => {
    console.log('🎯 VideoPlayer: Processing detections:', detections);
    
    if (!detections || detections.length === 0) {
      console.log('🎯 VideoPlayer: No detections to process');
      setOverlays([]);
      return;
    }

    const detectionOverlays: DetectionOverlay[] = detections.map(detection => {
      // Get brand name from the correct field
      const brandName = (detection as any).brand_name || detection.brands?.name || 'Unknown';
      
      console.log('🎯 VideoPlayer: Processing detection:', {
        id: detection.id,
        brandName: brandName,
        brandNameDirect: (detection as any).brand_name,
        brandNameFromBrands: detection.brands?.name,
        score: detection.score,
        bbox: detection.bbox,
        t_start: detection.t_start,
        t_end: detection.t_end
      });
      
      return {
        id: detection.id,
        brandName: brandName,
        confidence: detection.score, // Используем score вместо confidence
        bbox: detection.bbox,
        isVisible: false
      };
    });

    console.log('🎯 VideoPlayer: Created overlays:', detectionOverlays);
    setOverlays(detectionOverlays);
  }, [detections]);

  // Handle video time updates
  const handleTimeUpdate = () => {
    if (!videoRef.current || !onTimeUpdate) return;
    
    const currentTime = videoRef.current.currentTime;
    onTimeUpdate(currentTime);

    // Update overlay visibility based on current time
    setOverlays(prevOverlays => 
      prevOverlays.map(overlay => {
        const detection = detections.find(d => d.id === overlay.id);
        if (!detection) {
          console.log('🎯 VideoPlayer: Detection not found for overlay:', overlay.id);
          return overlay;
        }

        // Показываем детекции только в нужное время
        const isVisible = detection.t_start !== undefined && 
                         detection.t_end !== undefined &&
                         currentTime >= detection.t_start && 
                         currentTime <= detection.t_end;

        if (isVisible !== overlay.isVisible) {
          console.log('🎯 VideoPlayer: Overlay visibility changed:', {
            overlayId: overlay.id,
            brandName: overlay.brandName,
            currentTime: currentTime.toFixed(2),
            t_start: detection.t_start,
            t_end: detection.t_end,
            isVisible,
            timeInRange: detection.t_start !== undefined && detection.t_end !== undefined && 
                        currentTime >= detection.t_start && currentTime <= detection.t_end
          });
        }

        return { ...overlay, isVisible };
      })
    );
  };

  // Handle video loaded metadata
  const handleLoadedMetadata = () => {
    if (!videoRef.current || !containerRef.current) return;

    const video = videoRef.current;
    const container = containerRef.current;
    
    // Get video dimensions
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;
    
    console.log('🎯 VideoPlayer: Video metadata loaded:', {
      videoWidth,
      videoHeight,
      containerWidth: container.clientWidth,
      containerHeight: container.clientHeight
    });
    
    // Calculate container dimensions
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    
    // Calculate scale to fit video in container
    const scaleX = containerWidth / videoWidth;
    const scaleY = containerHeight / videoHeight;
    const scale = Math.min(scaleX, scaleY);
    
    const scaledVideoWidth = videoWidth * scale;
    const scaledVideoHeight = videoHeight * scale;
    
    console.log('🎯 VideoPlayer: Calculated dimensions:', {
      scale,
      scaledVideoWidth,
      scaledVideoHeight
    });
    
    setVideoDimensions({
      width: scaledVideoWidth,
      height: scaledVideoHeight
    });
  };

  const formatConfidence = (confidence: number): string => {
    return `${(confidence * 100).toFixed(1)}%`;
  };

  return (
    <div className="video-player-container" ref={containerRef}>
      <div className="video-wrapper">
        <video
          ref={videoRef}
          src={videoUrl}
          controls
          className="video-player"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
        >
          Your browser does not support the video tag.
        </video>
        
        {/* Detection Overlays */}
        <div className="detection-overlays">
          {overlays.map(overlay => {
            if (!overlay.isVisible) return null;

            const [x, y, width, height] = overlay.bbox;
            
            // Find the corresponding detection for this overlay
            const detection = detections.find(d => d.id === overlay.id);
            
            console.log('🎯 VideoPlayer: Rendering overlay:', {
              overlayId: overlay.id,
              brandName: overlay.brandName,
              bbox: overlay.bbox,
              videoDimensions,
              confidence: overlay.confidence,
              currentTime: videoRef.current?.currentTime?.toFixed(2),
              t_start: detection?.t_start,
              t_end: detection?.t_end
            });
            
            // Get original video dimensions for proper scaling
            const video = videoRef.current;
            if (!video) return null;
            
            const originalVideoWidth = video.videoWidth;
            const originalVideoHeight = video.videoHeight;
            
            // Scale coordinates from original video dimensions to percentage
            const scaledX = (x / originalVideoWidth) * 100;
            const scaledY = (y / originalVideoHeight) * 100;
            const scaledWidth = (width / originalVideoWidth) * 100;
            const scaledHeight = (height / originalVideoHeight) * 100;
            
            console.log('🎯 VideoPlayer: Scaled coordinates:', {
              scaledX, scaledY, scaledWidth, scaledHeight
            });

            // Determine confidence level for styling
            const getConfidenceLevel = (confidence: number) => {
              if (confidence >= 0.8) return 'high-confidence';
              if (confidence >= 0.6) return 'medium-confidence';
              return 'low-confidence';
            };

            const confidenceLevel = getConfidenceLevel(overlay.confidence);

            return (
              <div
                key={overlay.id}
                className="detection-overlay"
                style={{
                  left: `${scaledX}%`,
                  top: `${scaledY}%`,
                  width: `${scaledWidth}%`,
                  height: `${scaledHeight}%`,
                }}
              >
                                 <div className={`detection-box ${confidenceLevel}`}>
                   <div className={`detection-label ${confidenceLevel}`}>
                     <BrandLogo 
                       brandName={overlay.brandName} 
                       size="small" 
                       className="video-overlay"
                     />
                     <span className="confidence">{formatConfidence(overlay.confidence)}</span>
                     {detection && (
                       <span className="time-info">
                         {detection.t_start?.toFixed(1)}s-{detection.t_end?.toFixed(1)}s
                       </span>
                     )}
                   </div>
                 </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
