import React, { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import './TemporalAnalytics.css';

interface DetectionRecord {
  id: number;
  frame: number;
  score: number;
  bbox: number[];
  brand_id?: number;
  brand_name?: string;
  brands?: { name: string };
  frame_capture_url?: string;
  timestamp?: number;
}

interface TemporalAnalyticsProps {
  detections: DetectionRecord[];
  brandsDetected: string[];
  videoDuration?: number;
}

const TemporalAnalytics: React.FC<TemporalAnalyticsProps> = ({ 
  detections, 
  brandsDetected, 
  videoDuration = 0 
}) => {
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [isExpanded, setIsExpanded] = useState(false);

  // Calculate temporal analytics
  const analytics = useMemo(() => {
    if (!detections.length) return null;

    // Group detections by brand and time
    const brandTimeline: { [brand: string]: { frame: number; timestamp: number; score: number }[] } = {};
    const frameToTime = (frame: number) => (frame / 30) * 1000; // Assuming 30 FPS, convert to milliseconds

    detections.forEach(detection => {
      let brandName = detection.brand_name || detection.brands?.name || 'Unknown';
      if (!brandTimeline[brandName]) {
        brandTimeline[brandName] = [];
      }
      brandTimeline[brandName].push({
        frame: detection.frame,
        timestamp: frameToTime(detection.frame),
        score: detection.score
      });
    });

    // Calculate duration for each brand
    const brandDurations: { [brand: string]: number } = {};
    Object.keys(brandTimeline).forEach(brand => {
      const detections = brandTimeline[brand];
      if (detections.length > 1) {
        const sortedDetections = detections.sort((a, b) => a.timestamp - b.timestamp);
        const totalDuration = sortedDetections[sortedDetections.length - 1].timestamp - sortedDetections[0].timestamp;
        brandDurations[brand] = totalDuration;
      } else {
        brandDurations[brand] = 0;
      }
    });

    // Calculate frequency (detections per second)
    const brandFrequencies: { [brand: string]: number } = {};
    Object.keys(brandTimeline).forEach(brand => {
      const detections = brandTimeline[brand];
      const timeSpan = videoDuration > 0 ? videoDuration : Math.max(...detections.map(d => d.timestamp)) / 1000;
      brandFrequencies[brand] = detections.length / timeSpan;
    });

    // Find peak moments (frames with most brands)
    const frameBrandCount: { [frame: number]: number } = {};
    detections.forEach(detection => {
      frameBrandCount[detection.frame] = (frameBrandCount[detection.frame] || 0) + 1;
    });
    
    const peakFrames = Object.entries(frameBrandCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([frame, count]) => ({ frame: parseInt(frame), count }));

    // Prepare data for charts
    const maxTime = Math.max(...detections.map(d => frameToTime(d.frame))) / 1000;
    const timeIntervals = 10; // 10-second intervals
    const intervalSize = maxTime / timeIntervals;

    // Line chart data for detection intensity over time
    const lineChartData = [];
    for (let i = 0; i <= timeIntervals; i++) {
      const timeStart = i * intervalSize;
      const timeEnd = (i + 1) * intervalSize;
      const dataPoint: any = {
        time: `${Math.floor(timeStart / 60)}:${Math.floor(timeStart % 60).toString().padStart(2, '0')}`,
        timestamp: timeStart
      };

      Object.keys(brandTimeline).forEach(brand => {
        const brandDetections = brandTimeline[brand].filter(d => 
          d.timestamp / 1000 >= timeStart && d.timestamp / 1000 < timeEnd
        );
        dataPoint[brand] = brandDetections.length;
      });

      lineChartData.push(dataPoint);
    }

    // Radar chart data for brand exposure
    const radarData = Object.keys(brandTimeline).map(brand => ({
      brand,
      exposure: Math.round(brandDurations[brand] / 1000) // Convert to seconds
    }));

    // Bar chart data for detection frequency
    const barChartData = Object.keys(brandTimeline).map(brand => ({
      brand,
      frequency: brandFrequencies[brand]
    }));

    return {
      brandTimeline,
      brandDurations,
      brandFrequencies,
      peakFrames,
      totalDetections: detections.length,
      lineChartData,
      radarData,
      barChartData
    };
  }, [detections, videoDuration]);

  const formatTime = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDuration = (milliseconds: number) => {
    if (milliseconds < 1000) return `${milliseconds}ms`;
    return formatTime(milliseconds);
  };

  if (!analytics) return null;

  return (
    <div className="temporal-analytics-section">
      <div 
        className="temporal-analytics-header"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3>📊 Temporal Analytics</h3>
        <div className="expand-icon">
          {isExpanded ? '▼' : '▶'}
        </div>
      </div>

      {isExpanded && (
        <div className="temporal-analytics-content">
          {/* Brand Selection */}
          <div className="brand-selector">
            <label>Select Brand:</label>
            <select 
              value={selectedBrand} 
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="brand-select"
            >
              <option value="all">All Brands</option>
              {brandsDetected.map(brand => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
            </select>
          </div>

          {/* Detection Timeline Line Chart */}
          <div className="analytics-card">
            <h4>📈 Detection Timeline</h4>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.lineChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="time" 
                    tick={{ fontSize: 12 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis 
                    label={{ value: 'Detections Count', angle: -90, position: 'insideLeft' }}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    labelFormatter={(value) => `Time: ${value}`}
                    formatter={(value, name) => [value, name]}
                  />
                  <Legend />
                  {Object.keys(analytics.brandTimeline).map((brand, index) => (
                    <Line
                      key={brand}
                      type="monotone"
                      dataKey={brand}
                      stroke={`hsl(${index * 60}, 70%, 50%)`}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="analytics-charts-grid">
            {/* Brand Exposure Time - Radar Chart */}
            <div className="analytics-card">
              <h4>⏳ Brand Exposure Time</h4>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={250}>
                  <RadarChart data={analytics.radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="brand" tick={{ fontSize: 12 }} />
                    <PolarRadiusAxis 
                      angle={90} 
                      domain={[0, Math.max(...analytics.radarData.map(d => d.exposure))]}
                      tick={{ fontSize: 10 }}
                    />
                    <Radar
                      name="Exposure Time (sec)"
                      dataKey="exposure"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.3}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Detection Intensity - Bar Chart */}
            <div className="analytics-card">
              <h4>🔧 Detection Intensity</h4>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={analytics.barChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="brand" 
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis 
                      label={{ value: 'Frequency (det/sec)', angle: -90, position: 'insideLeft' }}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip 
                      formatter={(value: any) => [`${Number(value).toFixed(2)}/sec`, 'Frequency']}
                    />
                    <Bar 
                      dataKey="frequency" 
                      fill="#3b82f6"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Peak Moments */}
          <div className="analytics-card">
            <h4>🔥 Peak Moments</h4>
            <div className="peak-moments-grid">
              {analytics.peakFrames.map((peak, index) => (
                <div key={index} className="peak-moment-card">
                  <div className="peak-frame">Frame {peak.frame}</div>
                  <div className="peak-count">{peak.count} brands detected</div>
                </div>
              ))}
            </div>
          </div>

          {/* Summary Statistics */}
          <div className="analytics-stats-grid">
            <div className="analytics-card">
              <h4>📋 Summary</h4>
              <div className="stats-list">
                <div className="stat-item">
                  <span className="stat-label">Total Detections</span>
                  <span className="stat-value">{analytics.totalDetections}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Unique Brands</span>
                  <span className="stat-value">{brandsDetected.length}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Video Duration</span>
                  <span className="stat-value">{formatTime(videoDuration * 1000)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemporalAnalytics;
