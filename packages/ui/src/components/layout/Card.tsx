import React from 'react';

interface CardProps {
  children: React.ReactNode;
  title?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export const Card = ({ children, title, footer, className = '' }: CardProps) => {
  return (
    <div className={`border rounded-lg overflow-hidden shadow-sm ${className}`}>
      {title && (
        <div className="border-b p-4 font-medium">
          {title}
        </div>
      )}
      <div className="p-4">
        {children}
      </div>
      {footer && (
        <div className="border-t p-4 bg-gray-50 text-sm">
          {footer}
        </div>
      )}
    </div>
  );
}; 