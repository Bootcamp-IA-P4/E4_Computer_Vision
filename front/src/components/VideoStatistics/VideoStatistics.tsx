import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import './VideoStatistics.css';

interface VideoStatisticsProps {
  fileId: number;
}

interface VideoStatisticsData {
  file_info: {
    id: number;
    filename: string;
    file_type: string;
    duration_seconds?: number;
    fps?: number;
    created_at: string;
  };
  video_statistics: {
    total_duration_seconds: number;
    total_detections: number;
    unique_brands: number;
    average_confidence: number;
    total_detection_time: number;
    detection_density: number;
    detection_coverage: number;
  };
  brand_distribution: {
    [brandName: string]: {
      detections: number;
      total_time: number;
      avg_confidence: number;
    };
  };
  temporal_distribution: {
    [timeInterval: string]: number;
  };
}

const VideoStatistics: React.FC<VideoStatisticsProps> = ({ fileId }) => {
  const [statistics, setStatistics] = useState<VideoStatisticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        setLoading(true);
        const data = await apiService.getFileStatistics(fileId);
        setStatistics(data);
        console.log('📊 Video statistics loaded:', data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load statistics');
        console.error('❌ Error loading video statistics:', err);
      } finally {
        setLoading(false);
      }
    };

    if (fileId) {
      fetchStatistics();
    }
  }, [fileId]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="video-statistics">
        <div className="loading">Loading video statistics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="video-statistics">
        <div className="error">Error: {error}</div>
      </div>
    );
  }

  if (!statistics) {
    return (
      <div className="video-statistics">
        <div className="no-data">No statistics available</div>
      </div>
    );
  }

  const { file_info, video_statistics, brand_distribution, temporal_distribution } = statistics;

  return (
    <div className="video-statistics">
      <div className="statistics-header">
        <h3>📊 Video Statistics</h3>
        <div className="file-info">
          <span className="filename">{file_info.filename}</span>
          <span className="file-type">{file_info.file_type}</span>
        </div>
      </div>

      <div className="statistics-grid">
        {/* Video Overview */}
        <div className="stat-card">
          <h4>🎬 Video Overview</h4>
          <div className="stat-item">
            <span className="stat-label">Total Duration</span>
            <span className="stat-value">{formatTime(video_statistics.total_duration_seconds)}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">FPS</span>
            <span className="stat-value">{file_info.fps || 'N/A'}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Created</span>
            <span className="stat-value">{new Date(file_info.created_at).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Detection Summary */}
        <div className="stat-card">
          <h4>🔍 Detection Summary</h4>
          <div className="stat-item">
            <span className="stat-label">Total Detections</span>
            <span className="stat-value">{video_statistics.total_detections}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Unique Brands</span>
            <span className="stat-value">{video_statistics.unique_brands}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Average Confidence</span>
            <span className="stat-value">{formatPercentage(video_statistics.average_confidence * 100)}</span>
          </div>
        </div>

        {/* Coverage Analysis */}
        <div className="stat-card">
          <h4>📈 Coverage Analysis</h4>
          <div className="stat-item">
            <span className="stat-label">Detection Coverage</span>
            <span className="stat-value">{formatPercentage(video_statistics.detection_coverage)}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Detection Density</span>
            <span className="stat-value">{video_statistics.detection_density.toFixed(2)}/sec</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Total Detection Time</span>
            <span className="stat-value">{formatTime(video_statistics.total_detection_time)}</span>
          </div>
        </div>

        {/* Brand Distribution */}
        <div className="stat-card brand-distribution">
          <h4>🏷️ Brand Distribution</h4>
          <div className="brand-list">
            {Object.entries(brand_distribution).map(([brandName, stats]) => (
              <div key={brandName} className="brand-item">
                <div className="brand-name">{brandName}</div>
                <div className="brand-stats">
                  <span>{stats.detections} detections</span>
                  <span>{formatTime(stats.total_time)}</span>
                  <span>{formatPercentage(stats.avg_confidence * 100)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Temporal Distribution */}
        <div className="stat-card temporal-distribution">
          <h4>⏱️ Temporal Distribution</h4>
          <div className="time-intervals">
            {Object.entries(temporal_distribution).map(([interval, count]) => (
              <div key={interval} className="time-interval">
                <span className="interval-label">{interval}</span>
                <span className="interval-count">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoStatistics;
