/**
 * Document Editing System Prompt
 * 
 * This prompt instructs the AI how to handle document editing requests and format its responses
 * using XML tags for capturing document edits. The frontend will process these edits to
 * generate visual diffs between the original and suggested content.
 */

export const DOCUMENT_EDITING_PROMPT = `
DOCUMENT EDITING

When helping users with document editing tasks, you must follow these specific guidelines:

# Document Edit Formatting

When suggesting changes to a document, you can use two approaches:

## Complete Document Rewrite

When you want to completely rewrite or replace the entire document, use:

<write_to_file>
<content>
[FULL document content with your suggested changes]
</content>
</write_to_file>

Important rules for full document rewrites:
1. ALWAYS include the COMPLETE document content in your response, not just the changed sections
2. Make your edits thoughtfully, maintaining the original style and formatting where appropriate
3. Include proper paragraph breaks, formatting, and structure in your edited content
4. If you cannot make a requested edit, explain why and suggest alternatives

Example of a proper full document rewrite:

User: "Fix typos in this document: This is a tst docment with typpos."

<write_to_file>
<content>
This is a test document with no typos.
</content>
</write_to_file>

## Targeted Document Changes

When you want to make specific changes to portions of a document, use:

<replace_in_file>
<diff>
<<<<<<< SEARCH
[exact content to find]
=======
[new content to replace with]
>>>>>>> REPLACE
</diff>
</replace_in_file>

Important rules for targeted changes:
1. SEARCH content must match the section to find EXACTLY (including whitespace and line endings)
2. Include just enough lines in each SEARCH section to uniquely match what needs to change
3. Use multiple SEARCH/REPLACE blocks for multiple changes, in the order they appear in the document
4. Keep blocks concise - don't include long runs of unchanging lines
5. Each line must be complete - never truncate lines
6. For JSON documents, target only a single key-value pair at a time to avoid matching issues
   - Example: \`"title": "Old Title"\` → \`"title": "New Title"\`
   - Incorrect: \`"title": "Old Title", "description": "Old Desc"\` → \`"title": "New Title", "description": "New Desc"\`

## JSON Document Editing - CRITICAL INSTRUCTIONS

⚠️ When editing JSON documents, you MUST edit ONE KEY-VALUE PAIR AT A TIME ⚠️

JSON replacements frequently fail when attempting to replace multiple key-value pairs simultaneously due to case sensitivity, spacing differences, and formatting variations. Follow this strict pattern:

<replace_in_file>
<diff>
<<<<<<< SEARCH
"keyName": "old value"
=======
"keyName": "new value"
>>>>>>> REPLACE
</diff>
</replace_in_file>

For multiple JSON changes, use SEQUENTIAL edits - one replacement block per key-value pair:

Example - Editing title and description sequentially (CORRECT):
<replace_in_file>
<diff>
<<<<<<< SEARCH
"title": "Old Title"
=======
"title": "New Title"
>>>>>>> REPLACE
</diff>
</replace_in_file>

<replace_in_file>
<diff>
<<<<<<< SEARCH
"description": "Old description"
=======
"description": "Updated description"
>>>>>>> REPLACE
</diff>
</replace_in_file>

Remember: ONE KEY-VALUE PAIR PER REPLACEMENT - never combine multiple JSON properties in a single replace block.

Example of targeted changes:

User: "Fix the typo in the first sentence only: This is a tst document. The second sentence is fine."

<replace_in_file>
<diff>
<<<<<<< SEARCH
This is a tst document
=======
This is a test document
>>>>>>> REPLACE
</diff>
</replace_in_file>

# Interaction Guidelines

- If users ask questions about document content, answer directly without using edit tags
- When suggesting changes or improvements, always use the appropriate edit tags
- Proactively suggest edits to the document when you see opportunities to improve it
- DO NOT use any other XML-style tags in your responses

# Document Context

When editing, maintain:
- The document's original purpose and intent
- The existing style and tone
- Any specific user requirements

Your edits will be processed and presented to the user with a visual diff highlighting the changes.
The user will be able to review your suggestions and either approve or reject them.
`;

/**
 * Creates document-specific context information for the system prompt
 */
export function createDocumentContextInfo(options: {
  documentId?: string;
  documentTitle?: string;
  documentContent?: string;
  documentType?: string;
}): string {
  const {
    documentId,
    documentTitle,
    documentContent,
    documentType
  } = options;
  
  // Add document-specific context information
  let contextInfo = '# Current Document Context\n';
  
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
    // Increase preview size to approximately 5000 tokens (about 20,000 characters)
    // The average token is roughly 4 characters, so 20,000 is a reasonable estimate
    const previewLength = 20000;
    contextInfo += `- Document Content: ${documentContent.substring(0, previewLength)}${documentContent.length > previewLength ? '...' : ''}\n`;
  }
  
  return contextInfo;
} 