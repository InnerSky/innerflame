import React from 'react';

interface PanelProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export const Panel = ({ children, header, footer, className = '' }: PanelProps) => {
  return (
    <div className={`border rounded-lg overflow-hidden ${className}`}>
      {header && (
        <div className="border-b p-4 bg-gray-50">
          {header}
        </div>
      )}
      <div className="p-4">
        {children}
      </div>
      {footer && (
        <div className="border-t p-4 bg-gray-50">
          {footer}
        </div>
      )}
    </div>
  );
}; 