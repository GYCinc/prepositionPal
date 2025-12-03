import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface ButtonProps extends HTMLMotionProps<"button"> {
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  type?: "button" | "submit" | "reset";
}

const Button: React.FC<ButtonProps> = ({
  children,
  className = '',
  disabled,
  ...rest
}) => {
  const baseStyles = 'w-full py-4 px-6 rounded-xl text-white font-black text-lg tracking-wide ' +
                   'bg-gradient-to-r from-orange-500 to-red-600 shadow-lg ' +
                   'disabled:opacity-50 disabled:cursor-not-allowed disabled:grayscale ' +
                   'flex items-center justify-center relative overflow-hidden z-10';

  return (
    <motion.button
      className={`${baseStyles} ${className}`}
      disabled={disabled}
      whileHover={!disabled ? { 
          scale: 1.02, 
          boxShadow: "0 10px 20px -5px rgba(239, 68, 68, 0.3)", 
          filter: "brightness(1.05)"
      } : {}}
      whileTap={!disabled ? { 
          scale: 0.98, 
          boxShadow: "inset 0 2px 4px rgba(0,0,0,0.1)" 
      } : {}}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      // Ultra-smooth cubic bezier for non-violent movement
      transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }} 
      {...rest}
    >
      {/* Shine effect */}
      <motion.div 
        className="absolute inset-0 bg-white/20"
        initial={{ x: '-100%' }}
        whileHover={{ x: '100%' }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
      />
      <span className="relative z-10 drop-shadow-md">{children}</span>
    </motion.button>
  );
};

export default Button;