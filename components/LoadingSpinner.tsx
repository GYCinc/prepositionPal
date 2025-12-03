
import React from 'react';
import { motion } from 'framer-motion';

interface LoadingSpinnerProps {
  message?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message }) => {
  return (
    <div className="flex flex-col items-center justify-center p-6 text-[#EF6035]">
      {/* 
        Custom SVG Smiley Loader 
        - Vector-based for perfect transparency on any background
        - Uses 'currentColor' to inherit the primary orange
        - Adds a neon glow effect
      */}
      <motion.svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 100 100"
        className="w-24 h-24 drop-shadow-[0_0_15px_rgba(239,96,53,0.4)]"
        animate={{ rotate: 360 }}
        transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
      >
        {/* Eyes */}
        <circle cx="30" cy="40" r="8" fill="currentColor" />
        <circle cx="70" cy="40" r="8" fill="currentColor" />
        
        {/* Smile - Quadratic Bezier Curve */}
        <path
          d="M 20 65 Q 50 90 80 65"
          fill="none"
          stroke="currentColor"
          strokeWidth="10"
          strokeLinecap="round"
        />
      </motion.svg>

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
