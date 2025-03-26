/**
 * Document System Prompt
 * 
 * This file is kept for backward compatibility and forwards to the new prompt system.
 * Please use the new prompt system from '../prompts' in new code.
 * 
 * @deprecated Use the prompt system in '../prompts' instead
 */

import { createSystemPrompt, ContextType, DOCUMENT_EDITING_PROMPT } from '../prompts/index.js';
import { createDocumentContextInfo } from '../prompts/documentEditing.js';

// Re-export for backward compatibility
export const DOCUMENT_SYSTEM_PROMPT = DOCUMENT_EDITING_PROMPT;

/**
 * Constructs a context-specific system prompt for document editing
 * @deprecated Use createSystemPrompt from '../prompts' instead
 */
export function createDocumentSystemPrompt(options: {
  documentId?: string;
  documentTitle?: string;
  documentContent?: string;
  documentType?: string;
}): string {
  return createSystemPrompt({
    contextType: ContextType.DOCUMENT,
    ...options
  });
}
