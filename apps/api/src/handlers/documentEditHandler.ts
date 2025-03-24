import { Request } from 'express';
import { 
  containsDocumentEditTags, 
  extractDocumentContent, 
  createAIEditVersion 
} from '../services/documents/documentVersionService.js';

/**
 * Process a document edit from a completed message
 */
export async function processDocumentEdit(
  req: Request,
  fullResponse: string
): Promise<{ 
  processed: boolean; 
  documentUpdated: boolean; 
  versionNumber?: number;
  error?: string;
}> {
  try {
    // Check if the response contains document edit tags
    if (!containsDocumentEditTags(fullResponse)) {
      return { processed: false, documentUpdated: false };
    }
    
    // Extract document content from the tags
    const documentContent = extractDocumentContent(fullResponse);
    
    if (!documentContent) {
      console.warn('Document edit tags found but content extraction failed');
      return { 
        processed: true, 
        documentUpdated: false,
        error: 'Failed to extract document content from edit tags'
      };
    }
    
    // Get document context from the request
    const { userId, documentId } = req.body;
    
    // Validate required parameters
    if (!userId || !documentId) {
      console.warn('Missing required parameters for document edit processing');
      return { 
        processed: true, 
        documentUpdated: false,
        error: 'Missing required parameters (userId or documentId)'
      };
    }
    
    // Create a new document version with the extracted content
    const result = await createAIEditVersion(documentId, documentContent, userId);
    
    // Return the result
    return {
      processed: true,
      documentUpdated: result.success,
      versionNumber: result.versionNumber,
      error: result.error
    };
    
  } catch (error) {
    console.error('Error processing document edit:', error);
    return {
      processed: true,
      documentUpdated: false,
      error: error instanceof Error ? error.message : 'Unknown error processing document edit'
    };
  }
} 