/**
 * Example API call to Anthropic's Claude for agent-assisted document editing
 * This demonstrates how to implement our context-based diff approach with Claude
 */

// Import required libraries
import axios from 'axios';
import * as dotenv from 'dotenv';
dotenv.config();

// API Configuration
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const API_URL = 'https://api.anthropic.com/v1/messages';

/**
 * Make an API call to Claude for document editing assistance
 * @param {string} userId - The ID of the current user
 * @param {string} documentId - The ID of the personal philosophy document
 * @param {string} userMessage - The user's message requesting changes
 * @param {object} documentContent - The current content of the document
 * @param {array} messageHistory - Previous messages in the conversation
 * @returns {Promise<object>} - Claude's response with suggested changes
 */
async function getDocumentEditSuggestions(userId, documentId, userMessage, documentContent, messageHistory) {
  // Construct the full conversation history
  const messages = [
    ...messageHistory,
    {
      role: 'user',
      content: [
        {
          type: 'text',
          text: 'Here is my current personal philosophy document. I\'d like your guidance on improving it.'
        },
        {
          type: 'document',
          title: 'Personal Philosophy',
          source: {
            type: 'content',
            content: JSON.stringify(documentContent)
          },
        }
      ]
    },
    {
      role: 'user',
      content: userMessage
    }
  ];

  // Define the tools available to Claude
  const tools = [
    {
      name: "suggest_document_changes",
      description: "Suggest changes to a user's document using context-based diffs",
      input_schema: {
        type: "object",
        properties: {
          entity_type: {
            type: "string",
            description: "Type of entity being modified (e.g., 'personal_philosophy', 'canvas', etc.)"
          },
          entity_id: {
            type: "string",
            description: "Unique identifier for the entity"
          },
          changes: {
            type: "array",
            description: "Array of changes to make to the document",
            items: {
              type: "object",
              properties: {
                section: {
                  type: "string",
                  description: "Section of the document being changed"
                },
                context_before: {
                  type: "string",
                  description: "Text that comes before the change to establish context"
                },
                new_content: {
                  type: "string",
                  description: "The new content that should replace the old content"
                },
                context_after: {
                  type: "string",
                  description: "Text that comes after the change to establish context"
                }
              },
              required: ["section", "context_before", "new_content", "context_after"]
            }
          },
          reasoning: {
            type: "string",
            description: "Explanation for why these changes are being suggested"
          }
        },
        required: ["entity_type", "entity_id", "changes", "reasoning"]
      }
    }
  ];

  // System message that defines Claude's role and behavior
  const systemMessage = `
You are an AI mentor helping founders develop their personal philosophy and business thinking. 
Your role is to provide thoughtful guidance and suggest improvements to their documents.

When suggesting changes to a document:
1. Use context-based diffs similar to code editors
2. For each change, include the surrounding text before and after to establish context
3. Suggest substantive improvements that clarify thinking or deepen insights
4. Provide clear reasoning for each suggested change
5. Be mindful of the user's voice and style - enhance, don't override

You have access to the user's document content and can suggest specific changes using the suggest_document_changes tool.
The user can review your suggestions with additions highlighted in green and removals in red.
`;

  // Build the API request
  const requestBody = {
    model: "claude-3-opus-20240229",
    messages: messages,
    system: systemMessage,
    tools: tools,
    max_tokens: 4000,
    temperature: 0.7,
    tool_choice: { type: "any" },
    metadata: {
      user_id: userId
    }
  };

  try {
    // Make the API call
    const response = await axios.post(API_URL, requestBody, {
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      }
    });

    return response.data;
  } catch (error) {
    console.error('Error calling Anthropic API:', error);
    // Print more detailed error information
    if (error.response) {
      console.error('Error details:', JSON.stringify(error.response.data, null, 2));
    }
    throw error;
  }
}

// Example usage
async function main() {
  const userId = 'user-123';
  const documentId = 'doc-456';
  
  // Sample document content (personal philosophy)
  const documentContent = {
    title: "My Founder Philosophy",
    sections: [
      {
        id: "purpose",
        title: "Purpose",
        content: "My purpose as a founder is to create technology that makes a difference in people's lives. I want to solve real problems and make the world better through innovation."
      },
      {
        id: "values",
        title: "Core Values",
        content: "Integrity, innovation, and empathy guide my decisions. I believe in being honest with myself and others, pushing boundaries with new ideas, and understanding the needs of users."
      },
      {
        id: "approach",
        title: "Approach to Business",
        content: "I focus on building sustainable businesses that create value for customers and shareholders. Growth is important but not at the expense of quality or vision."
      }
    ],
    last_updated: "2025-04-05T14:30:00Z"
  };
  
  // Sample message history
  const messageHistory = [
    {
      role: 'assistant',
      content: "I've reviewed your personal philosophy. It has a good foundation. How would you like to improve it?"
    }
  ];
  
  // User's current message
  const userMessage = "I feel like my approach to business section is too generic. Can you help me make it more specific to my belief in validation-first product development?";
  
  // Get Claude's response
  const claudeResponse = await getDocumentEditSuggestions(
    userId,
    documentId,
    userMessage,
    documentContent,
    messageHistory
  );
  
  console.log('Claude Response:', JSON.stringify(claudeResponse, null, 2));
  
  // Example of what Claude's response might look like
  const exampleToolUse = {
    role: "assistant",
    content: "I'd be happy to help make your approach to business section more specific to validation-first product development. Here's my suggestion for how to revise that section to better reflect your philosophy:",
    tool_use: {
      name: "suggest_document_changes",
      input: {
        entity_type: "personal_philosophy",
        entity_id: "doc-456",
        changes: [
          {
            section: "approach",
            context_before: "I focus on building sustainable businesses that",
            new_content: "I focus on building sustainable businesses through validation-first development. I believe in testing hypotheses with real users before building full solutions. This approach helps me create products that",
            context_after: "create value for customers and shareholders. Growth is important but not at the expense of quality or vision."
          }
        ],
        reasoning: "This change specifically addresses your request to emphasize validation-first product development. It introduces the concept of testing hypotheses with users before building, which is a key principle of validation-first approaches. The edit maintains your original emphasis on value creation and sustainable growth while making your methodology more explicit."
      }
    }
  };
  
  // Example of how to process and store the changes
  function processChanges(response) {
    if (response.tool_use && response.tool_use.name === "suggest_document_changes") {
      // In a real implementation, you would:
      // 1. Store the suggested changes in the messages table
      // 2. Create a reference to the document in message_references
      // 3. Display the changes to the user with appropriate highlighting
      // 4. If accepted, create a new version in entity_versions
      
      console.log('Changes to store in database:');
      console.log(JSON.stringify(response.tool_use.input, null, 2));
      
      return {
        messageId: 'msg-' + Date.now(),
        hasProposedChanges: true,
        proposedEntityChanges: response.tool_use.input,
        displayThreadId: 'thread-789',
        // Additional fields for storage...
      };
    }
    
    return null;
  }
  
  // Process the example response
  const processedChanges = processChanges(exampleToolUse);
  console.log('Processed for storage:', processedChanges);
}

// Run the example
main().catch(console.error); 