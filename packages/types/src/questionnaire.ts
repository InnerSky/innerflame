import { Json } from './supabase.js';

// Common fields for all questionnaire items
export interface QuestionnaireItemBase {
  id: string;
  type: QuestionnaireItemType;
  text: string;
  description?: string;
  required?: boolean;
}

// Question Types
export type QuestionnaireItemType = 
  | 'single_choice'
  | 'multiple_choice'
  | 'text_input'
  | 'text_area'
  | 'scale'
  | 'boolean'
  | 'info_step';

// Options for choice-based questions
export interface QuestionOption {
  value: string;
  label: string;
  icon?: {
    type: 'library' | 'emoji' | 'url';
    value: string;
    backgroundColor?: string | null;
  } | null;
  conditionalInput?: ConditionalInputField | null;
}

// Conditional input field for "Other" options
export interface ConditionalInputField {
  id: string;
  type: 'text_input' | 'text_area';
  placeholder?: string | null;
  required?: boolean;
  maxLength?: number | null;
  rows?: number | null; // Only relevant for text_area type
}

// Condition for conditional display of info steps
export interface QuestionCondition {
  questionId: string;
  operator: 'equals' | 'not_equals' | 'includes';
  value: any;
}

// Single Choice Question
export interface SingleChoiceQuestion extends QuestionnaireItemBase {
  type: 'single_choice';
  options: QuestionOption[];
}

// Multiple Choice Question
export interface MultipleChoiceQuestion extends QuestionnaireItemBase {
  type: 'multiple_choice';
  options: QuestionOption[];
  minSelections?: number;
  maxSelections?: number;
}

// Text Input Question
export interface TextInputQuestion extends QuestionnaireItemBase {
  type: 'text_input';
  placeholder?: string;
  maxLength?: number;
  inputType?: string; // e.g., 'text', 'email'
}

// Text Area Question
export interface TextAreaQuestion extends QuestionnaireItemBase {
  type: 'text_area';
  placeholder?: string;
  rows?: number;
  maxLength?: number;
}

// Scale Question
export interface ScaleQuestion extends QuestionnaireItemBase {
  type: 'scale';
  min: number;
  max: number;
  minLabel?: string;
  maxLabel?: string;
  step?: number;
}

// Boolean Question
export interface BooleanQuestion extends QuestionnaireItemBase {
  type: 'boolean';
  trueLabel?: string;
  falseLabel?: string;
}

// Informational Step
export interface InfoStep extends Omit<QuestionnaireItemBase, 'text'> {
  type: 'info_step';
  title?: string | null;
  subtitle?: string | null;
  body?: string | null;
  imageUrl?: string | null;
  buttonText: string;
  condition?: QuestionCondition | null;
}

// Union type for all possible item types
export type QuestionnaireItem = 
  | SingleChoiceQuestion
  | MultipleChoiceQuestion
  | TextInputQuestion
  | TextAreaQuestion
  | ScaleQuestion
  | BooleanQuestion
  | InfoStep;

// Structure of a questionnaire
export interface QuestionnaireStructure {
  items: QuestionnaireItem[];
}

// Type guard functions to narrow types
export function isSingleChoiceQuestion(item: QuestionnaireItem): item is SingleChoiceQuestion {
  return item.type === 'single_choice';
}

export function isMultipleChoiceQuestion(item: QuestionnaireItem): item is MultipleChoiceQuestion {
  return item.type === 'multiple_choice';
}

export function isTextInputQuestion(item: QuestionnaireItem): item is TextInputQuestion {
  return item.type === 'text_input';
}

export function isTextAreaQuestion(item: QuestionnaireItem): item is TextAreaQuestion {
  return item.type === 'text_area';
}

export function isScaleQuestion(item: QuestionnaireItem): item is ScaleQuestion {
  return item.type === 'scale';
}

export function isBooleanQuestion(item: QuestionnaireItem): item is BooleanQuestion {
  return item.type === 'boolean';
}

export function isInfoStep(item: QuestionnaireItem): item is InfoStep {
  return item.type === 'info_step';
}

export function isQuestionItem(item: QuestionnaireItem): boolean {
  return !isInfoStep(item);
}

// Response types
export type QuestionnaireResponses = Record<string, any>;

// Response values for each question type
export type SingleChoiceResponse = string;
export type MultipleChoiceResponse = string[];
export type TextInputResponse = string;
export type TextAreaResponse = string;
export type ScaleResponse = number;
export type BooleanResponse = boolean;

// Response status
export type QuestionnaireStatus = 'not_started' | 'in_progress' | 'completed';

// Questionnaire Response object (renamed from UserQuestionnaireResponse)
export interface QuestionnaireResponse {
  id: string;
  userId: string;
  questionnaireId: string;
  responses: QuestionnaireResponses;
  status: QuestionnaireStatus;
  startedAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

// Questionnaire definition
export interface Questionnaire {
  id: string;
  name: string;
  type: string;
  version: number;
  structure: QuestionnaireItem[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Questionnaire with user response data
export interface QuestionnaireWithResponses extends Questionnaire {
  questionnaireResponse: QuestionnaireResponse | null;
}

// Structure conversion helpers (from DB)
export function parseQuestionnaireStructure(structure: Json): QuestionnaireItem[] {
  if (!Array.isArray(structure)) {
    return [];
  }
  // Safely cast through unknown to avoid TypeScript strict type checking errors
  return structure as unknown as QuestionnaireItem[];
}

// Response conversion helpers (to DB)
export function serializeResponses(responses: QuestionnaireResponses): Json {
  return responses as Json;
}

// DB to Model conversion
export function mapDbQuestionnaireToModel(dbQuestionnaire: any): Questionnaire {
  return {
    id: dbQuestionnaire.id,
    name: dbQuestionnaire.name,
    type: dbQuestionnaire.type,
    version: dbQuestionnaire.version,
    structure: parseQuestionnaireStructure(dbQuestionnaire.structure),
    isActive: dbQuestionnaire.is_active,
    createdAt: dbQuestionnaire.created_at,
    updatedAt: dbQuestionnaire.updated_at
  };
}

export function mapDbResponseToModel(dbResponse: any): QuestionnaireResponse {
  return {
    id: dbResponse.id,
    userId: dbResponse.user_id,
    questionnaireId: dbResponse.questionnaire_id,
    responses: dbResponse.responses as QuestionnaireResponses,
    status: dbResponse.status as QuestionnaireStatus,
    startedAt: dbResponse.started_at,
    completedAt: dbResponse.completed_at,
    createdAt: dbResponse.created_at,
    updatedAt: dbResponse.updated_at
  };
} 