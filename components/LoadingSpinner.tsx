import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message, size = 'md', className = '' }) => {
  const spinnerSizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-4',
    lg: 'w-12 h-12 border-4',
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  return (
    <div className={`flex flex-col items-center justify-center p-4 ${className}`}>
      <div
        className={`animate-spin rounded-full border-t-violet-500 border-solid ${spinnerSizeClasses[size]} border-slate-600`}
        role="status"
      >
        <span className="sr-only">Loading...</span>
      </div>
      {message && (
        <p className={`mt-3 text-slate-300 ${textSizeClasses[size]}`}>{message}</p>
      )}
    </div>
  );
};

export default LoadingSpinner;