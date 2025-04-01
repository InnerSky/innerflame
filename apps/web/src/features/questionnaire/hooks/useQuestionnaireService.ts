import { useState, useCallback } from 'react';
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
    userId: string
  ): Promise<QuestionnaireResponse | null> => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Fetching user response with params:', { questionnaireId, userId });
      
      const { data, error } = await supabase
        .from('questionnaire_responses')
        .select('*')
        .eq('questionnaire_id', questionnaireId)
        .eq('user_id', userId)
        .single();
      
      if (error) {
        // Log the error for debugging
        console.error('Supabase error fetching response:', error);
        
        if (error.code === 'PGRST116') {
          // PGRST116 is "no rows returned" which is not really an error for us
          console.log('No existing response found');
          return null;
        } else if (error.code === '406') {
          // Not Acceptable error - likely an RLS issue
          console.warn('RLS policy issue detected (406 Not Acceptable)');
          throw new Error('Permission error: Unable to access questionnaire responses');
        } else {
          throw error;
        }
      }
      
      console.log('Found response:', data);
      return data ? mapDbResponseToModel(data) : null;
    } catch (err) {
      console.error('Error fetching user response:', err);
      setError('Failed to load your previous responses');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create or update user response
  const saveUserResponse = useCallback(async (
    questionnaireId: string,
    userId: string,
    responseId: string | null,
    responses: QuestionnaireResponses,
    status: QuestionnaireStatus
  ): Promise<string | null> => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Saving response:', { questionnaireId, userId, responseId, status });
      
      const timestamp = new Date().toISOString();
      let result;
      
      // Update existing
      if (responseId) {
        const updateData: any = {
          responses,
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
        const { data: existingResponse, error: checkError } = await supabase
          .from('questionnaire_responses')
          .select('id')
          .eq('user_id', userId)
          .eq('questionnaire_id', questionnaireId)
          .maybeSingle();
        
        if (checkError && checkError.code !== 'PGRST116') {
          console.error('Error checking for existing response:', checkError);
          throw checkError;
        }
        
        if (existingResponse) {
          console.log('Found existing response, updating instead of creating new:', existingResponse);
          
          // Use update instead since we found an existing record
          const updateData: any = {
            responses,
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
            responses,
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
        // If we get a unique constraint violation, try to fetch the existing record
        if (result.error.code === '23505' && result.error.message.includes('questionnaire_responses_user_questionnaire_idx')) {
          console.log('Caught unique constraint violation, fetching existing record instead');
          
          const { data: existingData, error: fetchError } = await supabase
            .from('questionnaire_responses')
            .select('id')
            .eq('user_id', userId)
            .eq('questionnaire_id', questionnaireId)
            .single();
            
          if (fetchError) {
            console.error('Error fetching existing record:', fetchError);
            throw result.error;
          }
          
          if (existingData) {
            console.log('Found existing response after constraint error:', existingData);
            return existingData.id;
          }
        }
        
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
    }
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