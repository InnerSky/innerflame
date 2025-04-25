import { useState, useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { 
  Questionnaire,
  QuestionnaireResponse,
  QuestionnaireResponses,
  QuestionnaireStatus,
  mapDbQuestionnaireToModel,
  QuestionnaireStructure 
} from '@innerflame/types/questionnaire.js';
import { useQuestionnaireService } from './useQuestionnaireService.js';
import { useAuth } from '@/contexts/AuthContext';

// Extended type for mock data that includes icon
// This extends the standard QuestionOption type to include icon support
// We use type assertion with this interface for our mock data since the actual
// type defined in @innerflame/types doesn't include the icon property yet
interface ExtendedQuestionOption {
  value: string;
  label: string;
  icon?: {
    type: 'library' | 'emoji' | 'url';
    value: string;
    backgroundColor?: string | null;
  };
  conditionalInput?: {
    id: string;
    type: 'text_input' | 'text_area';
    placeholder?: string | null;
    required?: boolean;
    maxLength?: number | null;
    rows?: number | null;
  };
}

export type TransitionState = 'none' | 'fade-out' | 'fade-in';

export function useQuestionnaireProcess(
  questionnaireType: string = 'onboarding',
  onCompleted?: () => void
) {
  // Auth context for getting the current user
  const { user } = useAuth();
  
  // Questionnaire service for database operations
  const { 
    fetchActiveQuestionnaire, 
    fetchUserResponse, 
    saveUserResponse,
    isLoading: serviceLoading,
    error: serviceError
  } = useQuestionnaireService();
  
  // State
  const [questionnaire, setQuestionnaire] = useState<Questionnaire | null>(null);
  const [questionnaireId, setQuestionnaireId] = useState<string | null>(null);
  const [questionnaireResponse, setQuestionnaireResponse] = useState<QuestionnaireResponse | null>(null);
  const [responses, setResponses] = useState<QuestionnaireResponses>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [status, setStatus] = useState<QuestionnaireStatus>('not_started');
  const [isLoading, setIsLoading] = useState(true);
  const [transitionState, setTransitionState] = useState<TransitionState>('none');
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  
  // Constants for transition timing
  const FADE_OUT_DURATION = 200; // ms
  const FADE_IN_DURATION = 300; // ms
  
  // Helper to find the next question index (handles skipping info steps based on conditions)
  const findNextQuestionIndex = useCallback((currentIndex: number) => {
    if (!questionnaire?.structure) return currentIndex + 1;
    
    let nextIndex = currentIndex + 1;
    
    // If we've reached the end
    if (nextIndex >= questionnaire.structure.length) {
      return nextIndex;
    }
    
    // Check if we need to skip conditional info steps
    const nextStep = questionnaire.structure[nextIndex];
    if (nextStep.type === 'info_step' && nextStep.condition) {
      const condition = nextStep.condition;
      const questionValue = responses[condition.questionId];
      
      // Evaluate the condition
      let conditionMet = false;
      
      if (condition.operator === 'equals') {
        conditionMet = questionValue === condition.value;
      } else if (condition.operator === 'not_equals') {
        conditionMet = questionValue !== condition.value;
      } else if (condition.operator === 'includes' && Array.isArray(questionValue)) {
        conditionMet = questionValue.includes(condition.value);
      }
      
      // If condition is not met, skip this step
      if (!conditionMet) {
        return findNextQuestionIndex(nextIndex);
      }
    }
    
    return nextIndex;
  }, [questionnaire, responses]);
  
  // Helper function to handle transitions
  const performTransition = useCallback(async (
    callback: () => void, 
    saveCallback?: () => Promise<void>
  ) => {
    // If already in a transition, don't start another one
    if (transitionState !== 'none') return;
    
    // Phase 1: Fade out
    setTransitionState('fade-out');
    
    // Wait for fade out animation to fully complete
    // Add a small buffer to ensure CSS transition is done
    await new Promise(resolve => setTimeout(resolve, FADE_OUT_DURATION + 50));
    
    // Execute the state change callback (e.g., change current question)
    // in a microtask to avoid layout thrashing
    await Promise.resolve().then(() => {
      callback();
    });
    
    // Execute any async save operations if provided
    // This happens while content is hidden
    if (saveCallback) {
      try {
        await saveCallback();
      } catch (err) {
        console.error('Error during transition save:', err);
        setError(err instanceof Error ? err.message : 'Failed to save progress');
      }
    }
    
    // Get the next animation frame to ensure the DOM has updated
    // with new content while still invisible
    await new Promise(resolve => requestAnimationFrame(resolve));
    
    // Phase 2: Fade in - use a second animation frame to ensure
    // layout calculations have fully completed
    await new Promise(resolve => requestAnimationFrame(resolve));
    
    // Now we can safely fade in
    setTransitionState('fade-in');
    
    // Reset transition state after fade in completes
    setTimeout(() => {
      setTransitionState('none');
    }, FADE_IN_DURATION + 50);
  }, [transitionState, FADE_OUT_DURATION, FADE_IN_DURATION]);
  
  // Initialize or load existing questionnaire
  const initializeQuestionnaire = useCallback(async () => {
    // Prevent concurrent initialization
    if (isInitializing) return;
    
    if (!user) {
      setError('User must be logged in to use the questionnaire');
      setIsLoading(false);
      return;
    }
    
    try {
      setIsInitializing(true);
      setIsLoading(true);
      setError(null);
      
      // 1. Fetch the active questionnaire for the specified type
      const questionnaireData = await fetchActiveQuestionnaire(questionnaireType);
      
      if (!questionnaireData) {
        setError(`No active questionnaire found for type: ${questionnaireType}`);
        setIsLoading(false);
        return;
      }
      
      const parsedQuestionnaire = mapDbQuestionnaireToModel(questionnaireData);
      setQuestionnaire(parsedQuestionnaire);
      setQuestionnaireId(parsedQuestionnaire.id);
      
      // 2. Check if user has an existing response
      const existingResponse = await fetchUserResponse(parsedQuestionnaire.id, user.id);
      
      if (existingResponse) {
        console.log('Found existing response, loading it:', existingResponse.id);
        // Load existing response
        setQuestionnaireResponse(existingResponse);
        setResponses(existingResponse.responses || {});
        setStatus(existingResponse.status);
        
        // For in-progress questionnaires, we might want to continue where they left off
        // This is a simplified approach - you might need more logic to find the right position
        if (existingResponse.status === 'in_progress') {
          // We start from the beginning for simplicity, but you could add logic to find
          // the last answered question and set currentQuestionIndex accordingly
          setCurrentQuestionIndex(0);
        }
      } else {
        console.log('No existing response found, creating new one');
        // Create a new response
        const responseId = await saveUserResponse(
          parsedQuestionnaire.id,
          user.id,
          null,  // No existing responseId
          {},    // Empty responses
          'not_started'
        );
        
        if (!responseId) {
          console.error('Failed to create new response');
          setError('Failed to initialize questionnaire response');
          setIsLoading(false);
          return;
        }
        
        console.log('Created new response with ID:', responseId);
        
        // Fetch the newly created response
        const newResponse = await fetchUserResponse(parsedQuestionnaire.id, user.id);
        
        if (newResponse) {
          console.log('Successfully fetched new response after creation');
          setQuestionnaireResponse(newResponse);
          setResponses(newResponse.responses || {});
          setStatus(newResponse.status);
        } else {
          console.error('Failed to fetch newly created response');
          setError('Failed to initialize questionnaire response');
        }
      }
    } catch (err) {
      console.error('Error initializing questionnaire:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize questionnaire');
    } finally {
      setIsLoading(false);
      setIsInitializing(false);
    }
  }, [fetchActiveQuestionnaire, fetchUserResponse, saveUserResponse, questionnaireType, user, isInitializing]);
  
  // Start or restart the questionnaire
  const startQuestionnaire = useCallback(async () => {
    setCurrentQuestionIndex(0);
    
    if (status === 'not_started') {
      setStatus('in_progress');
      
      // Update status in database
      if (questionnaireResponse && questionnaireId && user) {
        try {
          await saveUserResponse(
            questionnaireId,
            user.id,
            questionnaireResponse.id,
            responses,
            'in_progress'
          );
        } catch (err) {
          console.error('Error starting questionnaire:', err);
          setError('Failed to start questionnaire');
        }
      }
    }
  }, [questionnaireResponse, questionnaireId, user, responses, status, saveUserResponse]);
  
  // Helper function to sanitize responses and ensure they're JSON-serializable
  const sanitizeResponses = (responses: QuestionnaireResponses): QuestionnaireResponses => {
    // Create a new object to avoid modifying the original
    const sanitized: QuestionnaireResponses = {};
    
    // Process each key-value pair
    Object.entries(responses).forEach(([key, value]) => {
      try {
        // Test if the value is JSON serializable
        JSON.stringify(value);
        sanitized[key] = value;
      } catch (error) {
        // If serialization fails, we need to handle based on the type
        if (Array.isArray(value)) {
          // For arrays, filter out non-serializable items
          sanitized[key] = value.filter(item => {
            try {
              JSON.stringify(item);
              return true;
            } catch {
              return false;
            }
          });
        } else if (typeof value === 'object' && value !== null) {
          // For objects, convert to string representation
          sanitized[key] = '[Complex Object]';
        } else {
          // For other types, use string representation or null
          sanitized[key] = String(value) || null;
        }
      }
    });
    
    return sanitized;
  };

  // Move to the next question
  const goToNextQuestion = useCallback(async (updatedResponses?: QuestionnaireResponses) => {
    if (!questionnaire) return;
    
    const nextIndex = findNextQuestionIndex(currentQuestionIndex);
    
    const saveProgress = async () => {
      if (!questionnaireResponse || !questionnaireId || !user) return;
      
      // Use the provided updatedResponses if available, otherwise use the current responses state
      const responsesToSave = updatedResponses || responses;
      
      // Sanitize responses before saving to prevent circular reference errors
      const sanitizedResponses = sanitizeResponses(responsesToSave);
      
      await saveUserResponse(
        questionnaireId,
        user.id,
        questionnaireResponse.id,
        sanitizedResponses,
        nextIndex >= questionnaire.structure.length ? 'completed' : 'in_progress'
      );
      
      // Update status if we've reached the end
      if (nextIndex >= questionnaire.structure.length) {
        setStatus('completed');
      }
    };
    
    performTransition(
      // State change function
      () => setCurrentQuestionIndex(nextIndex),
      // Save function
      saveProgress
    );
  }, [
    questionnaire, 
    currentQuestionIndex, 
    findNextQuestionIndex, 
    questionnaireResponse, 
    questionnaireId, 
    user, 
    responses, 
    saveUserResponse,
    performTransition
  ]);
  
  // Move to the previous question
  const goToPreviousQuestion = useCallback(async () => {
    if (currentQuestionIndex > 0 && !isLoading) {
      try {
        // First, fetch the latest data before we start any transition
        let freshData = null;
        if (questionnaireId && user && questionnaireResponse) {
          setIsLoading(true); // Set loading while fetching
          // Use bypassCache=true to ensure we get fresh data from the database
          const latestResponse = await fetchUserResponse(questionnaireId, user.id, true);
          if (latestResponse && latestResponse.responses) {
            freshData = latestResponse.responses;
          }
          setIsLoading(false); // Clear loading after fetch
        }
        
        // Now start the transition with the fresh data
        performTransition(
          // In the state change function, update both the index and the responses
          () => {
            setCurrentQuestionIndex(currentQuestionIndex - 1);
            // Only update responses if we got fresh data
            if (freshData) {
              setResponses(freshData);
            }
          }
        );
      } catch (err) {
        console.error('Error refreshing responses when going back:', err);
        setIsLoading(false);
        // Still allow navigation even if refresh fails
        performTransition(() => setCurrentQuestionIndex(currentQuestionIndex - 1));
      }
    }
  }, [
    currentQuestionIndex, 
    performTransition, 
    questionnaireId, 
    user, 
    questionnaireResponse, 
    fetchUserResponse,
    isLoading
  ]);
  
  // Save an answer for a specific question
  const saveAnswer = useCallback(async (questionId: string, answer: any) => {
    // Update local state only
    const updatedResponses = {
      ...responses,
      [questionId]: answer
    };
    
    setResponses(updatedResponses);
    
    // Database saving is now handled exclusively in goToNextQuestion
    // and other transition functions to avoid race conditions
  }, [responses]);
  
  // Submit responses
  const completeQuestionnaire = useCallback(async () => {
    if (!questionnaireId || !user) {
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Sanitize responses before saving
      const sanitizedResponses = sanitizeResponses(responses);
      
      // Save all responses with completed status
      await saveUserResponse(
        questionnaireId,
        user.id,
        questionnaireResponse?.id || null,
        sanitizedResponses,
        'completed'
      );
      
      setStatus('completed');
      
      // Notify about completion if callback provided
      if (onCompleted) {
        onCompleted();
      }
    } catch (err) {
      console.error('Error completing questionnaire:', err);
      setError('Failed to complete questionnaire');
    } finally {
      setIsLoading(false);
    }
  }, [questionnaireId, user, questionnaireResponse, responses, saveUserResponse, onCompleted]);
  
  // Reset a completed questionnaire
  const resetQuestionnaire = useCallback(() => {
    if (transitionState !== 'none') return;
    
    // Use the transition system for a smooth user experience
    performTransition(
      // Reset to first question and change status
      () => {
        setCurrentQuestionIndex(0);
        if (status === 'completed') {
          setStatus('in_progress');
        }
      },
      // Save the updated status if needed
      async () => {
        if (status === 'completed' && questionnaireId && user) {
          try {
            // Sanitize responses before saving
            const sanitizedResponses = sanitizeResponses(responses);
            
            await saveUserResponse(
              questionnaireId,
              user.id,
              questionnaireResponse?.id || null,
              sanitizedResponses,
              'in_progress'
            );
          } catch (err) {
            console.error('Error resetting questionnaire:', err);
            setError('Failed to reset questionnaire');
          }
        }
      }
    );
  }, [
    status, 
    questionnaireId, 
    user, 
    responses, 
    saveUserResponse, 
    transitionState, 
    performTransition,
    questionnaireResponse
  ]);
  
  // Initialize on mount and when user changes - optimized to prevent redundant calls
  useEffect(() => {
    // Only initialize if we have a user, aren't already initializing, and don't have a questionnaire
    if (user && !isInitializing && (!questionnaire || !questionnaireResponse)) {
      console.log('Initializing questionnaire (not already loaded)');
      initializeQuestionnaire();
    }
  }, [user, initializeQuestionnaire, questionnaire, questionnaireResponse, isInitializing]);
  
  // Combine loading and error states
  useEffect(() => {
    if (serviceError) {
      setError(serviceError);
    }
  }, [serviceError]);
  
  return {
    // Data
    questionnaire,
    questionnaireId,
    questionnaireResponse,
    responses,
    currentQuestionIndex,
    status,
    
    // Status
    isLoading: isLoading || serviceLoading,
    transitionState,
    error,
    
    // Actions
    startQuestionnaire,
    goToNextQuestion,
    goToPreviousQuestion,
    saveAnswer,
    completeQuestionnaire,
    // Add manual transition control
    setTransitionState,
    // Add reset function 
    resetQuestionnaire
  };
}

// Mock data functions
function getMockQuestionnaireStructure(type: string): QuestionnaireStructure {
  // For demonstration - add various question types and info steps
  if (type === 'onboarding') {
    return {
      items: [
        {
          id: 'intro',
          type: 'info_step',
          title: 'Welcome to Inner Flame',
          body: 'We\'ll ask you a few questions to personalize your experience.',
          buttonText: 'Get Started',
          imageUrl: 'https://via.placeholder.com/400x240'
        },
        {
          id: 'q1',
          type: 'single_choice',
          text: 'What brings you here today?',
          description: 'Select the option that best describes your goal.',
          options: [
            { 
              value: 'mental_health', 
              label: 'Improve my mental health',
              icon: {
                type: 'library',
                value: 'user',
                backgroundColor: 'bg-red-100'
              }
            },
            { 
              value: 'stress', 
              label: 'Reduce stress and anxiety',
              icon: {
                type: 'library',
                value: 'search',
                backgroundColor: 'bg-blue-100'
              }
            },
            { 
              value: 'sleep', 
              label: 'Better sleep quality',
              icon: {
                type: 'library',
                value: 'rocket',
                backgroundColor: 'bg-purple-100'
              }
            },
            { 
              value: 'focus', 
              label: 'Increase focus and productivity',
              icon: {
                type: 'library',
                value: 'crown',
                backgroundColor: 'bg-yellow-100'
              }
            },
            { 
              value: 'other', 
              label: 'Something else',
              icon: {
                type: 'emoji',
                value: '✏️',
                backgroundColor: 'bg-green-100'
              },
              conditionalInput: {
                id: 'q1_other_reason',
                type: 'text_input',
                placeholder: 'Please specify your reason...',
                required: true,
                maxLength: 100
              }
            }
          ] as ExtendedQuestionOption[]
        },
        {
          id: 'q2',
          type: 'single_choice',
          text: 'How often do you meditate?',
          options: [
            { 
              value: 'never', 
              label: 'Never tried before',
              icon: {
                type: 'emoji',
                value: '😕',
                backgroundColor: 'bg-neutral-100'
              }
            },
            { 
              value: 'occasionally', 
              label: 'Occasionally (once a month or less)',
              icon: {
                type: 'emoji',
                value: '🙂',
                backgroundColor: 'bg-blue-50'
              }
            },
            { 
              value: 'sometimes', 
              label: 'Sometimes (a few times a month)',
              icon: {
                type: 'emoji',
                value: '😊',
                backgroundColor: 'bg-green-50'
              }
            },
            { 
              value: 'regularly', 
              label: 'Regularly (several times a week)',
              icon: {
                type: 'emoji',
                value: '🧘',
                backgroundColor: 'bg-orange-50'
              }
            },
            { 
              value: 'daily', 
              label: 'Daily',
              icon: {
                type: 'emoji',
                value: '✨',
                backgroundColor: 'bg-purple-50'
              }
            }
          ] as ExtendedQuestionOption[]
        },
        {
          id: 'info-tip',
          type: 'info_step',
          title: 'Did you know?',
          body: 'Even just 5 minutes of meditation daily can significantly reduce stress levels!',
          buttonText: 'Continue',
          imageUrl: 'https://via.placeholder.com/400x200'
        },
        {
          id: 'q3',
          type: 'single_choice',
          text: 'What time of day do you prefer for mindfulness activities?',
          options: [
            { value: 'morning', label: 'Morning' },
            { value: 'afternoon', label: 'Afternoon' },
            { value: 'evening', label: 'Evening' },
            { value: 'before_bed', label: 'Before bed' },
            { 
              value: 'varies', 
              label: 'It varies / No preference',
              conditionalInput: {
                id: 'q3_time_detail',
                type: 'text_input',
                placeholder: 'Tell us more about your preferred timing...',
                required: false,
                maxLength: 200
              }
            }
          ]
        },
        {
          id: 'q4',
          type: 'multiple_choice',
          text: 'What benefits are you seeking from mindfulness practice?',
          description: 'Select all that apply to you.',
          minSelections: 1,
          maxSelections: 3,
          options: [
            { value: 'stress_reduction', label: 'Stress reduction' },
            { value: 'better_sleep', label: 'Better sleep' },
            { value: 'emotional_balance', label: 'Emotional balance' },
            { value: 'mental_clarity', label: 'Mental clarity' },
            { value: 'physical_health', label: 'Physical health benefits' },
            { 
              value: 'other_benefit', 
              label: 'Other benefit',
              conditionalInput: {
                id: 'q4_other_benefit',
                type: 'text_area',
                placeholder: 'Please describe the benefit you\'re seeking...',
                required: true,
                maxLength: 250,
                rows: 3
              }
            }
          ] as ExtendedQuestionOption[]
        },
        {
          id: 'conclusion',
          type: 'info_step',
          title: 'Thank you!',
          body: 'We\'ve got everything we need to get you started on your mindfulness journey.',
          buttonText: 'Finish',
          imageUrl: 'https://via.placeholder.com/400x240'
        }
      ]
    };
  }
  
  // Default to empty if type not recognized
  return { items: [] };
} 