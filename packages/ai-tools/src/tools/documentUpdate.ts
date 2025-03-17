/**
 * Document update tool for AI agents
 */
import { createSupabaseClient } from '@innerflame/utils/supabase.js';
import type { Document } from '@innerflame/types/document.js';

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