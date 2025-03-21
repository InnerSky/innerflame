import React from 'react';

// Define a style tag with the animation as a global module-scoped style
const LoadingDotsStyle = () => (
  <style dangerouslySetInnerHTML={{
    __html: `
      @keyframes loadingBounce {
        0%, 100% {
          transform: translateY(-60%);
          animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
        }
        50% {
          transform: translateY(0);
          animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
        }
      }
    `
  }} />
);

interface LoadingDotsProps {
  className?: string;
}

export const LoadingDots: React.FC<LoadingDotsProps> = ({ className = '' }) => (
  <div className={`flex items-center h-6 ${className}`}>
    <LoadingDotsStyle />
    <div className="flex space-x-1">
      <div 
        className="w-1.5 h-1.5 rounded-full bg-primary" 
        style={{ 
          animation: 'loadingBounce 1s infinite',
          animationDelay: '0ms'
        }}
      />
      <div 
        className="w-1.5 h-1.5 rounded-full bg-primary" 
        style={{ 
          animation: 'loadingBounce 1s infinite',
          animationDelay: '300ms'
        }}
      />
      <div 
        className="w-1.5 h-1.5 rounded-full bg-primary" 
        style={{ 
          animation: 'loadingBounce 1s infinite',
          animationDelay: '600ms'
        }}
      />
    </div>
  </div>
);

export default LoadingDots; 