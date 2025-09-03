import React, { useState, useEffect } from 'react';
import './ProcessingStatus.css';
import { apiService, ProcessingResult } from '../../services/api';
import { ProcessingStatusType, ProcessingStatusData } from '../../types';
import ResultsDisplay from '../ResultsDisplay/ResultsDisplay';

interface ProcessingStatusProps {
  sessionId: string;
  onComplete: (result: ProcessingResult) => void;
  onError: (error: string) => void;
}

const ProcessingStatus: React.FC<ProcessingStatusProps> = ({ sessionId, onComplete, onError }) => {
  const [status, setStatus] = useState<ProcessingStatusData | null>(null);
  const [isPolling, setIsPolling] = useState(true);

  useEffect(() => {
    if (!sessionId || !isPolling) return;

    const pollStatus = async () => {
      try {
        console.log(`🔄 Polling status for session: ${sessionId}`);
        const currentStatus = await apiService.getProcessingStatus(sessionId);
        setStatus(currentStatus);

        console.log(`📊 Status: ${currentStatus.status}`, currentStatus);

        if (currentStatus.status === 'completed' && currentStatus.result) {
          console.log('✅ Processing completed!', currentStatus.result);
          setIsPolling(false);
          onComplete(currentStatus.result);
        } else if (currentStatus.status === 'error') {
          console.error('❌ Processing failed:', currentStatus.error);
          setIsPolling(false);
          onError(currentStatus.error || 'Processing failed');
        }
      } catch (error) {
        console.error('❌ Error polling status:', error);
        setIsPolling(false);
        onError(error instanceof Error ? error.message : 'Failed to check processing status');
      }
    };

    // Poll immediately
    pollStatus();

    // Set up polling interval
    const interval = setInterval(pollStatus, 2000); // Poll every 2 seconds

    return () => {
      clearInterval(interval);
    };
  }, [sessionId, isPolling, onComplete, onError]);

  const getStatusMessage = () => {
    if (!status) return 'Checking status...';
    
    switch (status.status) {
      case 'ready':
        return 'File uploaded, ready for processing';
      case 'processing':
        return 'Processing your file...';
      case 'completed':
        return 'Processing completed!';
      case 'error':
        return 'Processing failed';
      case 'not_found':
        return 'Session not found';
      default:
        return 'Unknown status';
    }
  };

  const getProgressPercentage = () => {
    if (!status) return 0;
    if (status.status === 'completed') return 100;
    if (status.status === 'error') return 0;
    return status.progress || 0;
  };

  if (status?.status === 'completed' && status.result) {
    return <ResultsDisplay result={status.result} />;
  }

  return (
    <div className="processing-status">
      <div className="status-container">
        <div className="status-header">
          <h3>🔄 Processing Status</h3>
          <p className="status-message">{getStatusMessage()}</p>
        </div>

        <div className="progress-section">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${getProgressPercentage()}%` }}
            ></div>
          </div>
          <div className="progress-text">
            {getProgressPercentage()}%
          </div>
        </div>

        {status?.stage && (
          <div className="current-stage">
            <span className="stage-label">Current stage:</span>
            <span className="stage-value">{status.stage}</span>
          </div>
        )}

        {status?.status === 'error' && (
          <div className="error-section">
            <div className="error-icon">❌</div>
            <div className="error-message">
              {status.error || 'An error occurred during processing'}
            </div>
          </div>
        )}


      </div>
    </div>
  );
};

export default ProcessingStatus;
