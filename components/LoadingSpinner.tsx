import React from 'react';
import { motion } from 'framer-motion';

interface LoadingSpinnerProps {
  message?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message }) => {
  return (
    <motion.div
      className="flex flex-col items-center justify-center p-4"
      initial={{ opacity: 1, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <svg
        role="img"
        aria-label="Loading..."
        className="smiley"
        viewBox="0 0 128 128"
        width="128px"
        height="128px"
      >
        <defs>
          <clipPath id="smiley-eyes">
            <circle
              className="smiley__eye1"
              cx="64"
              cy="64"
              r="8"
              transform="rotate(-40,64,64) translate(0,-56)"
            />
            <circle
              className="smiley__eye2"
              cx="64"
              cy="64"
              r="8"
              transform="rotate(40,64,64) translate(0,-56)"
            />
          </clipPath>
          <linearGradient id="smiley-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#000" />
            <stop offset="100%" stopColor="#fff" />
          </linearGradient>
          <mask id="smiley-mask">
            <rect x="0" y="0" width="128" height="128" fill="url(#smiley-grad)" />
          </mask>
        </defs>
        <g strokeLinecap="round" strokeWidth="12" strokeDasharray="175.93 351.86">
          <g>
            <rect fill="hsl(193,90%,50%)" width="128" height="64" clipPath="url(#smiley-eyes)" />
            <g fill="none" stroke="hsl(193,90%,50%)">
              <circle
                className="smiley__mouth1"
                cx="64"
                cy="64"
                r="56"
                transform="rotate(180,64,64)"
              />
              <circle
                className="smiley__mouth2"
                cx="64"
                cy="64"
                r="56"
                transform="rotate(0,64,64)"
              />
            </g>
          </g>
          <g mask="url(#smiley-mask)">
            <rect fill="hsl(223,90%,50%)" width="128" height="64" clipPath="url(#smiley-eyes)" />
            <g fill="none" stroke="hsl(223,90%,50%)">
              <circle
                className="smiley__mouth1"
                cx="64"
                cy="64"
                r="56"
                transform="rotate(180,64,64)"
              />
              <circle
                className="smiley__mouth2"
                cx="64"
                cy="64"
                r="56"
                transform="rotate(0,64,64)"
              />
            </g>
          </g>
        </g>
      </svg>

      {message && (
        <motion.p
          key={message}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="mt-8 text-gray-600 dark:text-gray-300 font-display text-lg font-medium drop-shadow-sm text-center"
        >
          {message}
        </motion.p>
      )}
    </motion.div>
  );
};

export default LoadingSpinner;
