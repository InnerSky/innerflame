import React, { useEffect, useRef } from 'react';
import { 
  QuestionnaireItem, 
  isInfoStep, 
  isQuestionItem,
  isSingleChoiceQuestion,
  isMultipleChoiceQuestion,
  InfoStep as InfoStepType
} from '@innerflame/types/questionnaire.js';
import { InfoStep } from './InfoStep.js';
import { SingleChoiceQuestion } from './SingleChoiceQuestion.js';
import { MultipleChoiceQuestion } from './MultipleChoiceQuestion.js';
import { Button } from '@/components/ui/button';
import { useQuestionnaireProcess } from '../hooks/useQuestionnaireProcess.js';
import { Loader2, ChevronLeft, CheckCircle, Edit } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuestionnaireRendererProps {
  questionnaireType?: string;
  onComplete?: () => void;
}

export const QuestionnaireRenderer: React.FC<QuestionnaireRendererProps> = ({ 
  questionnaireType = 'onboarding',
  onComplete
}) => {
  const {
    questionnaire,
    responses,
    currentQuestionIndex,
    isLoading,
    transitionState,
    error,
    saveAnswer,
    goToNextQuestion,
    goToPreviousQuestion,
    status,
    startQuestionnaire
  } = useQuestionnaireProcess(questionnaireType, onComplete);
  
  // Ref to maintain container height consistency
  const containerRef = useRef<HTMLDivElement>(null);
  const contentHeight = useRef<number>(0);
  
  // Track content height to prevent layout shifts
  useEffect(() => {
    if (containerRef.current && transitionState === 'none') {
      const height = containerRef.current.scrollHeight;
      if (height > 100) { // Ensure we have a reasonable height
        contentHeight.current = height;
      }
    }
  }, [currentQuestionIndex, isLoading, transitionState, questionnaire]);
  
  // Effect to call onComplete callback when status changes to 'completed'
  useEffect(() => {
    if (status === 'completed' && onComplete) {
      // Delay the animation to show the thank you screen first
      const timer = setTimeout(() => {
        onComplete();
      }, 1500); // Wait 1.5 seconds to show completion screen
      
      return () => clearTimeout(timer);
    }
  }, [status, onComplete]);
  
  // Calculate progress percentage
  const calculateProgress = () => {
    if (!questionnaire || !questionnaire.structure || questionnaire.structure.length === 0) {
      return 0;
    }
    
    // If completed, return 100%
    if (status === 'completed') {
      return 100;
    }
    
    // Calculate progress based on current index
    return Math.round((currentQuestionIndex / (questionnaire.structure.length - 1)) * 100);
  };
  
  // Initial loading state (only for first load)
  if (isLoading && !questionnaire) {
    return (
      <div className="flex flex-col h-full w-full max-w-3xl mx-auto justify-center items-center">
        <div className="p-6 flex flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
          <p className="text-muted-foreground">Loading questionnaire...</p>
        </div>
      </div>
    );
  }
  
  // Show error state
  if (error) {
    return (
      <div className="flex flex-col h-full w-full max-w-3xl mx-auto justify-center items-center">
        <div className="p-6 bg-destructive/10 rounded-lg shadow-sm border border-destructive/20 max-w-md">
          <h2 className="text-xl font-semibold mb-4 text-destructive">Error</h2>
          <p className="mb-6">{error}</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }
  
  // If no questionnaire data
  if (!questionnaire || !questionnaire.structure || questionnaire.structure.length === 0) {
    return (
      <div className="flex flex-col h-full w-full max-w-3xl mx-auto justify-center items-center">
        <div className="p-6 bg-card rounded-lg shadow-sm border border-border/40 max-w-md">
          <h2 className="text-xl font-semibold mb-4">No questionnaire available</h2>
          <p className="text-muted-foreground">There are no questions to display.</p>
        </div>
      </div>
    );
  }
  
  // If completed
  if (status === 'completed' || currentQuestionIndex >= questionnaire.structure.length) {
    return (
      <div className="flex flex-col h-full w-full max-w-3xl mx-auto justify-center items-center">
        <div className="p-6 bg-card rounded-lg shadow-sm border border-border/40 max-w-md">
          <div className="flex items-center justify-center">
            <CheckCircle className="h-12 w-12 text-primary mr-4" />
            <div>
              <h2 className="text-xl font-semibold">Response saved!</h2>
              <p className="text-muted-foreground">Thank you.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  const currentStep = questionnaire.structure[currentQuestionIndex];
  
  // Calculate the question number (skipping info steps)
  const questionSteps = questionnaire.structure.filter(isQuestionItem);
  const currentQuestionNumber = isQuestionItem(currentStep) 
    ? questionSteps.findIndex(q => q.id === currentStep.id) + 1
    : 0;
  const totalQuestions = questionSteps.length;
  
  const handleQuestionResponse = (questionId: string, value: any, conditionalInputs?: Record<string, string>) => {
    // Save the main answer
    saveAnswer(questionId, value);
    
    // If we have conditional inputs, save each one individually
    if (conditionalInputs && Object.keys(conditionalInputs).length > 0) {
      Object.entries(conditionalInputs).forEach(([inputId, inputValue]) => {
        saveAnswer(inputId, inputValue);
      });
    }
    
    goToNextQuestion();
  };
  
  const renderProgressHeader = () => {
    return (
      <div className="flex items-center mb-2">
        {/* Back button - only show if not on the first question */}
        {currentQuestionIndex > 0 && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="w-8 h-8 mr-2 p-0" 
            onClick={goToPreviousQuestion}
            aria-label="Go back to previous question"
            disabled={transitionState !== 'none'}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
        
        {/* Logo with breathing animation - matching navbar style */}
        <div className="relative mr-2">
          <div className="absolute -inset-1 animate-pulse rounded-full bg-orange-500/20 dark:bg-orange-500/30"></div>
          <img 
            src="https://lpxnyybizytwcqdqasll.supabase.co/storage/v1/object/public/innerflame_asset//Logo1.png" 
            alt="InnerFlame Logo" 
            className="relative h-6 w-6"
          />
        </div>
        
        {/* Question counter - only show for question items, not info steps */}
        {isQuestionItem(currentStep) && (
          <span className="text-muted-foreground text-sm">
            Question {currentQuestionNumber} of {totalQuestions}
          </span>
        )}
      </div>
    );
  };
  
  const renderCurrentStep = (step: QuestionnaireItem) => {
    // Render based on step type
    if (isInfoStep(step)) {
      return <InfoStep step={step} onContinue={goToNextQuestion} />;
    }
    
    if (isSingleChoiceQuestion(step)) {
      const currentResponse = responses[step.id];
      
      // Get any conditional inputs that might be associated with this question
      const conditionalInputs: Record<string, string> = {};
      
      // Look for conditional input IDs in the step options
      step.options.forEach(option => {
        const extendedOption = option as any;
        if (extendedOption.conditionalInput?.id) {
          const inputId = extendedOption.conditionalInput.id;
          if (responses[inputId]) {
            conditionalInputs[inputId] = responses[inputId];
          }
        }
      });
      
      return (
        <SingleChoiceQuestion 
          key={step.id}
          step={step} 
          onContinue={(value, inputs) => handleQuestionResponse(step.id, value, inputs)}
          initialValue={currentResponse}
          initialConditionalInputs={conditionalInputs}
          disabled={transitionState !== 'none'}
        />
      );
    }
    
    if (isMultipleChoiceQuestion(step)) {
      const currentResponse = responses[step.id] || [];
      
      // Get any conditional inputs that might be associated with this question
      const conditionalInputs: Record<string, string> = {};
      
      // Look for conditional input IDs in the step options
      step.options.forEach(option => {
        const extendedOption = option as any;
        if (extendedOption.conditionalInput?.id) {
          const inputId = extendedOption.conditionalInput.id;
          if (responses[inputId]) {
            conditionalInputs[inputId] = responses[inputId];
          }
        }
      });
      
      return (
        <MultipleChoiceQuestion
          key={step.id}
          step={step}
          onContinue={(values, inputs) => handleQuestionResponse(step.id, values, inputs)}
          initialValue={currentResponse}
          initialConditionalInputs={conditionalInputs}
          disabled={transitionState !== 'none'}
        />
      );
    }
    
    // At this point TypeScript has narrowed step.type to exclude 'info_step', 'single_choice', 'multiple_choice'
    // So we need to use a different approach for the remaining types
    
    // Use a switch statement on the literal type values instead
    switch (step.type) {
      case 'text_input':
      case 'text_area':
      case 'scale':
      case 'boolean':
        // Handle all known question types with default behavior
        return (
          <div className="p-6 bg-card rounded-lg shadow-sm border border-border/40">
            <h2 className="text-xl font-semibold mb-4">{step.text}</h2>
            {step.description && <p className="text-muted-foreground mb-6">{step.description}</p>}
            <p className="mb-6 italic text-muted-foreground">This question type ({step.type}) is not implemented yet.</p>
            <Button
              onClick={goToNextQuestion}
              className="w-full"
              disabled={transitionState !== 'none'}
            >
              Continue
            </Button>
          </div>
        );
      default:
        // This should never happen if all types are covered, but TypeScript requires a fallback
        return (
          <div className="p-6 bg-card rounded-lg shadow-sm border border-border/40">
            <h2 className="text-xl font-semibold mb-4">Unknown Question Type</h2>
            <p className="mb-6 italic text-muted-foreground">This question type is not supported.</p>
            <Button
              onClick={goToNextQuestion}
              className="w-full"
              disabled={transitionState !== 'none'}
            >
              Continue
            </Button>
          </div>
        );
    }
  };
  
  // Set a minimum height based on the content height we've measured
  const minHeight = contentHeight.current ? `${contentHeight.current}px` : 'auto';
  
  // Determine the appropriate transition class based on transitionState
  const transitionClasses = cn(
    "transition-opacity duration-300",
    transitionState === 'fade-out' && "opacity-0",
    transitionState === 'fade-in' && "opacity-100",
    transitionState === 'none' && "opacity-100"
  );
  
  // Calculate the progress percentage
  const progressPercent = calculateProgress();
  
  return (
    <div className="flex flex-col h-full w-full max-w-3xl mx-auto">
      {/* Fixed header - reduced vertical padding */}
      <div className="flex-shrink-0 px-4 pt-3 pb-2">
        {renderProgressHeader()}
      </div>
      
      {/* Content area - height controlled to allow child components to scroll properly */}
      <div className="flex-grow px-4 py-1 flex flex-col overflow-hidden">
        {/* Container with full height to fill available space */}
        <div 
          className="flex-grow flex flex-col"
          style={{ minHeight: '0px' }} /* Critical for nested flex containers to respect parent constraints */
        >
          {/* Content wrapper with transitions */}
          <div
            ref={containerRef}
            className={cn(
              transitionClasses,
              "w-full h-full flex flex-col"
            )}
          >
            {/* Question title - only for question types, not info steps - reduced bottom margin */}
            {isQuestionItem(currentStep) && (
              <h1 className="text-2xl font-semibold mb-2 flex-shrink-0">{(currentStep as any).text}</h1>
            )}
            
            {/* Question description - only for question types, not info steps - reduced bottom margin */}
            {isQuestionItem(currentStep) && (currentStep as any).description && (
              <p className="text-muted-foreground mb-3 flex-shrink-0">{(currentStep as any).description}</p>
            )}
            
            {/* Actual step content - takes all remaining space */}
            <div className="flex-grow flex flex-col min-h-0">
              {renderCurrentStep(currentStep)}
            </div>
          </div>
        </div>
      </div>
      
      {/* Fixed footer with progress bar - reduced top padding */}
      <div className="flex-shrink-0 px-4 pt-2 pb-4">
        <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-300 ease-in-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}; 