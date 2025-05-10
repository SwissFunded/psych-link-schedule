import React from 'react';
import { cva, type VariantProps } from "class-variance-authority";

export const buttonVariants = cva(
  "flex items-center justify-center font-medium transition-all duration-200 opacity-100",
  {
    variants: {
      variant: {
        default: "bg-blue-500 hover:bg-blue-600 text-white",
        outline: "bg-transparent border-2 border-blue-500 text-blue-500 hover:bg-blue-50",
        red: "bg-red-500 hover:bg-red-600 text-white",
        cancel: "bg-red-500 hover:bg-red-600 text-white border-2 border-red-400",
        ghost: "bg-transparent hover:bg-gray-100",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-11 px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'default', 
  size = 'default',
  className = '', 
  ...props 
}) => {
  // If the button text includes "stornieren" or "abbrechen" (case insensitive),
  // automatically use the cancel variant unless explicitly specified otherwise
  const buttonText = typeof children === 'string' ? children.toLowerCase() : '';
  const isCancelAction = buttonText.includes('stornieren') || buttonText.includes('abbrechen');
  const effectiveVariant = isCancelAction && variant === 'default' ? 'cancel' : variant;

  return (
    <button
      className={buttonVariants({ variant: effectiveVariant, size, className })}
      {...props}
    >
      {children}
    </button>
  );
};
