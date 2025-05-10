import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'default' | 'outline' | 'red' | 'cancel';
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'default', 
  className = '', 
  ...props 
}) => {
  const baseStyles = "flex items-center justify-center font-medium transition-all duration-200 opacity-100";
  const variantStyles = {
    default: "bg-blue-500 hover:bg-blue-600 text-white",
    outline: "bg-transparent border-2 border-blue-500 text-blue-500 hover:bg-blue-50",
    red: "bg-red-500 hover:bg-red-600 text-white",
    cancel: "bg-red-500 hover:bg-red-600 text-white border-2 border-red-400",
  };

  // If the button text includes "stornieren" or "abbrechen" (case insensitive),
  // automatically use the cancel variant unless explicitly specified otherwise
  const buttonText = typeof children === 'string' ? children.toLowerCase() : '';
  const isCancelAction = buttonText.includes('stornieren') || buttonText.includes('abbrechen');
  const effectiveVariant = isCancelAction && variant === 'default' ? 'cancel' : variant;

  return (
    <button
      className={`${baseStyles} ${variantStyles[effectiveVariant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
