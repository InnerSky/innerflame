import React, { useState, useEffect, KeyboardEvent, useRef, useCallback } from 'react';
import { useDocumentsContext } from '../contexts/DocumentsContext.js';
import { Button } from '@/components/ui/button.js';
import { Textarea } from '@/components/ui/textarea.js';
import { Send, MessageSquare } from 'lucide-react';
import { Spinner } from '@/components/Spinner.js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.js';
import { MessageService } from '../services/messageService.js';
import { MarkdownRenderer } from '@/components/markdown-renderer.js';
import { 
  Message as MessageModel, 
  MessageSenderType, 
  MessageContextType,
  determineMessageContext 
} from '../models/message.js';
import { useAuth } from '@/hooks/useAuth.ts';
import { MessageActions } from './MessageActions.js';
import { MessageEditor } from './MessageEditor.js';
import { useToast } from '@/hooks/use-toast.ts';

type ChatInterfaceProps = {
  className?: string;
  isStandalone?: boolean;
};

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);
  
  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);
    
    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };
    
    // Check if addEventListener is available (browser environment)
    if (typeof window !== 'undefined') {
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
  }, [query]);
  
  return matches;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  className = '',
  isStandalone = false
}) => {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<MessageModel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const contextSwitchRef = useRef(false);
  const prevContextRef = useRef<{contextType?: MessageContextType, contextId?: string | null}>({});
  
  // Get auth data
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Get document context
  const { 
    selectedDocument, 
    title, 
    content, 
    selectedProjectId,
    projectsData
  } = useDocumentsContext();
  
  // Determine the current context type
  const { contextType, contextId } = determineMessageContext(
    selectedDocument, 
    selectedProjectId
  );

  // Add media query for mobile detection
  const isMobileScreen = useMediaQuery('(max-width: 768px)');
  
  // Detect context changes
  useEffect(() => {
    if (prevContextRef.current.contextType !== contextType ||
        prevContextRef.current.contextId !== contextId) {
      // Context has changed
      contextSwitchRef.current = true;
      
      // Update previous context
      prevContextRef.current = { contextType, contextId };
      
      // Reset the flag after a delay to account for all rendering and animations
      const timer = setTimeout(() => {
        contextSwitchRef.current = false;
      }, 1000); // 1 second should cover all animations
      
      return () => clearTimeout(timer);
    }
  }, [contextType, contextId]);
  
  // Actual document and project names for display
  const documentName = selectedDocument?.title || 'No document';
  const projectName = selectedProjectId ? 
    (projectsData[selectedProjectId] || 'Unknown project') : 
    'All Documents';
  
  const isProjectOnlyMode = contextType === MessageContextType.Project;
  
  // Handle keyboard shortcuts
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Send message only on Ctrl+Enter or Shift+Enter
    if (e.key === 'Enter' && (e.ctrlKey || e.shiftKey)) {
      e.preventDefault(); // Prevent new line
      sendMessage();
    }
    // Regular Enter should just add a new line (default textarea behavior)
  };

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    // Skip scrolling when we're in the middle of a context switch
    if (contextSwitchRef.current) return;
    
    // Only perform smooth scrolling if we're not in the middle of a selection change
    const behavior = document.activeElement?.tagName === 'TEXTAREA' ? 'auto' : 'smooth';
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // Scroll to bottom when chat history changes, but add conditions to prevent
  // disruptive scrolling when switching between document/project views
  useEffect(() => {
    // Don't auto-scroll during initial loading or context switches
    if (!isInitialLoading && !contextSwitchRef.current) {
      // Small delay to ensure DOM is updated before scrolling
      const scrollTimer = setTimeout(() => {
        scrollToBottom();
      }, 100);
      
      return () => clearTimeout(scrollTimer);
    }
  }, [chatHistory, isInitialLoading]);
  
  // Load messages when context changes
  useEffect(() => {
    const loadMessages = async () => {
      if (!user) return;
      
      setIsInitialLoading(true);
      
      try {
        let messages: MessageModel[] = [];
        
        if (contextId) {
          if (contextType === MessageContextType.Document) {
            messages = await MessageService.getDocumentMessages(contextId);
          } else if (contextType === MessageContextType.Project) {
            messages = await MessageService.getProjectMessages(contextId);
          }
        } else {
          messages = await MessageService.getGeneralMessages();
        }
        
        // Sort messages by creation date - oldest first
        messages.sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        
        setChatHistory(messages);
      } catch (error) {
        console.error('Error loading messages:', error);
        toast({
          title: "Error loading messages",
          description: "Could not load the conversation history.",
          variant: "destructive"
        });
      } finally {
        setIsInitialLoading(false);
      }
    };
    
    loadMessages();
  }, [selectedDocument, selectedProjectId, user, contextType, contextId, toast]);
  
  // Track which messages have been edited in this session
  const [editedMessageIds, setEditedMessageIds] = useState<Set<string>>(new Set());
  
  const sendMessage = async () => {
    if (!message.trim() || isLoading || !user) return;
    
    // Add user message to chat (optimistic update)
    const userMessage: MessageModel = {
      id: `temp-${Date.now()}`,
      content: message,
      user_id: user.id,
      sender_type: MessageSenderType.User,
      context_type: contextType,
      context_id: contextId,
      createdAt: new Date(),
      has_proposed_changes: false,
      display_thread_id: null,
      reply_to_message_id: null
    };
    
    // Append to history instead of prepending
    const newHistory = [...chatHistory, userMessage];
    setChatHistory(newHistory);
    setMessage('');
    setIsLoading(true);
    
    try {
      // Save the message to the database
      const savedMessage = await MessageService.createMessage({
        content: message,
        userId: user.id,
        senderType: MessageSenderType.User,
        contextType,
        contextId: contextId || undefined
      });
      
      // Replace the temporary message with the saved one
      setChatHistory(prev => 
        prev.map(msg => msg.id === userMessage.id ? savedMessage : msg)
      );
      
      // Here you would call your AI service with document context
      // Simulating AI response for now
      setTimeout(async () => {
        // Create a context-aware response that references the document and project
        let responseContent = '';
        
        // Simple pattern matching for demo purposes - would be replaced with actual AI
        if (isProjectOnlyMode) {
          // Project-only responses
          if (message.toLowerCase().includes('help') || message.toLowerCase().includes('assist')) {
            responseContent = `I can help you with your "${projectName}" project. What specific assistance do you need?`;
          } else if (message.toLowerCase().includes('summary') || message.toLowerCase().includes('summarize')) {
            responseContent = `I'll summarize the "${projectName}" project for you.`;
          } else if (message.toLowerCase().includes('document')) {
            responseContent = `You can create a new document in the "${projectName}" project to organize your content.`;
          } else {
            responseContent = `I'm here to help with your "${projectName}" project. How can I assist you?`;
          }
        } else {
          // Document-focused responses
          if (message.toLowerCase().includes('help') || message.toLowerCase().includes('assist')) {
            responseContent = `I can help you with your document "${documentName}". What specific assistance do you need?`;
          } else if (message.toLowerCase().includes('summary') || message.toLowerCase().includes('summarize')) {
            responseContent = `I'll summarize "${documentName}" for you. This document is part of the "${projectName}" project and contains ${content?.length || 0} characters.`;
          } else if (message.toLowerCase().includes('project')) {
            responseContent = `You're currently working in the "${projectName}" project. This project contains the document "${documentName}" that you're editing.`;
          } else {
            responseContent = `I'm analyzing your document "${documentName}" from project "${projectName}". How can I help you improve this content?`;
          }
        }
        
        // Save the assistant response
        const assistantMessageDB = await MessageService.createMessage({
          content: responseContent,
          userId: user.id, // Still using user ID for attribution
          senderType: MessageSenderType.Assistant,
          contextType,
          contextId: contextId || undefined
        });
        
        // Append AI response to the end of history
        setChatHistory(prev => [...prev, assistantMessageDB]);
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error sending message",
        description: "Your message could not be sent. Please try again.",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  // Handle editing a message
  const handleEditMessage = (messageId: string) => {
    setEditingMessageId(messageId);
  };

  // Handle saving an edited message
  const handleSaveEdit = async (messageId: string, newContent: string) => {
    if (!user) return;
    
    setIsEditing(true);
    
    try {
      // Update the message in the database
      const updatedMessage = await MessageService.updateMessage(
        messageId,
        newContent,
        user.id
      );
      
      // Update the chat history with the updated message
      setChatHistory(prev => 
        prev.map(msg => msg.id === messageId ? updatedMessage : msg)
      );
      
      // Track this message as edited in our local state
      setEditedMessageIds(prev => {
        const newSet = new Set(prev);
        newSet.add(messageId);
        return newSet;
      });
      
      toast({
        title: "Message updated",
        description: "Your message has been successfully edited.",
      });
    } catch (error) {
      console.error('Error updating message:', error);
      toast({
        title: "Error updating message",
        description: "Your message could not be updated. Please try again.",
        variant: "destructive"
      });
    } finally {
      setEditingMessageId(null);
      setIsEditing(false);
    }
  };

  // Handle deleting a message
  const handleDeleteMessage = async (messageId: string) => {
    if (!user) return;
    
    setIsDeleting(true);
    
    try {
      // Delete the message from the database
      await MessageService.deleteMessage(messageId, user.id);
      
      // Remove the message from the chat history
      setChatHistory(prev => prev.filter(msg => msg.id !== messageId));
      
      toast({
        title: "Message deleted",
        description: "Your message has been successfully deleted.",
      });
    } catch (error) {
      console.error('Error deleting message:', error);
      toast({
        title: "Error deleting message",
        description: "Your message could not be deleted. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };
  
  // Chat content (messages and input)
  const chatContent = (
    <>
      {/* Context display */}
      <div className="bg-muted/50 rounded-lg p-2 mb-3 text-sm text-muted-foreground flex flex-wrap gap-2">
        <div className="flex items-center gap-1">
          <span>@project:</span>
          <span className="font-medium">{projectName}</span>
        </div>
        {!isProjectOnlyMode && (
          <div className="flex items-center gap-1">
            <span>@document:</span>
            <span className="font-medium">{documentName}</span>
          </div>
        )}
      </div>
      
      {/* Chat messages */}
      <div className="flex-1 min-h-0 overflow-y-auto mb-4 space-y-2 p-2">
        {isInitialLoading ? (
          <div className="flex items-center justify-center h-full">
            <Spinner size="md" />
          </div>
        ) : chatHistory.length === 0 ? (
          <p className="text-muted-foreground text-center p-4">
            {isProjectOnlyMode 
              ? "Ask questions about your project or get help organizing your content."
              : "Ask questions about your document or get help with your content."}
          </p>
        ) : (
          <>
            {chatHistory.map((chat, index) => (
              <div 
                key={chat.id || index} 
                className={`p-3 rounded-lg relative group ${
                  chat.sender_type === MessageSenderType.User 
                    ? 'bg-primary/10 ml-8 mr-0 pl-2'
                    : 'bg-secondary/20 mr-8 ml-0 pr-2'
                }`}
              >
                {/* User messages with edit capability */}
                {chat.sender_type === MessageSenderType.User && chat.id !== `temp-${Date.now()}` && (
                  <>
                    {editingMessageId === chat.id ? (
                      /* Edit mode */
                      <MessageEditor
                        message={chat}
                        onSave={handleSaveEdit}
                        onCancel={() => setEditingMessageId(null)}
                        isLoading={isEditing}
                      />
                    ) : (
                      /* Display mode with actions */
                      <>
                        <MessageActions
                          message={chat}
                          onEdit={handleEditMessage}
                          onDelete={handleDeleteMessage}
                          isMobile={!isStandalone && isMobileScreen}
                          position="left"
                        />
                        <MarkdownRenderer 
                          content={chat.content} 
                          className="text-sm [&>*:first-child]:mt-0 [&>*:last-child]:mb-0" 
                        />
                        {(chat.isEdited || editedMessageIds.has(chat.id)) && (
                          <div className="text-xs text-muted-foreground mt-1">
                            <span>(edited)</span>
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}
                
                {/* Assistant messages (never editable) */}
                {chat.sender_type === MessageSenderType.Assistant && (
                  <>
                    <MessageActions
                      message={chat}
                      onEdit={handleEditMessage}
                      onDelete={handleDeleteMessage}
                      isMobile={!isStandalone && isMobileScreen}
                      canEdit={false}
                      position="right"
                    />
                    <MarkdownRenderer 
                      content={chat.content} 
                      className="text-sm [&>*:first-child]:mt-0 [&>*:last-child]:mb-0" 
                    />
                  </>
                )}
              </div>
            ))}
            {/* Invisible element to scroll to */}
            <div ref={messagesEndRef} />
          </>
        )}
        
        {isLoading && !isInitialLoading && (
          <div className="flex items-center justify-center p-2">
            <Spinner size="sm" />
          </div>
        )}
      </div>
      
      {/* Input area */}
      <div className="flex gap-2 mt-auto p-0.5 pb-1.5">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isProjectOnlyMode 
            ? "Ask about your project... (Ctrl+Enter or Shift+Enter to send)" 
            : "Ask about your document... (Ctrl+Enter or Shift+Enter to send)"}
          className="flex-1 min-h-[60px] max-h-[240px] resize-none overflow-y-auto"
          style={{
            height: 'auto',
            overflowY: message.split('\n').length > 10 ? 'scroll' : 'hidden'
          }}
          rows={Math.min(message.split('\n').length || 1, 10)}
          disabled={isLoading || isInitialLoading || !user}
        />
        <Button 
          onClick={sendMessage} 
          type="submit" 
          className="h-auto self-end mb-1" 
          disabled={isLoading || isInitialLoading || !user}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </>
  );
  
  // If in mobile standalone mode or in a tab, return without card wrapper
  if (isStandalone) {
    return (
      <div 
        className={`h-full flex flex-col p-4 ${className}`}
        data-chat-container
      >
        <div className="flex flex-col gap-1 mb-4 flex-shrink-0">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            <h2 className="text-lg font-semibold">
              {isProjectOnlyMode ? "Project Assistant" : "Document Assistant"}
            </h2>
          </div>
        </div>
        <div className="flex-1 flex flex-col overflow-hidden">
          {chatContent}
        </div>
      </div>
    );
  }
  
  // In desktop sidebar, use card container
  return (
    <Card className={`h-full flex flex-col ${className}`}>
      <CardHeader className="pb-3 flex-shrink-0">
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          <span>{isProjectOnlyMode ? "Project Assistant" : "Document Assistant"}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col overflow-hidden p-4">
        {chatContent}
      </CardContent>
    </Card>
  );
}; 