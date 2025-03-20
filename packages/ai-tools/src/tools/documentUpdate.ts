/**
 * Document update tool for AI agents
 */
import { createSupabaseClient } from '@innerflame/utils/supabase.js';
import type { Document } from '@innerflame/types/document.js';
import { z } from 'zod';
import { AgentTool, AgentContext } from '../langgraph/types.js';

/**
 * Updates a document based on AI tool call
 */
export async function updateDocumentFromToolCall(
  documentId: string,
  updates: Record<string, unknown>,
  userId: string
): Promise<Document> {
  const supabase = createSupabaseClient();

  // Get the current document
  const { data: document, error: getError } = await supabase
    .from('documents')
    .select('*')
    .eq('id', documentId)
    .single();

  if (getError) {
    throw new Error(`Failed to retrieve document: ${getError.message}`);
  }

  // Create a new version
  const { data: newVersion, error: versionError } = await supabase
    .from('document_versions')
    .insert({
      document_id: documentId,
      version: document.version + 1,
      content: updates,
      created_by: userId,
      timestamp: new Date().toISOString()
    })
    .select()
    .single();

  if (versionError) {
    throw new Error(`Failed to create document version: ${versionError.message}`);
  }

  // Update the document
  const { data: updatedDocument, error: updateError } = await supabase
    .from('documents')
    .update({
      version: document.version + 1,
      updated_at: new Date().toISOString()
    })
    .eq('id', documentId)
    .select()
    .single();

  if (updateError) {
    throw new Error(`Failed to update document: ${updateError.message}`);
  }

  return updatedDocument as unknown as Document;
}

/**
 * Document update tool for the LangGraph agent
 * 
 * This tool allows the agent to update a document's content.
 */

// Schema for the document update tool parameters
export const DocumentUpdateSchema = z.object({
  documentId: z.string().describe('The ID of the document to update'),
  content: z.string().describe('The new content for the document'),
  reason: z.string().describe('Reason for the update')
});

export type DocumentUpdateParams = z.infer<typeof DocumentUpdateSchema>;

/**
 * Document update tool for the agent
 */
export const createDocumentUpdateTool = (): AgentTool => {
  return {
    name: 'updateDocument',
    description: 'Update the content of a document with new information',
    parameters: DocumentUpdateSchema,
    handler: async (args: Record<string, any>, context: AgentContext) => {
      // Cast the args to our expected type
      const params = args as DocumentUpdateParams;
      
      // In a real implementation, this would call a database service to update the document
      // For now, we'll just return a success message
      
      if (!params.documentId) {
        throw new Error('Document ID is required');
      }
      
      if (!params.content) {
        throw new Error('Document content is required');
      }
      
      // Check that the document ID matches the current context
      if (context.contextType === 'document' && context.documentId !== params.documentId) {
        throw new Error(`Cannot update document ${params.documentId} from context of document ${context.documentId}`);
      }
      
      console.log(`Updating document ${params.documentId} with new content`);
      console.log(`Reason: ${params.reason}`);
      
      // Return a success message
      return {
        success: true,
        documentId: params.documentId,
        message: `Document updated successfully: ${params.reason}`
      };
    }
  };
}; 