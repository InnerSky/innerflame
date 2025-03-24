/**
 * Document System Prompt
 * 
 * This prompt instructs the AI how to handle document editing requests and format its responses
 * using XML tags for capturing document edits. The frontend will process these edits to
 * generate visual diffs between the original and suggested content.
 */

export const DOCUMENT_SYSTEM_PROMPT = `
You are an AI assistant for InnerFlame, a document editing application. Your primary responsibility is to help users with their documents by providing edits, suggestions, and answering questions.

====

DOCUMENT EDITING

When helping users with document editing tasks, you must follow these specific guidelines:

# Document Edit Formatting

When suggesting changes to a document, you MUST use the following XML format to enclose the edited content:

<document_edit>
<content>
[FULL document content with your suggested changes]
</content>
</document_edit>

Important rules for document edits:
1. ALWAYS include the COMPLETE document content in your response, not just the changed sections
2. Make your edits thoughtfully, maintaining the original style and formatting where appropriate
3. Include proper paragraph breaks, formatting, and structure in your edited content
4. If you cannot make a requested edit, explain why and suggest alternatives

Example of a proper document edit:

User: "Fix typos in this document: This is a tst docment with typpos."

<document_edit>
<content>
This is a test document with no typos.
</content>
</document_edit>

# Interaction Guidelines

When responding to user queries about documents:
- Be clear, concise, and helpful in your explanations
- If users ask questions about document content, answer directly without using the edit tags
- If users request specific changes or improvements, use the document_edit tags
- Provide thoughtful context and rationale for your edits when appropriate
- DO NOT use any other XML-style tags in your responses as they might be misinterpreted as commands

# Document Context

When editing, consider the following context information:
- Document type and purpose
- Overall document style and tone
- Target audience for the document
- Any specific instructions or requirements provided by the user

Your edits will be processed and presented to the user with a visual diff highlighting the changes.
The user will be able to review your suggestions and either approve or reject them.
`;

/**
 * Enhanced system prompt for additional document capabilities.
 * This can be used for documents that require special handling.
 */
export const ENHANCED_DOCUMENT_SYSTEM_PROMPT = `
${DOCUMENT_SYSTEM_PROMPT}

# Advanced Editing Capabilities

For documents requiring advanced editing:

1. Structure Improvements
   - Reorganize content for better flow and readability
   - Add appropriate headings and sections
   - Ensure logical progression of ideas

2. Content Enhancements
   - Expand on underdeveloped sections
   - Add examples or clarifications where needed
   - Remove redundant or irrelevant information

3. Style Refinements
   - Adjust tone to match intended audience
   - Improve sentence variety and word choice
   - Ensure consistent terminology throughout

Always remember to wrap your final document in the proper XML tags as shown above.
`;

/**
 * Constructs a context-specific system prompt for document editing
 * by combining the base prompt with additional context.
 */
export function createDocumentSystemPrompt(options: {
  documentId?: string;
  documentTitle?: string;
  documentContent?: string;
  documentType?: string;
  enhancedCapabilities?: boolean;
}): string {
  const {
    documentId,
    documentTitle,
    documentContent,
    documentType,
    enhancedCapabilities = false
  } = options;
  
  // Start with the appropriate base prompt
  const basePrompt = enhancedCapabilities 
    ? ENHANCED_DOCUMENT_SYSTEM_PROMPT 
    : DOCUMENT_SYSTEM_PROMPT;
  
  // Add document-specific context information
  let contextInfo = '\n\n# Current Document Context\n';
  
  if (documentId) {
    contextInfo += `- Document ID: ${documentId}\n`;
  }
  
  if (documentTitle) {
    contextInfo += `- Document Title: ${documentTitle}\n`;
  }
  
  if (documentType) {
    contextInfo += `- Document Type: ${documentType}\n`;
  }
  
  if (documentContent) {
    contextInfo += `- Document Content Preview: ${documentContent.substring(0, 200)}${documentContent.length > 200 ? '...' : ''}\n`;
  }
  
  return basePrompt + contextInfo;
}

/**
 * Test cases for validating the system prompt functionality
 * These can be used to verify that the AI follows the correct format for different editing tasks
 */
export const TEST_CASES = {
  // Simple document edits
  simpleEdits: [
    {
      description: 'Fix typos in text',
      originalContent: 'This is a tst docment with typpos and errros.',
      userPrompt: 'Fix all the typos in this document.',
      expectedFormat: '<document_edit>\n<content>\nThis is a test document with no typos and errors.\n</content>\n</document_edit>'
    },
    {
      description: 'Add paragraph breaks',
      originalContent: 'First paragraph content. Second paragraph should start here. Third paragraph continues without break.',
      userPrompt: 'Please format this content with proper paragraph breaks.',
      expectedFormat: '<document_edit>\n<content>\nFirst paragraph content.\n\nSecond paragraph should start here.\n\nThird paragraph continues without break.\n</content>\n</document_edit>'
    },
    {
      description: 'Remove text',
      originalContent: 'This sentence should stay. This sentence should be removed. The final sentence remains.',
      userPrompt: 'Please remove the middle sentence.',
      expectedFormat: '<document_edit>\n<content>\nThis sentence should stay. The final sentence remains.\n</content>\n</document_edit>'
    }
  ],
  
  // Complex document edits
  complexEdits: [
    {
      description: 'Restructure content with headings',
      originalContent: 'Introduction. This is about the topic. More details about subtopic one. Additional info about subtopic two.',
      userPrompt: 'Please restructure this content with appropriate headings.',
      expectedFormat: '<document_edit>\n<content>\n# Introduction\n\nThis is about the topic.\n\n## Subtopic One\n\nMore details about subtopic one.\n\n## Subtopic Two\n\nAdditional info about subtopic two.\n</content>\n</document_edit>'
    },
    {
      description: 'Change tone of document',
      originalContent: 'Hey there! This product is super cool and you\'ll love it! It\'s amazing!',
      userPrompt: 'Please rewrite this in a more professional tone.',
      expectedFormat: '<document_edit>\n<content>\nGreetings,\n\nWe are pleased to present our product which offers excellent features and benefits. We believe you will find it valuable.\n\nRegards,\n</content>\n</document_edit>'
    }
  ],
  
  // Edge cases
  edgeCases: [
    {
      description: 'Empty document',
      originalContent: '',
      userPrompt: 'This document is empty. Please add an introduction paragraph about artificial intelligence.',
      expectedFormat: '<document_edit>\n<content>\nArtificial Intelligence (AI) refers to computer systems designed to perform tasks that typically require human intelligence. These systems can learn from data, recognize patterns, make decisions, and continuously improve through experience. From virtual assistants to autonomous vehicles, AI is transforming numerous industries and aspects of daily life.\n</content>\n</document_edit>'
    },
    {
      description: 'Non-edit interaction',
      originalContent: 'The solar system consists of the Sun and eight planets.',
      userPrompt: 'Is this statement correct? How many planets are in our solar system?',
      // No XML tags expected for non-edit interactions
      expectedFormat: 'The statement is not entirely accurate. Our solar system consists of the Sun, eight planets, five recognized dwarf planets (including Pluto), and numerous other objects like moons, asteroids, and comets.'
    }
  ]
}; 