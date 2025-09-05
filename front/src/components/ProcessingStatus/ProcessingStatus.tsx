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
  const [hasCompleted, setHasCompleted] = useState(false);

  useEffect(() => {
    if (!sessionId || !isPolling || hasCompleted) return;

    const pollStatus = async () => {
      try {
        console.log(`🔄 Polling status for session: ${sessionId}`);
        const currentStatus = await apiService.getProcessingStatus(sessionId);
        setStatus(currentStatus);

        console.log(`📊 Status: ${currentStatus.status}`, currentStatus);

        if (currentStatus.status === 'completed' && currentStatus.result && !hasCompleted) {
          console.log('✅ Processing completed!', currentStatus.result);
          setHasCompleted(true);
          setIsPolling(false);
          onComplete(currentStatus.result);
          return; // Stop polling immediately
        } else if (currentStatus.status === 'error') {
          console.error('❌ Processing failed:', currentStatus.error);
          setHasCompleted(true);
          setIsPolling(false);
          onError(currentStatus.error || 'Processing failed');
          return; // Stop polling immediately
        }
      } catch (error) {
        console.error('❌ Error polling status:', error);
        setHasCompleted(true);
        setIsPolling(false);
        onError(error instanceof Error ? error.message : 'Failed to check processing status');
        return; // Stop polling immediately
      }
    };

    // Poll immediately
    pollStatus();

    // Set up polling interval only if still polling and not completed
    const interval = setInterval(() => {
      if (isPolling && !hasCompleted) {
        pollStatus();
      }
    }, 2000); // Poll every 2 seconds

    return () => {
      clearInterval(interval);
    };
  }, [sessionId, isPolling, hasCompleted, onComplete, onError]);

  // Reset state when sessionId changes
  useEffect(() => {
    console.log(`🔄 ProcessingStatus: Session changed to: ${sessionId}`);
    setStatus(null);
    setIsPolling(true);
    setHasCompleted(false);
  }, [sessionId]);

  // Stop polling when component unmounts
  useEffect(() => {
    return () => {
      console.log(`🛑 ProcessingStatus: Component unmounting for session: ${sessionId}`);
      setIsPolling(false);
      setHasCompleted(true);
    };
  }, [sessionId]);

  const getStatusMessage = () => {
    if (!status) return '';
    
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
          <h3>🔄 Processing</h3>
          {getStatusMessage() && (
            <p className="status-message">{getStatusMessage()}</p>
          )}
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
