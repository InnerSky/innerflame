import React, { useState, useEffect } from 'react';
import { SingleChoiceQuestion as SingleChoiceQuestionType, ConditionalInputField } from '@innerflame/types/questionnaire.js';
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

export interface SingleChoiceQuestionProps {
  step: SingleChoiceQuestionType;
  onContinue: (value: string, conditionalInputs?: Record<string, string>) => void; 
  initialValue?: string;
  initialConditionalInputs?: Record<string, string>;
  disabled?: boolean;
}

export const SingleChoiceQuestion: React.FC<SingleChoiceQuestionProps> = ({
  step,
  onContinue,
  initialValue,
  initialConditionalInputs = {},
  disabled = false
}) => {
  const [selectedOptionValue, setSelectedOptionValue] = useState<string | null>(initialValue || null);
  const [conditionalInputValues, setConditionalInputValues] = useState<Record<string, string>>(initialConditionalInputs);
  
  // Check if any option has an icon
  const hasIcons = step.options.some(opt => !!(opt as ExtendedQuestionOption).icon);
  
  // Use list layout if there are 5 or more options
  const useListLayout = step.options.length >= 5;
  // Otherwise use 2 columns for options with icons, 1 column if no icons and <= 4 options
  const useGridLayout = !useListLayout && (hasIcons || step.options.length <= 4);
  
  // Auto-select from initialValue if present
  useEffect(() => {
    if (initialValue) {
      setSelectedOptionValue(initialValue);
    }
  }, [initialValue]);
  
  // Auto-set conditional input values from initialConditionalInputs if present
  useEffect(() => {
    if (Object.keys(initialConditionalInputs).length > 0) {
      setConditionalInputValues(initialConditionalInputs);
    }
  }, [initialConditionalInputs]);
  
  // Get the currently selected option
  const selectedOption = selectedOptionValue 
    ? step.options.find(option => option.value === selectedOptionValue) as ExtendedQuestionOption | undefined
    : undefined;
  
  // Check if the selected option has a conditional input
  const selectedOptionHasConditionalInput = 
    selectedOption?.conditionalInput != null;
  
  // Handle conditional input change
  const handleConditionalInputChange = (id: string, value: string) => {
    setConditionalInputValues(prev => ({
      ...prev,
      [id]: value
    }));
  };
  
  // Check if we can continue (all required conditional inputs are filled)
  const canContinue = () => {
    if (!selectedOptionValue) return false;
    
    const selectedOpt = step.options.find(option => option.value === selectedOptionValue) as ExtendedQuestionOption;
    if (!selectedOpt) return false;
    
    // If this option has a required conditional input, check if it's filled
    if (selectedOpt.conditionalInput?.required) {
      const inputId = selectedOpt.conditionalInput.id;
      return !!conditionalInputValues[inputId] && conditionalInputValues[inputId].trim() !== '';
    }
    
    // No conditional input or not required
    return true;
  };
  
  const handleOptionSelect = (value: string) => {
    // Prevent selection when disabled
    if (disabled) return;
    
    // Update local selection state (for visual feedback)
    setSelectedOptionValue(value);
    
    // Find the selected option
    const option = step.options.find(opt => opt.value === value) as ExtendedQuestionOption;
    
    // If this option doesn't have a conditional input, continue immediately
    if (!option?.conditionalInput) {
      onContinue(value, conditionalInputValues);
    }
    // If it does have a conditional input, don't continue yet - wait for the user to fill it
  };
  
  // Handle submission when "Continue" is clicked
  const handleContinue = () => {
    if (!selectedOptionValue || !canContinue() || disabled) return;
    onContinue(selectedOptionValue, conditionalInputValues);
  };
  
  return (
    <div className="space-y-4 flex flex-col h-full">
      {useListLayout ? (
        // List layout for 5+ options
        <div className="flex flex-col gap-1 mt-2 flex-grow overflow-y-auto pr-2">
          {step.options.map((option) => {
            // Treat option as the extended type that may have an icon
            const extendedOption = option as ExtendedQuestionOption;
            const isSelected = selectedOptionValue === option.value;
            
            return (
              <div key={option.value} className={cn(
                "transition-all duration-300",
                isSelected && extendedOption.conditionalInput && "pb-4"
              )}>
                <button
                  onClick={() => handleOptionSelect(option.value)}
                  className={cn(
                    "relative p-4 rounded-xl border text-left transition-all duration-300 w-full",
                    "hover:border-primary/50 hover:shadow-sm",
                    isSelected
                      ? "bg-white dark:bg-card border-primary ring-2 ring-primary/20" 
                      : "bg-white dark:bg-card border-border/40",
                    disabled && "opacity-70 cursor-not-allowed",
                    "flex flex-col gap-4",
                    "min-h-[72px]"
                  )}
                  disabled={disabled}
                  type="button"
                >
                  <div className="flex items-center gap-4">
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
                    
                    {/* Selection indicator */}
                    {isSelected && (
                      <div className="w-4 h-4 rounded-full bg-primary flex-shrink-0"></div>
                    )}
                  </div>
                  
                  {/* Conditional input for "Other" options */}
                  {isSelected && extendedOption.conditionalInput && (
                    <div className="w-full animate-fadeIn mt-2 border-t border-primary/20 pt-3">
                      <Label htmlFor={extendedOption.conditionalInput.id} className="mb-2 block text-left">
                        Tell us more:
                        {extendedOption.conditionalInput.required && <span className="text-destructive ml-1">*</span>}
                      </Label>
                      
                      {extendedOption.conditionalInput.type === 'text_area' ? (
                        <Textarea
                          id={extendedOption.conditionalInput.id}
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
                          id={extendedOption.conditionalInput.id}
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
          "grid gap-3 mt-2 pr-2 overflow-y-auto content-start",
          useGridLayout ? "grid-cols-2" : "grid-cols-1"
        )}>
          {step.options.map((option) => {
            // Treat option as the extended type that may have an icon
            const extendedOption = option as ExtendedQuestionOption;
            const isSelected = selectedOptionValue === option.value;
            
            return (
              <div key={option.value} className={cn(
                "transition-all duration-300",
                isSelected && extendedOption.conditionalInput && "pb-4"
              )}>
                <button
                  onClick={() => handleOptionSelect(option.value)}
                  className={cn(
                    "relative p-5 rounded-xl border text-center transition-all duration-300 w-full",
                    "hover:border-primary/50 hover:shadow-sm",
                    isSelected
                      ? "bg-white dark:bg-card border-primary ring-2 ring-primary/20" 
                      : "bg-white dark:bg-card border-border/40",
                    disabled && "opacity-70 cursor-not-allowed",
                    "flex flex-col items-center justify-center gap-3",
                    "min-h-[160px]"
                  )}
                  disabled={disabled}
                  type="button"
                >
                  <div className="flex flex-col items-center justify-center gap-3">
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
      
      {/* Only show the Continue button if there's a conditional input for the selected option */}
      {selectedOptionHasConditionalInput && (
        <div className="mt-3 flex-shrink-0">
          <Button
            onClick={handleContinue}
            className="w-full"
            disabled={!canContinue() || disabled}
          >
            Continue
          </Button>
        </div>
      )}
    </div>
  );
}; 