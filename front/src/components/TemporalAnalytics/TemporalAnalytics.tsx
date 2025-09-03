import React, { useState, useMemo, useEffect } from 'react';
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
  Bar
} from 'recharts';
import './TemporalAnalytics.css';
import { DetectionRecord } from '../../services/api';
import BrandLogo from '../BrandLogo/BrandLogo';

interface TemporalAnalyticsProps {
  detections: DetectionRecord[];
  brandsDetected: string[];
  videoDuration?: number;
  videoFPS?: number;
}

const TemporalAnalytics: React.FC<TemporalAnalyticsProps> = ({ 
  detections, 
  brandsDetected, 
  videoDuration = 0,
  videoFPS = 30
}) => {

  const [isExpanded, setIsExpanded] = useState(false);

  // Log props changes
  useEffect(() => {
    console.log('🎬 TemporalAnalytics props updated:', {
      detectionsCount: detections.length,
      brandsDetected,
      videoDuration,
      videoFPS
    });
  }, [detections, brandsDetected, videoDuration, videoFPS]);

  // Calculate temporal analytics
  const analytics = useMemo(() => {
    console.log('🎬 TemporalAnalytics - detections received:', detections.length);
    console.log('🎬 TemporalAnalytics - first detection sample:', detections[0]);
    
    if (!detections.length) return null;

    // Group detections by brand and time
    const brandTimeline: { [brand: string]: { frame: number; timestamp: number; score: number }[] } = {};
    
    // Use actual FPS from video or default to 30
    const actualFPS = videoFPS || 30;
    // IMPORTANT: frame numbers in database are indices of extracted frames (1 FPS), not original video frames
    // So frame 0 = 0 seconds, frame 1 = 1 second, frame 2 = 2 seconds, etc.
    const frameToTime = (frame: number) => frame * 1000; // Convert frame index directly to milliseconds (1 frame = 1 second)

    detections.forEach(detection => {
      // API returns brand_name directly, not in brands.name structure
      let brandName = detection.brand_name || detection.brands?.name || 'Unknown';
      console.log('🎬 TemporalAnalytics - processing detection:', {
        id: detection.id,
        brandName,
        brand_name: detection.brand_name,
        brands: detection.brands,
        hasBrands: !!detection.brands,
        brandsName: detection.brands?.name
      });
      
      if (!brandTimeline[brandName]) {
        brandTimeline[brandName] = [];
      }
      const timestamp = frameToTime(detection.frame);
      brandTimeline[brandName].push({
        frame: detection.frame,
        timestamp: timestamp,
        score: detection.score
      });
    });



    // Calculate video duration first
    const maxTime = Math.max(...detections.map(d => frameToTime(d.frame))) / 1000;
    // Use videoDuration from props if available and > 0, otherwise use maxTime from detections
    const videoDurationSeconds = (videoDuration && videoDuration > 0) ? videoDuration : maxTime;
    


    // Calculate duration for each brand (each detection = 1 second since TARGET_FPS = 1)
    const brandDurations: { [brand: string]: number } = {};
    Object.keys(brandTimeline).forEach(brand => {
      const detections = brandTimeline[brand];
      // Each detection represents 1 second of display time
      brandDurations[brand] = detections.length;
    });

    // Calculate frequency (detections per second)
    const brandFrequencies: { [brand: string]: number } = {};
    Object.keys(brandTimeline).forEach(brand => {
      const detections = brandTimeline[brand];
      const timeSpan = videoDurationSeconds; // Use the calculated video duration
      brandFrequencies[brand] = detections.length / timeSpan;
    });

    // Find peak moments (frames with most brands)

    

    
    // Prepare data for charts - use videoDurationSeconds for proper time intervals
    const timeIntervals = Math.max(10, Math.ceil(videoDurationSeconds / 10)); // At least 10 intervals, or 1 per 10 seconds
    const intervalSize = videoDurationSeconds / timeIntervals;
    


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


    




    // Bar chart data for detection frequency
    const barChartData = Object.keys(brandTimeline).map(brand => ({
      brand,
      frequency: brandFrequencies[brand]
    }));

    // Bar chart data for top brands by display time
    const topBrandsData = Object.entries(brandDurations)
      .sort(([,a], [,b]) => b - a) // Sort by duration descending
      .map(([brand, duration]) => ({
        brand,
        duration
      }));

    return {
      brandTimeline,
      brandDurations,
      brandFrequencies,
      totalDetections: detections.length,
      lineChartData,
      barChartData,
      topBrandsData,
      videoDurationSeconds
    };
  }, [detections, videoDuration, videoFPS]);

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
        <h3 className="universal-header">Temporal Analytics</h3>
        <div className="expand-icon">
          {isExpanded ? '▼' : '▶'}
        </div>
      </div>

      {isExpanded && (
        <div className="temporal-analytics-content">


          {/* Detection Timeline Line Chart */}
          <div className="analytics-card">
            <h4 className="universal-header">Detection Timeline</h4>
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


            {/* Detection Frequency - Professional Bar Chart */}
            <div className="analytics-card professional-chart">
              <div className="chart-header">
                <h4 className="universal-header">Detection Frequency</h4>
                <div className="chart-subtitle">Brands detection rate per second</div>
              </div>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart 
                    data={analytics.barChartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                  >
                    <defs>
                      <linearGradient id="frequencyGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#4a2c7a" stopOpacity={0.8}/>
                        <stop offset="100%" stopColor="#8b4a8b" stopOpacity={0.6}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid 
                      strokeDasharray="3 3" 
                      stroke="#e2e8f0" 
                      strokeOpacity={0.6}
                    />
                    <XAxis 
                      dataKey="brand" 
                      tick={{ 
                        fontSize: 11, 
                        fill: '#64748b',
                        fontWeight: 500
                      }}
                      axisLine={{ stroke: '#cbd5e1' }}
                      tickLine={{ stroke: '#cbd5e1' }}
                      angle={-45}
                      textAnchor="end"
                      height={70}
                    />
                    <YAxis 
                      label={{ 
                        value: 'Detection Rate (per sec)', 
                        angle: -90, 
                        position: 'insideLeft',
                        style: { textAnchor: 'middle', fill: '#64748b', fontSize: '12px' }
                      }}
                      tick={{ 
                        fontSize: 11, 
                        fill: '#64748b',
                        fontWeight: 500
                      }}
                      axisLine={{ stroke: '#cbd5e1' }}
                      tickLine={{ stroke: '#cbd5e1' }}
                      tickFormatter={(value) => value.toFixed(2)}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                        fontSize: '13px'
                      }}
                      formatter={(value: any) => [
                        `${Number(value).toFixed(3)} detections/sec`, 
                        'Detection Rate'
                      ]}
                      labelStyle={{ 
                        color: '#374151', 
                        fontWeight: 600,
                        marginBottom: '4px'
                      }}
                    />
                    <Bar 
                      dataKey="frequency" 
                      fill="url(#frequencyGradient)"
                      radius={[6, 6, 0, 0]}
                      stroke="#4a2c7a"
                      strokeWidth={1}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Brands by Display Time - Professional Bar Chart */}
            <div className="analytics-card professional-chart">
              <div className="chart-header">
                <h4 className="universal-header">Top Brands by Display Time</h4>
                <div className="chart-subtitle">Brands ranked by total display time</div>
              </div>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart 
                    data={analytics.topBrandsData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                  >
                    <defs>
                      <linearGradient id="durationGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#4a2c7a" stopOpacity={0.8}/>
                        <stop offset="100%" stopColor="#8b4a8b" stopOpacity={0.6}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid 
                      strokeDasharray="3 3" 
                      stroke="#e2e8f0" 
                      strokeOpacity={0.6}
                    />
                    <XAxis 
                      dataKey="brand" 
                      tick={{ 
                        fontSize: 11, 
                        fill: '#64748b',
                        fontWeight: 500
                      }}
                      axisLine={{ stroke: '#cbd5e1' }}
                      tickLine={{ stroke: '#cbd5e1' }}
                      angle={-45}
                      textAnchor="end"
                      height={70}
                    />
                    <YAxis 
                      label={{ 
                        value: 'Tiempo de Exhibición (seg)', 
                        angle: -90, 
                        position: 'insideLeft',
                        style: { textAnchor: 'middle', fill: '#64748b', fontSize: '12px' }
                      }}
                      tick={{ 
                        fontSize: 11, 
                        fill: '#64748b',
                        fontWeight: 500
                      }}
                      axisLine={{ stroke: '#cbd5e1' }}
                      tickLine={{ stroke: '#cbd5e1' }}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                        fontSize: '13px'
                      }}
                      formatter={(value: any) => [
                        `${value} segundos`, 
                        'Tiempo de Exhibición'
                      ]}
                      labelStyle={{ 
                        color: '#374151', 
                        fontWeight: 600,
                        marginBottom: '4px'
                      }}
                    />
                    <Bar 
                      dataKey="duration" 
                      fill="url(#durationGradient)"
                      radius={[6, 6, 0, 0]}
                      stroke="#4a2c7a"
                      strokeWidth={1}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>



          {/* Analytics Sections */}
          <div className="analytics-sections-grid">
            {/* Summary Section */}
            <div className="analytics-card">
              <h4 className="universal-header">Summary</h4>
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
                  <span className="stat-value">{formatTime(analytics.videoDurationSeconds * 1000)}</span>
                </div>
              </div>
            </div>

            {/* Brand Duration Section */}
            <div className="analytics-card">
              <h4 className="universal-header">Brand Duration</h4>
              <div className="stats-list">
                {Object.entries(analytics.brandDurations).map(([brand, duration]) => (
                  <div key={brand} className="stat-item">
                    <div className="stat-logo-container">
                      <BrandLogo brandName={brand} size="large" />
                    </div>
                    <span className="stat-value">{formatTime(duration * 1000)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Detection Frequency Section */}
            <div className="analytics-card">
              <h4 className="universal-header">Detection Frequency</h4>
              <div className="stats-list">
                {Object.entries(analytics.brandFrequencies).map(([brand, frequency]) => (
                  <div key={brand} className="stat-item">
                    <div className="stat-logo-container">
                      <BrandLogo brandName={brand} size="large" />
                    </div>
                    <span className="stat-value">{frequency.toFixed(2)}/sec</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemporalAnalytics;
