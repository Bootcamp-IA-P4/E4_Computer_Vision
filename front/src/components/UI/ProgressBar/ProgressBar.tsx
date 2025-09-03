import React from 'react';
import './ProgressBar.css';

interface ProgressBarProps {
  progress: number;
  className?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress, className = '' }) => {
  return (
    <div className={`progress-bar ${className}`}>
      <div className="progress-container">
        <div
          className="progress-fill"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      <div className="progress-text">
        {progress}% Complete
      </div>
    </div>
  );
};

export default ProgressBar;
