import { createAgent } from '../ai/agent.js';
import { initializeLLMProvider, initializeLLMAdapter } from '../ai/agent.js';
import { createClient } from '@supabase/supabase-js';
import { PlaybookType } from '../prompts/index.js';
import type { Database } from '@innerflame/types';
import type { AgentContext } from '@innerflame/ai-tools/src/langgraph/types.js';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';
const supabase = createClient<Database>(supabaseUrl, supabaseKey);

/**
 * Create a history summary from message IDs
 * 
 * This function creates a history entry with empty content,
 * updates the messages with the history ID reference,
 * and then starts the background processing.
 */
export async function createHistorySummary(messageIds: string[], userId: string) {
  try {
    // 1. Create history entry with empty content matching the new structure
    const { data: history, error: historyError } = await supabase
      .from('history')
      .insert({
        user_id: userId,
        content: { 
          title: '', 
          overview: '', 
          headline: '', 
          quote: '', 
          insights: [] 
        } // Empty initial structure for new format
      })
      .select('id')
      .single();
      
    if (historyError) throw historyError;
    
    // 2. Update messages with history reference
    // Note: Type casting to any as the generated types may not include the new column yet
    const { error: updateError } = await supabase
      .from('messages')
      .update({ 
        inhistory_id: history.id // Corrected column name to lowercase
      } as any)
      .in('id', messageIds);
      
    if (updateError) {
      console.error('Failed to update messages with history ID:', updateError);
      // Continue processing even if update fails
    }
      
    // 3. Process in background
    processHistorySummary(messageIds, history.id, userId)
      .catch(error => console.error('Background processing error:', error));
    
    return { historyId: history.id };
  } catch (error) {
    console.error('Failed to create history summary:', error);
    throw error;
  }
}

/**
 * Process a history summary in the background
 * 
 * This function fetches the messages, processes them with the LLM,
 * and updates the history entry with the generated content.
 */
