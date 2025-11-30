import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface ButtonProps extends HTMLMotionProps<'button'> {
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ children, className = '', disabled, ...rest }) => {
  const baseStyles =
    'w-full py-4 px-6 rounded-xl text-white font-black text-lg tracking-wide ' +
    'bg-gradient-to-r from-orange-500 to-red-600 shadow-lg ' +
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:grayscale ' +
    'flex items-center justify-center relative overflow-hidden z-10';

  return (
    <motion.button
      className={`${baseStyles} ${className}`}
      disabled={disabled}
      whileHover={
        !disabled
          ? {
              scale: 1.05,
              y: -4,
              boxShadow: '0 20px 30px -10px rgba(239, 68, 68, 0.6)',
              filter: 'brightness(1.1)',
            }
          : {}
      }
      whileTap={
        !disabled
          ? {
              scale: 0.9,
              y: 0,
              boxShadow: '0 5px 10px -5px rgba(239, 68, 68, 0.4)',
            }
          : {}
      }
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 500, damping: 15 }} // Very bouncy
      {...rest}
    >
      {/* Shine effect */}
      <motion.div
        className="absolute inset-0 bg-white/20"
        initial={{ x: '-100%' }}
        whileHover={{ x: '100%' }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
      />
      <span className="relative z-10 drop-shadow-md">{children}</span>
    </motion.button>
  );
};

export default Button;
