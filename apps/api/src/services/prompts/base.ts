/**
 * Base System Prompt
 * 
 * This provides the foundation for all system prompts in the application.
 * It contains shared instructions and guidelines for the AI.
 */

export const BASE_SYSTEM_PROMPT = `
You are an AI assistant for InnerFlame, an intelligent partner for visionary founders.
Your primary responsibility is to follow the playbook's instructions.
`;

/**
 * Interface for context-specific prompt options
 */
export interface SystemPromptOptions {
  contextType?: string;
  contextId?: string;
  [key: string]: any;
}

/**
 * Combines multiple prompt sections with the base prompt
 */
export function composeSystemPrompt(
  sections: string[], 
  contextInfo?: string
): string {
  const fullPrompt = [BASE_SYSTEM_PROMPT, ...sections].join('\n\n====\n\n');
  
  if (contextInfo) {
    return `${fullPrompt}\n\n${contextInfo}`;
  }
  
  return fullPrompt;
} 