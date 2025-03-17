import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    variant = 'primary', 
    size = 'md', 
    isLoading = false, 
    leftIcon, 
    rightIcon, 
    children, 
    className = '',
    disabled,
    ...props 
  }, ref) => {
    const getVariantStyles = () => {
      switch (variant) {
        case 'primary':
          return 'bg-blue-600 text-white hover:bg-blue-700';
        case 'secondary':
          return 'bg-gray-200 text-gray-800 hover:bg-gray-300';
        case 'ghost':
          return 'bg-transparent hover:bg-gray-100';
        case 'destructive':
          return 'bg-red-600 text-white hover:bg-red-700';
        default:
          return 'bg-blue-600 text-white hover:bg-blue-700';
      }
    };

    const getSizeStyles = () => {
      switch (size) {
        case 'sm':
          return 'text-xs px-2.5 py-1.5';
        case 'md':
          return 'text-sm px-4 py-2';
        case 'lg':
          return 'text-base px-6 py-3';
        default:
          return 'text-sm px-4 py-2';
      }
    };

    return (
      <button
        ref={ref}
        className={`inline-flex items-center justify-center font-medium rounded-md transition-colors 
          ${getVariantStyles()} ${getSizeStyles()} 
          ${isLoading || disabled ? 'opacity-50 cursor-not-allowed' : ''} 
          ${className}`}
        disabled={isLoading || disabled}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        {!isLoading && leftIcon && <span className="mr-2">{leftIcon}</span>}
        {children}
        {!isLoading && rightIcon && <span className="ml-2">{rightIcon}</span>}
      </button>
    );
  }
); 