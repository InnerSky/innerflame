import { useState, useCallback, useRef } from 'react';
import { 
  QuestionnaireResponse,
  QuestionnaireResponses,
  QuestionnaireStatus,
  mapDbResponseToModel
} from '@innerflame/types/questionnaire.js';
import { supabase } from '@/lib/supabase';

export function useQuestionnaireService() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Request cache to prevent duplicate API calls
  const requestCache = useRef(new Map());

  // Fetch the active questionnaire by type
  const fetchActiveQuestionnaire = useCallback(async (questionnaireType: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('questionnaires')
        .select('*')
        .eq('type', questionnaireType)
        .eq('is_active', true)
        .order('version', { ascending: false })
        .limit(1)
        .single();
      
      if (error) throw error;
      
      return data;
    } catch (err) {
      console.error('Error fetching questionnaire:', err);
      setError('Failed to load questionnaire');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch user's existing response for a questionnaire
  const fetchUserResponse = useCallback(async (
    questionnaireId: string, 
    userId: string,
    bypassCache: boolean = false
  ): Promise<QuestionnaireResponse | null> => {
    const cacheKey = `response-${questionnaireId}-${userId}`;
    
    // If we have an in-flight request and we're not bypassing cache, return its promise
    if (!bypassCache && requestCache.current.has(cacheKey)) {
      return requestCache.current.get(cacheKey);
    }
    
    // If we're bypassing cache and have an existing entry, remove it
    if (bypassCache && requestCache.current.has(cacheKey)) {
      requestCache.current.delete(cacheKey);
    }
    
    // Create new request and cache it
    const requestPromise = (async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        console.log('Fetching user response with params:', { questionnaireId, userId, bypassCache });
        
        const { data, error } = await supabase
          .from('questionnaire_responses')
          .select('*')
          .eq('questionnaire_id', questionnaireId)
          .eq('user_id', userId)
          .limit(1);
        
        if (error) throw error;
        
        // Return first response or null - simpler than using single()
        const response = data.length > 0 ? data[0] : null;
        
        if (response) {
          console.log('Found response:', response);
          return mapDbResponseToModel(response);
        } else {
          console.log('No existing response found');
          return null;
        }
      } catch (err) {
        console.error('Error fetching user response:', err);
        setError('Failed to load your previous responses');
        return null;
      } finally {
        setIsLoading(false);
        // Remove from cache when done
        requestCache.current.delete(cacheKey);
      }
    })();
    
    requestCache.current.set(cacheKey, requestPromise);
    return requestPromise;
  }, []);

  // Create or update user response
  const saveUserResponse = useCallback(async (
    questionnaireId: string,
    userId: string,
    responseId: string | null,
    responses: QuestionnaireResponses,
    status: QuestionnaireStatus
  ): Promise<string | null> => {
    const cacheKey = `save-${questionnaireId}-${userId}-${responseId}`;
    
    // If we have an in-flight save, return its promise
    if (requestCache.current.has(cacheKey)) {
      return requestCache.current.get(cacheKey);
    }
    
    // Create new request and cache it
    const requestPromise = (async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        console.log('Saving response:', { questionnaireId, userId, responseId, status });
        
        const timestamp = new Date().toISOString();
        let result;
        
        // Update existing
        if (responseId) {
          const updateData: any = {
            responses: JSON.parse(JSON.stringify(responses)),
            status,
            updated_at: timestamp
          };
          
          // Set started_at if moving to in_progress
          if (status === 'in_progress') {
            updateData.started_at = updateData.started_at || timestamp;
          }
          
          // Set completed_at if completing
          if (status === 'completed') {
            updateData.completed_at = timestamp;
          }
          
          result = await supabase
            .from('questionnaire_responses')
            .update(updateData)
            .eq('id', responseId)
            .select()
            .single();
        } 
        // Create new
        else {
          // First check if a response already exists for this user and questionnaire
          const { data: existingData } = await supabase
            .from('questionnaire_responses')
            .select('id')
            .eq('user_id', userId)
            .eq('questionnaire_id', questionnaireId)
            .limit(1);
          
          const existingResponse = existingData && existingData.length > 0 ? existingData[0] : null;
          
          if (existingResponse) {
            console.log('Found existing response, updating instead of creating new:', existingResponse);
            
            // Use update instead since we found an existing record
            const updateData: any = {
              responses: JSON.parse(JSON.stringify(responses)),
              status,
              updated_at: timestamp
            };
            
            if (status === 'in_progress') {
              updateData.started_at = updateData.started_at || timestamp;
            }
            
            if (status === 'completed') {
              updateData.completed_at = timestamp;
            }
            
            result = await supabase
              .from('questionnaire_responses')
              .update(updateData)
              .eq('id', existingResponse.id)
              .select()
              .single();
          } else {
            // Create new response
            const insertData: any = {
              questionnaire_id: questionnaireId,
              user_id: userId,
              responses: JSON.parse(JSON.stringify(responses)),
              status,
              created_at: timestamp,
              updated_at: timestamp
            };
            
            // Set started_at if starting or in progress
            if (status === 'in_progress') {
              insertData.started_at = timestamp;
            }
            
            // Set completed_at if completing
            if (status === 'completed') {
              insertData.completed_at = timestamp;
            }
            
            result = await supabase
              .from('questionnaire_responses')
              .insert(insertData)
              .select()
              .single();
          }
        }
        
        if (result.error) {
          throw result.error;
        }
        
        console.log('Successfully saved response:', result.data);
        return result.data.id;
      } catch (err) {
        console.error('Error saving response:', err);
        setError('Failed to save your responses');
        return null;
      } finally {
        setIsLoading(false);
        // Remove from cache when done
        requestCache.current.delete(cacheKey);
      }
    })();
    
    requestCache.current.set(cacheKey, requestPromise);
    return requestPromise;
  }, []);
  
  return {
    isLoading,
    error,
    fetchActiveQuestionnaire,
    fetchUserResponse,
    saveUserResponse
  };
}

// Type for the result of useQuestionnaireProcess
export interface QuestionnaireProcessState {
  // Data
  questionnaireId: string | null;
  questionnaireResponse: QuestionnaireResponse | null;
  currentQuestionIndex: number;
  // Status
  isLoading: boolean;
  error: string | null;
  // Actions
  startQuestionnaire: () => void;
  goToNextQuestion: () => void;
  goToPreviousQuestion: () => void;
  saveAnswer: (questionId: string, answer: any) => void;
  completeQuestionnaire: () => void;
} 