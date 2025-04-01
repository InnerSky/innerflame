import {
  QuestionnaireItem,
  isSingleChoiceQuestion,
  isMultipleChoiceQuestion,
  isTextInputQuestion,
  isTextAreaQuestion,
  isScaleQuestion,
  isBooleanQuestion,
  isInfoStep,
  QuestionOption
} from '@innerflame/types/questionnaire.js';

/**
 * Validates a user's response to a question based on its requirements
 * 
 * @param item The questionnaire item to validate
 * @param value The user's response value
 * @returns Object containing validation result and error message if any
 */
export function validateResponse(
  item: QuestionnaireItem,
  value: any
): { isValid: boolean; errorMessage?: string } {
  // Skip validation for info steps
  if (isInfoStep(item)) {
    return { isValid: true };
  }

  // Check if response is required but not provided
  if (item.required && (value === undefined || value === null || value === '')) {
    return { 
      isValid: false, 
      errorMessage: 'This field is required.' 
    };
  }

  // Skip further validation if value is empty and not required
  if (!item.required && (value === undefined || value === null || value === '')) {
    return { isValid: true };
  }

  // Specific validations based on question type
  if (isSingleChoiceQuestion(item)) {
    const validOptions = item.options.map((opt: QuestionOption) => opt.value);
    if (!validOptions.includes(value as string)) {
      return { 
        isValid: false, 
        errorMessage: 'Please select a valid option.' 
      };
    }
  }

  else if (isMultipleChoiceQuestion(item)) {
    if (!Array.isArray(value)) {
      return { 
        isValid: false, 
        errorMessage: 'Please provide a valid selection.' 
      };
    }

    const validOptions = item.options.map((opt: QuestionOption) => opt.value);
    const allValid = (value as string[]).every(v => validOptions.includes(v));
    
    if (!allValid) {
      return { 
        isValid: false, 
        errorMessage: 'One or more selected options are invalid.' 
      };
    }

    // Check min/max selections if specified
    if (item.minSelections !== undefined && value.length < item.minSelections) {
      return { 
        isValid: false, 
        errorMessage: `Please select at least ${item.minSelections} option(s).` 
      };
    }
    
    if (item.maxSelections !== undefined && value.length > item.maxSelections) {
      return { 
        isValid: false, 
        errorMessage: `Please select no more than ${item.maxSelections} option(s).` 
      };
    }
  }

  else if (isTextInputQuestion(item) || isTextAreaQuestion(item)) {
    if (typeof value !== 'string') {
      return { 
        isValid: false, 
        errorMessage: 'Please provide a valid text response.' 
      };
    }

    // Check max length if specified
    if (item.maxLength !== undefined && value.length > item.maxLength) {
      return { 
        isValid: false, 
        errorMessage: `Response must be no more than ${item.maxLength} characters.` 
      };
    }
  }

  else if (isScaleQuestion(item)) {
    const numValue = Number(value);
    
    if (isNaN(numValue)) {
      return { 
        isValid: false, 
        errorMessage: 'Please provide a valid number.' 
      };
    }

    if (numValue < item.min || numValue > item.max) {
      return { 
        isValid: false, 
        errorMessage: `Please provide a value between ${item.min} and ${item.max}.` 
      };
    }
  }

  else if (isBooleanQuestion(item)) {
    if (typeof value !== 'boolean') {
      return { 
        isValid: false, 
        errorMessage: 'Please make a selection.' 
      };
    }
  }

  // If we get here, the response is valid
  return { isValid: true };
} 