import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  children,
  className = '',
  disabled,
  ...rest
}) => {
  const baseStyles = 'w-full py-4 px-4 rounded-lg text-white font-bold text-lg ' +
                   'bg-gradient-to-r from-orange-400 to-red-500 shadow-lg ' +
                   'transition-all duration-200 ease-in-out ' +
                   'hover:from-orange-300 hover:to-red-600 hover:scale-[1.02] hover:shadow-xl hover:shadow-primary/50 ' +
                   'active:scale-[0.97] ' +
                   'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background-dark ' +
                   'disabled:opacity-50 disabled:cursor-not-allowed';

  return (
    <button
      className={`${baseStyles} ${className}`}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  );
};

export default Button;