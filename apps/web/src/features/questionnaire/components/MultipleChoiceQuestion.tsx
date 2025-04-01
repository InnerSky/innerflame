import React, { useState, useEffect, useRef } from 'react';
import { MultipleChoiceQuestion as MultipleChoiceQuestionType, ConditionalInputField } from '@innerflame/types/questionnaire.js';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { QuestionOptionIcon } from './QuestionOptionIcon.js';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Extended QuestionOption type that includes the icon and conditionalInput properties
interface ExtendedQuestionOption {
  value: string;
  label: string;
  icon?: {
    type: 'library' | 'emoji' | 'url';
    value: string;
    backgroundColor?: string | null;
  } | null;
  conditionalInput?: ConditionalInputField | null;
}

export interface MultipleChoiceQuestionProps {
  step: MultipleChoiceQuestionType;
  onContinue: (values: string[], conditionalInputs?: Record<string, string>) => void; 
  initialValue?: string[];
  initialConditionalInputs?: Record<string, string>;
  disabled?: boolean;
}

export const MultipleChoiceQuestion: React.FC<MultipleChoiceQuestionProps> = ({
  step,
  onContinue,
  initialValue = [],
  initialConditionalInputs = {},
  disabled = false
}) => {
  // Create stable refs for step ID to prevent unnecessary effect triggers
  const stepIdRef = useRef(step.id);
  const initialRender = useRef(true);
  
  // State to track selected options - ensure it's properly initialized
  const [selectedValues, setSelectedValues] = useState<string[]>(() => {
    // Only use initialValue if it corresponds to this question (check against options)
    const validInitialValues = initialValue.filter(value => 
      step.options.some(option => option.value === value)
    );
    return validInitialValues.length > 0 ? validInitialValues : [];
  });
  
  // State to track conditional input values
  const [conditionalInputValues, setConditionalInputValues] = useState<Record<string, string>>(initialConditionalInputs);
  
  // Keep track of selections for preserving during re-renders
  const selectedValuesRef = useRef(selectedValues);
  
  // Update the ref when selections change
  useEffect(() => {
    selectedValuesRef.current = selectedValues;
  }, [selectedValues]);
  
  // Auto-set conditional input values from initialConditionalInputs if present
  useEffect(() => {
    if (Object.keys(initialConditionalInputs).length > 0) {
      setConditionalInputValues(initialConditionalInputs);
    }
  }, [initialConditionalInputs]);
  
  // Check if any option has an icon
  const hasIcons = step.options.some(opt => !!(opt as ExtendedQuestionOption).icon);
  
  // Use list layout if there are 5 or more options
  const useListLayout = step.options.length >= 5;
  // Otherwise use 2 columns for options with icons, 1 column if no icons and <= 4 options
  const useGridLayout = !useListLayout && (hasIcons || step.options.length <= 4);
  
  // Get min/max selections constraints - ensure these are valid numbers
  const minSelections = step.minSelections !== undefined && step.minSelections !== null 
    ? Number(step.minSelections) 
    : (step.required ? 1 : 0);
    
  // Only apply maxSelections if it's a valid number, otherwise use options length
  const maxSelections = step.maxSelections !== undefined && step.maxSelections !== null 
    ? Number(step.maxSelections) 
    : step.options.length;
  
  // Reset selected values only when the question ID actually changes
  useEffect(() => {
    // Skip on initial render as we've already set up in useState
    if (initialRender.current) {
      initialRender.current = false;
      return;
    }
    
    // Only reset when the step ID actually changes
    if (stepIdRef.current !== step.id) {
      stepIdRef.current = step.id;
      
      // Only use initialValue if it corresponds to this question
      const validInitialValues = initialValue.filter(value => 
        step.options.some(option => option.value === value)
      );
      setSelectedValues(validInitialValues.length > 0 ? validInitialValues : []);
    }
  }, [step.id, initialValue, step.options]);
  
  // Handle conditional input change
  const handleConditionalInputChange = (id: string, value: string) => {
    setConditionalInputValues(prev => ({
      ...prev,
      [id]: value
    }));
  };
  
  // Toggle selection of an option
  const handleToggleOption = (value: string) => {
    // Prevent selection when disabled
    if (disabled) return;
    
    setSelectedValues(prev => {
      // If already selected, remove it
      if (prev.includes(value)) {
        return prev.filter(v => v !== value);
      }
      
      // If not selected and we're at max selections, don't add
      if (prev.length >= maxSelections) {
        return prev;
      }
      
      // Otherwise, add the selection
      return [...prev, value];
    });
  };
  
  // Check if all required conditional inputs are filled
  const areRequiredConditionalInputsFilled = () => {
    // Get all selected options with required conditional inputs
    const selectedOptionsWithRequiredInputs = step.options
      .filter(opt => selectedValues.includes(opt.value))
      .map(opt => opt as ExtendedQuestionOption)
      .filter(opt => opt.conditionalInput?.required);
    
    // Check if all required conditional inputs have values
    return selectedOptionsWithRequiredInputs.every(opt => {
      if (!opt.conditionalInput) return true;
      const inputId = opt.conditionalInput.id;
      return !!conditionalInputValues[inputId] && conditionalInputValues[inputId].trim() !== '';
    });
  };
  
  // Check if continue is allowed based on min selections and required conditional inputs
  const isContinueDisabled = 
    selectedValues.length < minSelections || 
    !areRequiredConditionalInputsFilled() || 
    disabled;
  
  // Handle submission of selections
  const handleContinue = () => {
    if (isContinueDisabled) return;
    onContinue(selectedValues, conditionalInputValues);
  };

  // Calculate selection counter text
  const getSelectionCountText = () => {
    if (selectedValues.length < minSelections) {
      return `Please select at least ${minSelections} option${minSelections !== 1 ? 's' : ''}`;
    }

    if (maxSelections < step.options.length) {
      return `Selected ${selectedValues.length} of maximum ${maxSelections}`;
    }

    return `Selected ${selectedValues.length} option${selectedValues.length !== 1 ? 's' : ''}`;
  };
  
  // Check if any selected option has a conditional input
  const hasAnyConditionalInput = selectedValues.some(value => {
    const option = step.options.find(opt => opt.value === value) as ExtendedQuestionOption;
    return !!option?.conditionalInput;
  });
  
  return (
    <div className="space-y-6">
      {useListLayout ? (
        // List layout for 5+ options
        <div className="flex flex-col gap-2 mt-4">
          {step.options.map((option) => {
            // Treat option as the extended type that may have an icon
            const extendedOption = option as ExtendedQuestionOption;
            const isSelected = selectedValues.includes(option.value);
            
            // Only disable unselected options if we've actually reached the max selections
            const isAtMaxAndNotSelected = !isSelected && selectedValues.length >= maxSelections;
            
            return (
              <div 
                key={option.value}
                className={cn(
                  "transition-all duration-300",
                  isSelected && extendedOption.conditionalInput && "pb-2"
                )}
              >
                <button
                  onClick={() => handleToggleOption(option.value)}
                  className={cn(
                    "relative p-4 rounded-xl border text-left transition-all duration-300 w-full",
                    "hover:border-primary/50 hover:shadow-sm",
                    isSelected
                      ? "bg-white dark:bg-card border-primary ring-2 ring-primary/20" 
                      : "bg-white dark:bg-card border-border/40",
                    isAtMaxAndNotSelected 
                      ? "opacity-30 cursor-not-allowed filter grayscale" 
                      : disabled && "opacity-70 cursor-not-allowed",
                    "flex flex-col gap-4",
                    "min-h-[72px]",
                    isSelected && extendedOption.conditionalInput && "pb-4"
                  )}
                  disabled={disabled || isAtMaxAndNotSelected}
                  type="button"
                  aria-label={`${option.label}${isSelected ? ' - Selected' : ''}${isAtMaxAndNotSelected ? ' - Maximum selections reached' : ''}`}
                >
                  <div className="flex items-center gap-4">
                    {/* Circular selection indicator with number */}
                    <div className={cn(
                      "w-5 h-5 border rounded-full flex-shrink-0 flex items-center justify-center",
                      isSelected 
                        ? "bg-primary border-primary text-white" 
                        : "border-muted-foreground/30"
                    )}>
                      {isSelected && (
                        <span className="text-xs font-semibold">
                          {selectedValues.indexOf(option.value) + 1}
                        </span>
                      )}
                    </div>
                    
                    {/* If option has an icon, render a smaller version for list layout */}
                    {extendedOption.icon && (
                      <div className={cn(
                        "flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full",
                        extendedOption.icon.backgroundColor || "bg-muted",
                        isSelected && "ring-1 ring-primary"
                      )}>
                        {extendedOption.icon.type === 'emoji' ? (
                          <span className="text-xl">{extendedOption.icon.value}</span>
                        ) : extendedOption.icon.type === 'library' ? (
                          <span className="text-foreground">Icon</span>
                        ) : (
                          <img 
                            src={extendedOption.icon.value} 
                            alt=""
                            className="h-5 w-5 object-contain" 
                          />
                        )}
                      </div>
                    )}
                    
                    {/* Option label */}
                    <span className="text-base font-medium flex-grow">
                      {option.label}
                    </span>
                  </div>
                  
                  {/* Conditional input for "Other" options */}
                  {isSelected && extendedOption.conditionalInput && (
                    <div className="w-full animate-fadeIn mt-3 border-t border-primary/20 pt-3">
                      <Label htmlFor={`grid-${extendedOption.conditionalInput.id}`} className="mb-2 block text-left">
                        Tell us more:
                        {extendedOption.conditionalInput.required && <span className="text-destructive ml-1">*</span>}
                      </Label>
                      
                      {extendedOption.conditionalInput.type === 'text_area' ? (
                        <Textarea
                          id={`grid-${extendedOption.conditionalInput.id}`}
                          value={conditionalInputValues[extendedOption.conditionalInput.id] || ''}
                          onChange={(e) => handleConditionalInputChange(extendedOption.conditionalInput!.id, e.target.value)}
                          placeholder={extendedOption.conditionalInput.placeholder || ''}
                          required={extendedOption.conditionalInput.required}
                          rows={extendedOption.conditionalInput.rows || 3}
                          maxLength={extendedOption.conditionalInput.maxLength || undefined}
                          className="w-full resize-none text-left"
                          disabled={disabled}
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <Input
                          id={`grid-${extendedOption.conditionalInput.id}`}
                          type="text"
                          value={conditionalInputValues[extendedOption.conditionalInput.id] || ''}
                          onChange={(e) => handleConditionalInputChange(extendedOption.conditionalInput!.id, e.target.value)}
                          placeholder={extendedOption.conditionalInput.placeholder || ''}
                          required={extendedOption.conditionalInput.required}
                          maxLength={extendedOption.conditionalInput.maxLength || undefined}
                          className="w-full text-left"
                          disabled={disabled}
                          onClick={(e) => e.stopPropagation()}
                        />
                      )}
                    </div>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        // Grid layout for fewer options
        <div className={cn(
          "grid gap-4 mt-4",
          useGridLayout ? "grid-cols-2" : "grid-cols-1"
        )}>
          {step.options.map((option) => {
            // Treat option as the extended type that may have an icon
            const extendedOption = option as ExtendedQuestionOption;
            const isSelected = selectedValues.includes(option.value);
            
            // Only disable unselected options if we've actually reached the max selections
            const isAtMaxAndNotSelected = !isSelected && selectedValues.length >= maxSelections;
            
            return (
              <div 
                key={option.value}
                className={cn(
                  "transition-all duration-300",
                  isSelected && extendedOption.conditionalInput && "pb-2"
                )}
              >
                <button
                  onClick={() => handleToggleOption(option.value)}
                  className={cn(
                    "relative p-5 rounded-xl border text-center transition-all duration-300 w-full",
                    "hover:border-primary/50 hover:shadow-sm",
                    isSelected
                      ? "bg-white dark:bg-card border-primary ring-2 ring-primary/20" 
                      : "bg-white dark:bg-card border-border/40",
                    isAtMaxAndNotSelected 
                      ? "opacity-30 cursor-not-allowed filter grayscale" 
                      : disabled && "opacity-70 cursor-not-allowed",
                    "flex flex-col items-center justify-center gap-3",
                    "min-h-[160px]",
                    isSelected && extendedOption.conditionalInput && "pb-4"
                  )}
                  disabled={disabled || isAtMaxAndNotSelected}
                  type="button"
                  aria-label={`${option.label}${isSelected ? ' - Selected' : ''}${isAtMaxAndNotSelected ? ' - Maximum selections reached' : ''}`}
                >
                  <div className="flex flex-col items-center justify-center gap-3">
                    {/* Circular selection indicator in the corner */}
                    <div className={cn(
                      "absolute top-2 right-2 w-5 h-5 border rounded-full flex items-center justify-center",
                      isSelected 
                        ? "bg-primary border-primary text-white" 
                        : "border-muted-foreground/30 bg-transparent"
                    )}>
                      {isSelected && (
                        <span className="text-xs font-semibold">
                          {selectedValues.indexOf(option.value) + 1}
                        </span>
                      )}
                    </div>
                    
                    {/* If option has an icon, render it */}
                    {extendedOption.icon && (
                      <QuestionOptionIcon 
                        icon={extendedOption.icon} 
                        selected={isSelected}
                      />
                    )}
                    
                    {/* Option label */}
                    <span className="text-base font-medium">
                      {option.label}
                    </span>
                  </div>
                  
                  {/* Conditional input for "Other" options */}
                  {isSelected && extendedOption.conditionalInput && (
                    <div className="w-full animate-fadeIn mt-3 border-t border-primary/20 pt-3">
                      <Label htmlFor={`grid-${extendedOption.conditionalInput.id}`} className="mb-2 block text-left">
                        Tell us more:
                        {extendedOption.conditionalInput.required && <span className="text-destructive ml-1">*</span>}
                      </Label>
                      
                      {extendedOption.conditionalInput.type === 'text_area' ? (
                        <Textarea
                          id={`grid-${extendedOption.conditionalInput.id}`}
                          value={conditionalInputValues[extendedOption.conditionalInput.id] || ''}
                          onChange={(e) => handleConditionalInputChange(extendedOption.conditionalInput!.id, e.target.value)}
                          placeholder={extendedOption.conditionalInput.placeholder || ''}
                          required={extendedOption.conditionalInput.required}
                          rows={extendedOption.conditionalInput.rows || 3}
                          maxLength={extendedOption.conditionalInput.maxLength || undefined}
                          className="w-full resize-none text-left"
                          disabled={disabled}
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <Input
                          id={`grid-${extendedOption.conditionalInput.id}`}
                          type="text"
                          value={conditionalInputValues[extendedOption.conditionalInput.id] || ''}
                          onChange={(e) => handleConditionalInputChange(extendedOption.conditionalInput!.id, e.target.value)}
                          placeholder={extendedOption.conditionalInput.placeholder || ''}
                          required={extendedOption.conditionalInput.required}
                          maxLength={extendedOption.conditionalInput.maxLength || undefined}
                          className="w-full text-left"
                          disabled={disabled}
                          onClick={(e) => e.stopPropagation()}
                        />
                      )}
                    </div>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
      
      {/* Continue button */}
      <div className="mt-6">
        <p className="text-sm text-muted-foreground mb-2">
          {getSelectionCountText()}
        </p>
        <Button
          onClick={handleContinue}
          className="w-full"
          disabled={isContinueDisabled}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}; 