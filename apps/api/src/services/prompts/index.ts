/**
 * Prompt System
 * 
 * This module provides factory functions for creating context-aware system prompts
 * by composing different prompt modules based on the required capabilities.
 */

import { SystemPromptOptions, composeSystemPrompt } from './base.js';
import { DOCUMENT_EDITING_PROMPT, createDocumentContextInfo } from './documentEditing.js';
import { 
  AGENT_PLAYBOOK_PROMPT, 
  PLAYBOOKS,
  createPlaybookContextInfo,
  ORCHESTRATOR_AGENT_PROMPT,
  GENERATOR_AGENT_PROMPT,
  MENTOR_AGENT_PROMPT,
  WEB_SEARCH_AGENT_PROMPT
} from './agentPlaybook.js';

/**
 * Context type constants
 */
export const ContextType = {
  DOCUMENT: 'document',
  PLAYBOOK: 'playbook',
  GENERAL: 'general'
} as const;

/**
 * Playbook type constants
 */
export const PlaybookType = {
  LEAN_CANVAS_CHAPTER1: 'LEAN_CANVAS_CHAPTER1',
  ORCHESTRATOR: 'ORCHESTRATOR',
  GENERATOR: 'GENERATOR',
  MENTOR: 'MENTOR',
  WEB_SEARCH: 'WEB_SEARCH'
} as const;

/**
 * Enhanced options for system prompt creation
 */
export interface SystemPromptConfig extends SystemPromptOptions {
  // Capability flags
  enableDocumentEditing?: boolean;
  enablePlaybook?: boolean;
  
  // Document-specific options
  documentId?: string;
  documentTitle?: string;
  documentContent?: string;
  documentType?: string;
  
  // Playbook-specific options
  playbookType?: keyof typeof PlaybookType;
  playbookId?: string;
  playbookName?: string;
  currentStep?: string;
  stepDescription?: string;
  progress?: number;
}

/**
 * Creates a system prompt using a configuration-based approach
 */
export function createSystemPrompt(config: SystemPromptConfig = {}): string {
  const promptSections: string[] = [];
  const contextInfoSections: string[] = [];
  
  // Add document editing capability if enabled or if contextType is document
  if (config.enableDocumentEditing || config.contextType === ContextType.DOCUMENT) {
    promptSections.push(DOCUMENT_EDITING_PROMPT);
    
    // Add document context if available
    if (config.documentId || config.documentTitle || config.documentContent) {
      contextInfoSections.push(createDocumentContextInfo({
        documentId: config.documentId,
        documentTitle: config.documentTitle,
        documentContent: config.documentContent,
        documentType: config.documentType
      }));
    }
  }
  
  // Add playbook capability if enabled or if contextType is playbook
  if (config.enablePlaybook || config.contextType === ContextType.PLAYBOOK) {
    // If a specific playbook is specified, use that one
    if (config.playbookType && PLAYBOOKS[config.playbookType]) {
      promptSections.push(PLAYBOOKS[config.playbookType]);
    } else {
      // Otherwise use the general playbook prompt
      promptSections.push(AGENT_PLAYBOOK_PROMPT);
    }
    
    // Add playbook context if available
    if (config.playbookId || config.playbookName || config.currentStep) {
      contextInfoSections.push(createPlaybookContextInfo({
        playbookId: config.playbookId,
        playbookName: config.playbookName,
        currentStep: config.currentStep,
        stepDescription: config.stepDescription,
        progress: config.progress
      }));
    }
  }
  
  // Combine all context info sections
  const contextInfo = contextInfoSections.join('\n\n');
  
  // Compose the full prompt
  return composeSystemPrompt(promptSections, contextInfo);
}

// Export constants and functions
export {
  DOCUMENT_EDITING_PROMPT,
  AGENT_PLAYBOOK_PROMPT,
  PLAYBOOKS,
  createDocumentContextInfo,
  createPlaybookContextInfo,
  ORCHESTRATOR_AGENT_PROMPT,
  GENERATOR_AGENT_PROMPT,
  MENTOR_AGENT_PROMPT,
  WEB_SEARCH_AGENT_PROMPT
}; 