import { QuestionCondition, QuestionnaireResponses } from '@innerflame/types/questionnaire.js';

/**
 * Evaluates whether a condition should display an info step based on user responses
 * 
 * @param condition The condition to evaluate
 * @param responses Current user responses object
 * @returns boolean indicating if the condition is met
 */
export function evaluateCondition(
  condition: QuestionCondition | null | undefined,
  responses: QuestionnaireResponses
): boolean {
  // If no condition is provided, always show the step
  if (!condition) {
    return true;
  }

  const { questionId, operator, value } = condition;
  
  // If the referenced question doesn't have an answer yet, don't show the conditional step
  if (!(questionId in responses)) {
    return false;
  }

  const userAnswer = responses[questionId];

  // Handle different operators
  switch (operator) {
    case 'equals':
      return userAnswer === value;
    
    case 'not_equals':
      return userAnswer !== value;
    
    case 'includes':
      // For multiple choice questions where answer is an array
      if (Array.isArray(userAnswer)) {
        return userAnswer.includes(value);
      }
      // For string answers, check if the value is a substring
      if (typeof userAnswer === 'string' && typeof value === 'string') {
        return userAnswer.includes(value);
      }
      return false;
    
    default:
      console.warn(`Unknown condition operator: ${operator}`);
      return false;
  }
} 