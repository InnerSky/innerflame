import React, { useEffect, useState } from 'react';
import { QuestionnaireRenderer } from '../features/questionnaire/components/QuestionnaireRenderer.js';

interface OnboardingModalProps {
  onComplete?: () => void;
}

export function OnboardingModal({ onComplete }: OnboardingModalProps) {
  const [isVisible, setIsVisible] = useState(false); // Start with invisible state
  
  // Disable body scrolling when modal is open
  useEffect(() => {
    // Add overflow-hidden to body when component mounts
    document.body.classList.add('overflow-hidden');
    
    // Remove overflow-hidden from body when component unmounts
    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, []);
  
  // Trigger entrance animation on mount
  useEffect(() => {
    // Use a short timeout to ensure the initial translate-y-full is applied first
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 50);
    
    return () => clearTimeout(timer);
  }, []);

  const handleQuestionnaireDone = () => {
    // Start animation
    setIsVisible(false);
    
    // After animation completes, call the parent callback
    setTimeout(() => {
      if (onComplete) onComplete();
    }, 500); // Give enough time for animation to complete
  };

  return (
    <div 
      className={`fixed inset-0 z-50 bg-background transition-all duration-500 ease-in-out ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-full'
      }`}
    >
      <div className="w-full h-full flex items-stretch">
        <div className="w-full h-full flex flex-col">
          <QuestionnaireRenderer 
            questionnaireType="onboarding" 
            onComplete={handleQuestionnaireDone}
          />
        </div>
      </div>
    </div>
  );
} 