import { Document } from '../models/document.js';
import { documentRepository } from '../repositories/documentRepository.js';
import { ChatInterfaceRef } from '../components/ChatInterface.js';
import { Message } from '@innerflame/types';

/**
 * Options for restoring a document version
 */
export interface VersionRestorationOptions {
  /**
   * The version ID to restore to
   */
  versionId: string | null;
  
  /**
   * The version number for display purposes
   */
  versionNumber?: number;
  
  /**
   * Reference to the chat interface for message operations
   */
  chatInterfaceRef?: React.RefObject<ChatInterfaceRef>;
  
  /**
   * Function to select the document in the UI after restoration
   */
  selectDocument: (document: Document) => void;
  
  /**
   * Original message that triggered the edit (optional)
   */
  originalMessage?: Message;
  
  /**
   * Optional array of messages in the conversation
   */
  messages?: Message[];
  
  /**
   * Index of the original message in the messages array
   */
  messageIndex?: number;
  
  /**
   * Custom success message to show after restoration
   */
  successMessage?: string;
  
  /**
   * Toast function for notifications
   */
  toast: {
    (props: { title: string; description?: string; variant?: 'default' | 'destructive' }): void;
  };
  
  /**
   * Whether to suppress toast notifications (useful when other toasts are already being shown)
   */
  suppressToasts?: boolean;
}

/**
 * Restores a document to a previous version and handles chat interface cleanup
 * 
 * This function handles:
 * 1. Restoring the document to the specified version
 * 2. Updating the document in the UI
 * 3. If chatInterfaceRef is provided:
 *    - Copies original message text to chat input
 *    - Deletes subsequent messages
 *    - Deletes the original message
 * 
 * @returns A promise that resolves to the restored document or null if restoration failed
 */
export async function restoreDocumentVersion(options: VersionRestorationOptions): Promise<Document | null> {
  const {
    versionId,
    versionNumber,
    chatInterfaceRef,
    selectDocument,
    originalMessage: providedOriginalMessage,
    messages: providedMessages,
    messageIndex: providedMessageIndex,
    successMessage,
    toast,
    suppressToasts
  } = options;
  
  if (!versionId) return null;
  
  try {
    // Show loading toast
    if (!suppressToasts) {
      toast({
        title: "Restoring document version...",
        description: "Please wait while we restore your document."
      });
    }
    
    // Call the repository method to restore the version
    const restoredDocument = await documentRepository.restoreVersion(versionId);
    
    // Update the document in the context
    selectDocument(restoredDocument);
    
    // Handle chat interface operations if provided
    if (chatInterfaceRef?.current) {
      // Get messages from chat interface if not provided
      let messages = providedMessages;
      let messageIndex = providedMessageIndex;
      let originalMessage = providedOriginalMessage;
      
      // If we don't have the message information, try to extract it from the chat interface
      if (!messages || messageIndex === undefined || !originalMessage) {
        const chatData = chatInterfaceRef.current.getMessages();
        messages = chatData.messages;
        
        // If we have a valid streaming message, find the message that triggered it
        // This would usually be the last user message before the streaming message
        if (chatData.currentMessageIndex !== null && chatData.currentMessageIndex > 0) {
          // Start from the streaming message and go backwards to find the last user message
          for (let i = chatData.currentMessageIndex - 1; i >= 0; i--) {
            if (messages[i].sender_type === 'user') {
              messageIndex = i;
              originalMessage = messages[i];
              break;
            }
          }
        } else {
          // If there's no streaming message, look for the last user message
          for (let i = messages.length - 1; i >= 0; i--) {
            if (messages[i].sender_type === 'user') {
              messageIndex = i;
              originalMessage = messages[i];
              break;
            }
          }
        }
      }
      
      // If we found the original message, proceed with chat cleanup
      if (originalMessage && messageIndex !== undefined) {
        // Store the message content before deletion
        const messageContent = originalMessage.content;
        
        // Set input text to the original message
        chatInterfaceRef.current.setInputText(messageContent);
        
        // Delete messages in reverse order if we have the full message list
        if (messages) {
          // Temporarily disabled: Delete messages in reverse order
          // Messages are already deleted from the backend
          // for (let i = messages.length - 1; i > messageIndex; i--) {
          //   await chatInterfaceRef.current.deleteMessage(messages[i].id);
          // }
          
          // Only delete the message that triggered the restoration
          await chatInterfaceRef.current.deleteMessage(originalMessage.id);
        }
      }
    }
    
    // Show success toast
    if (!suppressToasts) {
      toast({
        title: "Document restored successfully",
        description: successMessage || `The document has been restored to version ${versionNumber || ''}.`,
        variant: "default"
      });
    }
    
    return restoredDocument;
  } catch (error) {
    if (!suppressToasts) {
      toast({
        title: "Failed to restore document",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    }
    
    return null;
  }
} 