import React from 'react';

interface LoadingSpinnerProps {
  size?: number;
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 60, 
  className = ''
}) => {
  return (
    <div className="flex items-center justify-center">
      <div className={`rotating-logo ${className}`} style={{ width: size, height: size }}>
        <svg width="100%" height="100%" viewBox="0 0 45 39" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g>
            <path d="M9.52976 10.0801L21.1691 30.2401L32.8085 10.0801H9.52976Z" stroke="currentColor" strokeWidth="3.36"/>
            <circle cx="36.1207" cy="8.90412" r="8.232" fill="#5FB865"/>
            <circle cx="8.232" cy="8.90412" r="8.232" fill="#CA5353"/>
            <circle cx="21.3355" cy="30.744" r="8.232" fill="#41748D"/>
          </g>
        </svg>
      </div>
    </div>
  );
};

export default LoadingSpinner;