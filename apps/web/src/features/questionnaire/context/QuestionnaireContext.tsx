import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { 
  Questionnaire, 
  QuestionnaireItem, 
  QuestionnaireResponses,
  QuestionnaireStatus,
  isQuestionItem
} from '@innerflame/types/questionnaire.js';
import { evaluateCondition } from '../utils/evaluateCondition.js';

interface QuestionnaireContextType {
  // State
  currentQuestionnaire: Questionnaire | null;
  responses: QuestionnaireResponses;
  currentStepIndex: number;
  status: QuestionnaireStatus;
  isLoading: boolean;
  error: string | null;
  responseId: string | null;
  
  // Methods
  setCurrentQuestionnaire: (questionnaire: Questionnaire) => void;
  setResponse: (questionId: string, value: any) => void;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  goToStep: (index: number) => void;
  getCurrentStep: () => QuestionnaireItem | null;
  resetQuestionnaire: () => void;
  submitResponses: () => Promise<void>;
  saveProgress: () => Promise<void>;
  setResponseId: (id: string) => void;
}

const QuestionnaireContext = createContext<QuestionnaireContextType | undefined>(undefined);

interface QuestionnaireProviderProps {
  children: ReactNode;
  onSubmit?: (responses: QuestionnaireResponses) => void;
  saveHandler?: (responseId: string | null, responses: QuestionnaireResponses, status: QuestionnaireStatus) => Promise<void>;
  submitHandler?: (responseId: string | null, responses: QuestionnaireResponses) => Promise<void>;
}

export function QuestionnaireProvider({ 
  children, 
  onSubmit,
  saveHandler,
  submitHandler
}: QuestionnaireProviderProps) {
  // State
  const [currentQuestionnaire, setCurrentQuestionnaire] = useState<Questionnaire | null>(null);
  const [responses, setResponses] = useState<QuestionnaireResponses>({});
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [status, setStatus] = useState<QuestionnaireStatus>('not_started');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [responseId, setResponseId] = useState<string | null>(null);

  // Get the current step
  const getCurrentStep = useCallback((): QuestionnaireItem | null => {
    if (!currentQuestionnaire || !currentQuestionnaire.structure || currentQuestionnaire.structure.length === 0) {
      return null;
    }
    return currentStepIndex < currentQuestionnaire.structure.length 
      ? currentQuestionnaire.structure[currentStepIndex] 
      : null;
  }, [currentQuestionnaire, currentStepIndex]);

  // Set response value
  const setResponse = useCallback((questionId: string, value: any) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  }, []);

  // Logic for handling conditional steps
  const getNextStepIndex = useCallback((currentIndex: number): number => {
    if (!currentQuestionnaire?.structure) return currentIndex;

    let nextIndex = currentIndex + 1;
    
    // If we've reached the end, just return the end
    if (nextIndex >= currentQuestionnaire.structure.length) {
      return nextIndex;
    }
    
    // Check if the next step is a conditional info_step
    const nextStep = currentQuestionnaire.structure[nextIndex];
    if (nextStep.type === 'info_step' && nextStep.condition) {
      // If condition isn't met, skip this step
      if (!evaluateCondition(nextStep.condition, responses)) {
        return getNextStepIndex(nextIndex);
      }
    }
    
    return nextIndex;
  }, [currentQuestionnaire, responses]);

  const getPreviousStepIndex = useCallback((currentIndex: number): number => {
    if (!currentQuestionnaire?.structure || currentIndex <= 0) return 0;

    let prevIndex = currentIndex - 1;
    
    // Check if the previous step is a conditional info_step
    const prevStep = currentQuestionnaire.structure[prevIndex];
    if (prevStep.type === 'info_step' && prevStep.condition) {
      // If condition isn't met, skip this step
      if (!evaluateCondition(prevStep.condition, responses)) {
        return getPreviousStepIndex(prevIndex);
      }
    }
    
    return prevIndex;
  }, [currentQuestionnaire, responses]);

  // Navigation
  const goToNextStep = useCallback(() => {
    if (!currentQuestionnaire?.structure) return;
    
    const nextIndex = getNextStepIndex(currentStepIndex);
    
    // Update status
    if (status === 'not_started') {
      setStatus('in_progress');
    }
    
    setCurrentStepIndex(nextIndex);
    
    // If moved to the end of questionnaire, trigger submit
    if (nextIndex >= currentQuestionnaire.structure.length) {
      // Auto-submit logic could go here if desired
    }
  }, [currentQuestionnaire, currentStepIndex, getNextStepIndex, status]);

  const goToPreviousStep = useCallback(() => {
    if (!currentQuestionnaire?.structure || currentStepIndex <= 0) return;
    
    const prevIndex = getPreviousStepIndex(currentStepIndex);
    setCurrentStepIndex(prevIndex);
  }, [currentQuestionnaire, currentStepIndex, getPreviousStepIndex]);

  const goToStep = useCallback((index: number) => {
    if (!currentQuestionnaire?.structure) return;
    
    // Validate index bounds
    if (index < 0) {
      setCurrentStepIndex(0);
    } else if (index >= currentQuestionnaire.structure.length) {
      setCurrentStepIndex(currentQuestionnaire.structure.length - 1);
    } else {
      setCurrentStepIndex(index);
    }
  }, [currentQuestionnaire]);

  // Reset questionnaire state
  const resetQuestionnaire = useCallback(() => {
    setResponses({});
    setCurrentStepIndex(0);
    setStatus('not_started');
    setError(null);
    setResponseId(null);
  }, []);

  // Save progress
  const saveProgress = useCallback(async () => {
    if (!saveHandler) return;
    
    try {
      setIsLoading(true);
      await saveHandler(responseId, responses, status);
      setError(null);
    } catch (err) {
      setError('Failed to save progress');
      console.error('Error saving questionnaire progress:', err);
    } finally {
      setIsLoading(false);
    }
  }, [responseId, responses, saveHandler, status]);

  // Submit responses
  const submitResponses = useCallback(async () => {
    if (!submitHandler) return;
    
    try {
      setIsLoading(true);
      
      // Validate all required questions are answered
      if (currentQuestionnaire?.structure) {
        const unansweredRequired = currentQuestionnaire.structure
          .filter(isQuestionItem)
          .filter(item => item.required && 
            (responses[item.id] === undefined || 
             responses[item.id] === null || 
             responses[item.id] === ''))
          .map(item => item.id);
        
        if (unansweredRequired.length > 0) {
          setError(`Please answer all required questions before submitting.`);
          setIsLoading(false);
          return;
        }
      }
      
      await submitHandler(responseId, responses);
      setStatus('completed');
      
      // Call the onSubmit callback if provided
      if (onSubmit) {
        onSubmit(responses);
      }
      
      setError(null);
    } catch (err) {
      setError('Failed to submit responses');
      console.error('Error submitting questionnaire:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentQuestionnaire, responseId, responses, submitHandler, onSubmit]);

  const value = {
    currentQuestionnaire,
    responses,
    currentStepIndex,
    status,
    isLoading,
    error,
    responseId,
    
    setCurrentQuestionnaire,
    setResponse,
    goToNextStep,
    goToPreviousStep,
    goToStep,
    getCurrentStep,
    resetQuestionnaire,
    submitResponses,
    saveProgress,
    setResponseId
  };

  return (
    <QuestionnaireContext.Provider value={value}>
      {children}
    </QuestionnaireContext.Provider>
  );
}

export function useQuestionnaire() {
  const context = useContext(QuestionnaireContext);
  if (context === undefined) {
    throw new Error('useQuestionnaire must be used within a QuestionnaireProvider');
  }
  return context;
} 