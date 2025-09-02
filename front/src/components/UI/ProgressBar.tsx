import React from 'react';
import { ProgressBarProps } from '../../types';
import './ProgressBar.css';

const ProgressBar: React.FC<ProgressBarProps> = ({ 
  progress, 
  label, 
  showPercentage = true 
}) => {
  const clampedProgress = Math.max(0, Math.min(100, progress));

  return (
    <div className="progress-container">
      {label && (
        <div className="progress-label">
          {label}
          {showPercentage && <span className="progress-percentage">{Math.round(clampedProgress)}%</span>}
        </div>
      )}
      <div className="progress-bar">
        <div 
          className="progress-fill"
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
