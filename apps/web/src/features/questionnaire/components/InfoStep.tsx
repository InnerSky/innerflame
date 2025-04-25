import React, { useState } from 'react';
import { InfoStep as InfoStepType } from '@innerflame/types/questionnaire.js';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface InfoStepProps {
  step: InfoStepType;
  onContinue: () => void;
}

export const InfoStep: React.FC<InfoStepProps> = ({ step, onContinue }) => {
  // Check if we have any content to display
  const hasContent = step.title || step.subtitle || step.body || step.description;
  // Track image loading state
  const [imageLoaded, setImageLoaded] = useState(false);
  
  return (
    <div className="p-4 flex flex-col h-full">
      <header className="mb-3 flex-shrink-0">
        {/* Title (if available) */}
        {step.title && (
          <h2 className="text-2xl font-semibold leading-tight">{step.title}</h2>
        )}
        
        {/* Subtitle (if available) */}
        {step.subtitle && (
          <h3 className="text-xl text-muted-foreground mt-1">{step.subtitle}</h3>
        )}
      </header>
      
      <div className="space-y-3 flex-grow overflow-y-auto">
        {/* For backwards compatibility, check if description exists */}
        {step.description && (
          <p className="text-muted-foreground">{step.description}</p>
        )}
        
        {/* Image (if available) - moved above body text */}
        {step.imageUrl && (
          <div className={cn(
            "my-3 overflow-hidden",
            imageLoaded ? "transform-none" : "h-0"
          )}>
            <img 
              src={step.imageUrl} 
              alt="Informational graphic" 
              className={cn(
                "mx-auto max-w-full h-auto max-h-[50vh] rounded-md object-contain transition-all duration-500 ease-out",
                imageLoaded ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
              )}
              onLoad={() => setImageLoaded(true)}
            />
          </div>
        )}
        
        {/* Button placed right after the image */}
        <Button
          onClick={onContinue}
          className="w-full mt-1 mb-3 flex-shrink-0"
        >
          {step.buttonText}
        </Button>
        
        {/* Main body content (if available) */}
        {step.body && (
          <div className="prose dark:prose-invert">
            <p>{step.body}</p>
          </div>
        )}
        
        {/* If no content is provided, show a fallback message */}
        {!hasContent && (
          <p className="text-center text-muted-foreground">Information step</p>
        )}
      </div>
    </div>
  );
}; 