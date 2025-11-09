import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  // New props for selected/feedback states
  isSelected?: boolean;
  isCorrect?: boolean;
  isIncorrect?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled,
  isSelected,
  isCorrect,
  isIncorrect,
  ...rest
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900';
  const disabledStyles = 'opacity-40 cursor-not-allowed';

  const variantStyles = {
    primary:
      'bg-violet-700 hover:bg-violet-600 text-white focus:ring-violet-600 transform hover:scale-105',
    secondary:
      'bg-slate-700/50 border border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white focus:ring-slate-500',
  };

  const sizeStyles = {
    sm: 'text-sm py-1.5 px-3',
    md: 'text-base py-2 px-5',
    lg: 'text-lg px-7 py-3',
  };

  // Feedback styles
  const feedbackStyles = isCorrect ? '!bg-emerald-600 !border-emerald-500 text-white transform scale-105 shadow-lg' :
                         isIncorrect ? '!bg-rose-600 !border-rose-500 text-white transform scale-105 shadow-lg' :
                         '';

  // Apply a subtle selected style if no feedback yet, but an answer is chosen
  const selectedBaseStyle = isSelected && !isCorrect && !isIncorrect ? 'transform scale-102 border-violet-400' : '';

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${
        disabled ? disabledStyles : ''
      } ${selectedBaseStyle} ${feedbackStyles} ${className}`}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  );
};

export default Button;