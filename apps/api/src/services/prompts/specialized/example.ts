/**
 * Example of extending the prompt system with specialized prompts
 * 
 * This file demonstrates how to add new specialized capabilities to the prompt system.
 * It is not used in production, but serves as a template for future extensions.
 */

import { SystemPromptOptions, composeSystemPrompt } from '../base.js';
import { DOCUMENT_EDITING_PROMPT } from '../documentEditing.js';

/**
 * Example of a specialized prompt for financial document analysis
 */
export const FINANCIAL_ANALYSIS_PROMPT = `
FINANCIAL DOCUMENT ANALYSIS

When analyzing financial documents, follow these guidelines:

# Data Extraction

Extract key financial metrics such as:
- Revenue figures
- Expense categories
- Profit margins
- Growth rates
- Year-over-year comparisons

# Analysis Format

Present your analysis in a structured format:
1. Executive Summary: 1-2 sentence overview
2. Key Metrics: Extracted and calculated values
3. Trends: Identified patterns and trajectory
4. Recommendations: Actionable insights based on the data

# Visualization Instructions

When suggesting visualizations, specify:
- Chart type (bar, line, pie, etc.)
- Data points to include
- Appropriate labels and scales
- Color scheme recommendations
`;

/**
 * Example of how to extend the prompt system with specialized capabilities
 */
export function createFinancialAnalysisPrompt(
  documentContent: string,
  additionalContext?: Record<string, any>
): string {
  // Combine our specialized prompt with document editing capabilities
  const sections = [DOCUMENT_EDITING_PROMPT, FINANCIAL_ANALYSIS_PROMPT];
  
  // Create context information
  let contextInfo = '# Financial Document Context\n';
  
  // Increase preview size to approximately 5000 tokens (about 20,000 characters)
  // The average token is roughly 4 characters, so 20,000 is a reasonable estimate
  const previewLength = 20000;
  contextInfo += `- Document Content: ${documentContent.substring(0, previewLength)}${documentContent.length > previewLength ? '...' : ''}\n`;
  
  if (additionalContext) {
    contextInfo += '\n# Additional Context\n';
    
    Object.entries(additionalContext).forEach(([key, value]) => {
      contextInfo += `- ${key}: ${value}\n`;
    });
  }
  
  return composeSystemPrompt(sections, contextInfo);
} 