import { DocumentRepository } from '../repositories/documentRepository.js';
import { Document, DocumentType } from '../models/document.js';
import { MessageServiceStatic as MessageService } from '@/lib/services.js';
import { MessageContextType } from '@innerflame/types';
import { supabase } from '@/lib/supabase.js';

// Singleton instance
let instance: DocumentService | null = null;

// Document update handler type
export type DocumentUpdateHandler = (documents: Document[]) => void;

export class DocumentService {
  private repository: DocumentRepository;
  private documentSubscriptions: Record<string, () => void> = {};
  private userDocumentHandlers: Map<string, Set<DocumentUpdateHandler>> = new Map();
  
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
   * Subscribe to real-time updates of a user's documents
   * @param userId - The user ID to subscribe to documents for
   * @param handler - Callback function to handle updated documents
   * @returns Unsubscribe function to clean up subscription
   */
  subscribeToUserDocuments(userId: string, handler: DocumentUpdateHandler): () => void {
    // Create a unique key for this user
    const subscriptionKey = `user-docs:${userId}`;
    
    // Initialize handler set if it doesn't exist
    if (!this.userDocumentHandlers.has(userId)) {
      this.userDocumentHandlers.set(userId, new Set());
      
      // Set up the Supabase subscription if this is the first handler
      const channel = supabase.channel(subscriptionKey);
      
      // Subscribe to the channel and store the unsubscribe function
      channel
        // Listen for document creations
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'entities',
          filter: `user_id=eq.${userId}`
        }, () => this.fetchAndNotifyUserDocuments(userId))
        
        // Listen for document updates
        .on('postgres_changes', { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'entities',
          filter: `user_id=eq.${userId}`
        }, () => this.fetchAndNotifyUserDocuments(userId))
        
        // Listen for document deletions
        .on('postgres_changes', { 
          event: 'DELETE', 
          schema: 'public', 
          table: 'entities',
          filter: `user_id=eq.${userId}`
        }, () => this.fetchAndNotifyUserDocuments(userId))
        
        .subscribe();
      
      // Store unsubscribe function
      this.documentSubscriptions[subscriptionKey] = () => {
        channel.unsubscribe();
      };
    }
    
    // Add this handler to the set
    this.userDocumentHandlers.get(userId)!.add(handler);
    
    // Return unsubscribe function
    return () => {
      const handlers = this.userDocumentHandlers.get(userId);
      if (handlers) {
        handlers.delete(handler);
        
        // If no handlers left, clean up the subscription
        if (handlers.size === 0) {
          this.userDocumentHandlers.delete(userId);
          
          // Unsubscribe from Supabase
          if (this.documentSubscriptions[subscriptionKey]) {
            const unsubscribe = this.documentSubscriptions[subscriptionKey];
            unsubscribe();
            delete this.documentSubscriptions[subscriptionKey];
          }
        }
      }
    };
  }
  
  /**
   * Fetch latest documents for a user and notify all handlers
   * @param userId - The user ID to fetch documents for
   */
  private async fetchAndNotifyUserDocuments(userId: string): Promise<void> {
    try {
      const documents = await this.repository.getUserDocuments(userId);
      
      // Notify all handlers with the updated documents
      const handlers = this.userDocumentHandlers.get(userId);
      if (handlers) {
        handlers.forEach(handler => handler(documents));
      }
    } catch (error) {
      console.error(`Error fetching updated documents for user ${userId}:`, error);
    }
  }
  
  /**
   * Get all documents for a user
   * @param userId - The user ID
   * @returns Promise resolving to the user's documents
   */
  async getUserDocuments(userId: string): Promise<Document[]> {
    return this.repository.getUserDocuments(userId);
  }
  
  /**
   * Smart auto-save for documents that intelligently handles versioning
   * - Creates a new version if the current version is AI-generated
   * - Creates a new version if the last edit was more than 30 minutes ago
   * - Updates the existing version if within the same editing session
   * 
   * @param documentId - The ID of the document to save
   * @param title - The document title
   * @param content - The document content
   * @param sessionTimeoutMinutes - Optional session timeout in minutes (default: 30)
   * @returns Promise resolving to the updated document
   */
  async smartAutoSaveDocument(
    documentId: string,
    title: string,
    content: string,
    sessionTimeoutMinutes: number = 30
  ): Promise<Document> {
    return this.repository.smartAutoSaveDocument(documentId, title, content, sessionTimeoutMinutes);
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