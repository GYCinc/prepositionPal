import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message }) => {
  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div
        className="relative animate-spin-color rounded-full h-16 w-16 border-8 border-gray-300 dark:border-gray-600 border-t-primary shadow-md shadow-primary/50 spinner-sparkle"
        role="status"
      >
        <span className="sr-only">Loading...</span>
      </div>
      {message && (
        <p className="mt-4 text-gray-600 dark:text-gray-300 font-display text-lg font-medium drop-shadow-sm">{message}</p>
      )}
    </div>
  );
};

export default LoadingSpinner;