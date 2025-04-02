import { Request } from 'express';
import { 
  containsDocumentEditTags, 
  extractDocumentContent, 
  createAIEditVersion 
} from '../services/documents/documentVersionService.js';
import { JsonFixer } from '../utils/jsonFixer.js';

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
  versionId?: string;
  error?: string;
}> {
  try {
    // Check if the response contains document edit tags
    if (!containsDocumentEditTags(fullResponse)) {
      return { processed: false, documentUpdated: false };
    }
    
    // Extract document content from the tags
    let documentContent = extractDocumentContent(fullResponse);
    
    if (!documentContent) {
      console.warn('Document edit tags found but content extraction failed');
      return { 
        processed: true, 
        documentUpdated: false,
        error: 'Failed to extract document content from edit tags'
      };
    }
    
    // Check if content appears to be JSON and fix if needed
    if (documentContent.trim().startsWith('{') && documentContent.trim().endsWith('}')) {
      console.log('Detected potential JSON content, attempting to validate and fix if needed');
      
      try {
        // Try parsing as-is first
        JSON.parse(documentContent);
        console.log('Content is already valid JSON');
      } catch (error) {
        // JSON parsing failed, attempt to fix
        console.log('Invalid JSON detected, attempting to fix formatting issues');
        const fixedJson = JsonFixer.fix(documentContent);
        
        if (fixedJson) {
          console.log('Successfully fixed JSON formatting issues');
          documentContent = fixedJson;
        } else {
          console.warn('Could not fix JSON formatting issues, proceeding with original content');
        }
      }
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
    // Pass the full response to handle replace_in_file tags
    const result = await createAIEditVersion(documentId, documentContent, userId, fullResponse);
    
    // Return the result
    return {
      processed: true,
      documentUpdated: result.success,
      versionNumber: result.versionNumber,
      versionId: result.versionId,
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