async function processHistorySummary(messageIds: string[], historyId: string, userId: string) {
  try {
    console.log(`Processing history summary for ${messageIds.length} messages...`);
    
    // 1. Fetch messages
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('content, sender_type, created_at')
      .in('id', messageIds)
      .order('created_at', { ascending: true });
      
    if (messagesError) throw messagesError;
    
    if (!messages || messages.length === 0) {
      throw new Error('No messages found');
    }
    
    // 2. Format messages for the LLM
    const formattedMessages = messages.map(msg => 
      `${msg.sender_type}: ${msg.content}`
    ).join('\n\n');
    
    // 3. Initialize LLM components
    const provider = initializeLLMProvider();
    const llmAdapter = initializeLLMAdapter(provider);
    
    // 4. Create and run the agent
    const agent = createAgent(
      llmAdapter, 
      [], // No tools needed
      PlaybookType.MESSAGE_TO_HISTORY
    );
    
    const input = `Please summarize the following conversation in JSON format according to the specifications provided in your system prompt (MESSAGE_TO_HISTORY_AGENT_PROMPT):\n\n${formattedMessages}`;
    
    // Create a context object that satisfies the AgentContext interface
    const context: AgentContext = { 
      userId, 
      contextType: 'general' // Using general contextType which is valid
    };
    
    const result = await agent(input, context);
    
    // 5. Parse and save the result
    let content: {
      title: string;
      overview: string;
      headline: string;
      quote: string;
      insights: string[];
    };
    try {
      // Look for JSON in the response
      const lastMessage = result.messages[result.messages.length - 1].content;
      const jsonMatch = lastMessage.match(/```json\n([\s\S]*?)\n```|{[\s\S]*}/);
      
      let parsedJson: any;
      if (jsonMatch) {
        parsedJson = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      } else {
        // If no JSON block is found, attempt to parse the entire content as JSON
        // This can happen if the LLM doesn't use the markdown block
        try {
          parsedJson = JSON.parse(lastMessage);
        } catch (e) {
          console.warn('Failed to parse entire message as JSON, attempting fallback extraction for history summary.');
          // Fallback will be handled below if parsedJson remains undefined
        }
      }

      if (parsedJson && 
          typeof parsedJson.title === 'string' &&
          typeof parsedJson.overview === 'string' &&
          typeof parsedJson.headline === 'string' &&
          typeof parsedJson.quote === 'string' &&
          Array.isArray(parsedJson.insights) &&
          parsedJson.insights.every((item: any) => typeof item === 'string')) {
        content = parsedJson;
      } else {
        // Fallback or if JSON structure is incorrect: 
        // Try to extract fields manually - This is a simplified fallback
        // and relies on the LLM producing somewhat structured text if not perfect JSON.
        // For a more robust solution, ensure the LLM strictly follows the JSON output format.
        console.warn('LLM did not return the expected JSON structure for history summary. Attempting manual extraction (this might be inaccurate).');
        const messageContent = lastMessage;
        
        const titleMatch = messageContent.match(/"title":\s*"([^"]*)"/i);
        const overviewMatch = messageContent.match(/"overview":\s*"((?:[^"]|\\")*)"/i); // Handle escaped quotes
        const headlineMatch = messageContent.match(/"headline":\s*"([^"]*)"/i);
        const quoteMatch = messageContent.match(/"quote":\s*"((?:[^"]|\\")*)"/i); // Handle escaped quotes
        const insightsMatch = messageContent.match(/"insights":\s*(\[(?:\s*(?:"(?:[^"]|\\")*")(?:\s*,\s*(?:"(?:[^"]|\\")*"))*\s*)?\])/i);

        let insightsArray: string[] = [];
        if (insightsMatch && insightsMatch[1]) {
          try {
            insightsArray = JSON.parse(insightsMatch[1]);
            if (!Array.isArray(insightsArray) || !insightsArray.every(item => typeof item === 'string')) {
              insightsArray = ['Could not extract insights reliably.'];
            }
          } catch (e) {
            insightsArray = ['Error parsing insights array.'];
          }
        }

        content = {
          title: titleMatch && titleMatch[1] ? titleMatch[1].replace(/\\"/g, '"') : 'Summary Title',
          overview: overviewMatch && overviewMatch[1] ? overviewMatch[1].replace(/\\"/g, '"') : 'Could not extract overview.',
          headline: headlineMatch && headlineMatch[1] ? headlineMatch[1].replace(/\\"/g, '"') : 'Spotlight Headline',
          quote: quoteMatch && quoteMatch[1] ? quoteMatch[1].replace(/\\"/g, '"') : 'No specific quote highlighted.',
          insights: insightsArray.length > 0 ? insightsArray : ['No specific insights highlighted.']
        };
      }
      
      // Ensure all fields have default values if anything went wrong during parsing/extraction
      content = {
        title: content.title || "Conversation Title",
        overview: content.overview || "Summary of the conversation.",
        headline: content.headline || "Key takeaway from the conversation.",
        quote: content.quote || "", // Empty string if no quote
        insights: (Array.isArray(content.insights) && content.insights.length > 0) ? content.insights : ["General insights about the discussion."],
      };
      
    } catch (e) {
      console.error('Failed to parse agent response for history summary:', e);
      content = {
        title: 'Error Generating Title',
        overview: 'Error generating summary. Could not parse the content from the AI.',
        headline: 'Error Generating Spotlight',
        quote: '',
        insights: ['Summary could not be generated due to a parsing error.']
      };
    }
    
    console.log(`Successfully generated summary for history ${historyId}:`, JSON.stringify(content).substring(0, 200) + "...");
    
    // 6. Update the history row
    const { error: updateError } = await supabase
      .from('history')
      .update({ content })
      .eq('id', historyId);
      
    if (updateError) {
      throw updateError;
    }
  } catch (error) {
    console.error('Background processing error:', error);
    
    // Update history with error state
    await supabase
      .from('history')
      .update({ 
        content: { 
          title: 'Error Processing Title',
          overview: 'Error generating summary. An error occurred during the background processing task.', 
          headline: 'Error Processing Spotlight',
          quote: '',
          insights: ['An error occurred during summary generation.'] 
        } 
      })
      .eq('id', historyId);
  }
} 