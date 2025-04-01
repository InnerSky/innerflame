import { Database } from '@innerflame/types/supabase.js';
import { Questionnaire, mapDbQuestionnaireToModel } from '@innerflame/types/questionnaire.js';
import { supabase } from '@/lib/supabase';

export const fetchActiveQuestionnaire = async (type: string): Promise<Questionnaire | null> => {
  try {
    const { data, error } = await supabase
      .from('questionnaires')
      .select('*')
      .eq('type', type)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error) throw error;
    
    return data ? mapDbQuestionnaireToModel(data) : null;
  } catch (err) {
    console.error('Error fetching active questionnaire:', err);
    return null;
  }
}; 