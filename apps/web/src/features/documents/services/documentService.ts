import { DocumentRepository } from '../repositories/documentRepository.js';
import { Document, DocumentType } from '../models/document.js';
import { MessageService } from './messageService.js';
import { MessageContextType } from '@innerflame/types';

// Singleton instance
let instance: DocumentService | null = null;

export class DocumentService {
  private repository: DocumentRepository;
  
  constructor() {
    this.repository = new DocumentRepository();
  }
  
  // Get singleton instance
  static getInstance(): DocumentService {
    if (!instance) {
      instance = new DocumentService();
    }
    return instance;
  }
  
  /**
   * Delete a document and handle related cleanup
   * 
   * @param documentId - The ID of the document to delete
   * @param options - Additional options for deletion
   * @returns Promise resolving when deletion is complete
   */
  async deleteDocument(
    documentId: string, 
    options: {
      userId?: string;
      cascadeRelated?: boolean; // Whether to delete related items (like child documents)
      skipVersions?: boolean; // Whether to skip deleting versions (rare use case)
    } = {}
  ): Promise<void> {
    const { userId, cascadeRelated = true, skipVersions = false } = options;
    
    try {
      // Check if document is a project and has documents
      if (cascadeRelated && userId) {
        // First check if this is a project
        const document = await this.repository.getDocumentWithVersions(documentId);
        if (document?.entityType === DocumentType.Project) {
          // Delete all documents in this project first
          const projectDocs = await this.repository.getDocumentsByProject(userId, documentId);
          for (const doc of projectDocs) {
            // Recursive call, but skip checking for nested projects to avoid infinite loops
            await this.deleteDocument(doc.id, { ...options, cascadeRelated: false });
          }
        }
      }
      
      // Delete all messages associated with this document
      await this.deleteAssociatedMessages(documentId);
      
      // Delete the document itself
      await this.repository.deleteDocument(documentId);
      
      // Note: The repository.deleteDocument method already handles version deletion,
      // so skipVersions is included here for future flexibility
      
      // Additional extension point for future needs:
      // - Cleaning up references from other documents
      // - Audit logging
      // - etc.
    } catch (error) {
      console.error(`Error deleting document ${documentId}:`, error);
      throw new Error(`Failed to delete document: ${(error as Error).message}`);
    }
  }
  
  /**
   * Delete all messages associated with a document
   * 
   * @param contextId - The document ID used as context_id in messages table
   */
  private async deleteAssociatedMessages(contextId: string): Promise<void> {
    try {
      // Use MessageService to delete messages
      const contextType = await this.determineMessageContextType(contextId);
      await MessageService.deleteMessagesByContext(contextId, contextType);
    } catch (error) {
      console.error(`Error deleting messages for document ${contextId}:`, error);
      // We'll log the error but continue with document deletion
      // to avoid leaving orphaned messages
    }
  }
  
  /**
   * Determine the message context type for a document
   * 
   * @param documentId - The document ID
   * @returns The appropriate MessageContextType
   */
  private async determineMessageContextType(documentId: string): Promise<MessageContextType> {
    try {
      const document = await this.repository.getDocumentWithVersions(documentId);
      if (document?.entityType === DocumentType.Project) {
        return MessageContextType.Project;
      }
      return MessageContextType.Document;
    } catch (error) {
      // If we can't determine the type, default to Document context
      return MessageContextType.Document;
    }
  }
  
  // Add other document-related service methods here
  // Example: createDocument, updateDocument, etc.
} 