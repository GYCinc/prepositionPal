
import React from 'react';
import { motion } from 'framer-motion';

interface LoadingSpinnerProps {
  message?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message }) => {
  return (
    <div className="flex flex-col items-center justify-center p-6">
      {/* 
        New CSS-based Smiley Loader 
        Styles are defined in index.html as .loader, .dot, etc.
      */}
      <div className="loader">
        <div className="dot"></div>
        <div className="dot"></div>
      </div>

      {message && (
        <motion.p 
          key={message}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          className="mt-8 text-gray-400 font-display text-base font-bold tracking-wide text-center max-w-[200px]"
        >
          {message}
        </motion.p>
      )}
    </div>
  );
};

export default LoadingSpinner;
