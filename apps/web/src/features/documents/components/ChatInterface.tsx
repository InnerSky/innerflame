import React, { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useDocumentsContext } from '../contexts/DocumentsContext.js';
import { MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.js';
import { 
  MessageContextType,
  determineMessageContext 
} from '@innerflame/types';
import { useAuth } from '@/contexts/AuthContext.js';
import { useChatInterface } from '@/hooks/useChatInterface.ts';
import { MessageList } from './chat/MessageList.js';
import { ChatInput } from './chat/ChatInput.js';

type ChatInterfaceProps = {
  className?: string;
  isStandalone?: boolean;
  suppressAutoScroll?: boolean;
};

// Helper function to check if canvas has content
function hasCanvasContent(content: string | null): boolean {
  if (!content) return false;
  try {
    const jsonContent = JSON.parse(content);
    // Check if any value in the key-value pairs is not empty
    return Object.values(jsonContent).some(value => 
      typeof value === 'string' && value.trim() !== ''
    );
  } catch (e) {
    console.error('Error parsing canvas content:', e);
    return false;
  }
}

// Media query hook
function useMediaQuery(query: string) {
  const [matches, setMatches] = React.useState(false);
  
  React.useEffect(() => {
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

// Export ChatInterface as a forwardRef component
export const ChatInterface = forwardRef<
  { sendMessage: (content: string) => Promise<void> }, 
  ChatInterfaceProps
>(({ 
  className = '',
  isStandalone = false,
  suppressAutoScroll = false
}, ref) => {
  // Get document context
  const { 
    selectedDocument, 
    title, 
    content, 
    selectedProjectId,
    projectsData
  } = useDocumentsContext();
  
  // User authentication
  const { user, isAnonymous } = useAuth();
  
  // Check if canvas has content
  const canvasHasContent = hasCanvasContent(content);
  
  // Determine the current context type
  const { contextType, contextId } = determineMessageContext(
    selectedDocument, 
    selectedProjectId
  );
  
  // Add media query for mobile detection
  const isMobileScreen = useMediaQuery('(max-width: 768px)');
  
  // Document and project names for display
  const documentName = selectedDocument?.title || 'No document';
  const projectName = selectedProjectId ? 
    (projectsData[selectedProjectId] || 'Unknown project') : 
    'All Documents';
  
  const isProjectOnlyMode = contextType === MessageContextType.Project;
  
  // Use the chat interface hook
  const {
    chatHistory,
    isLoading,
    isInitialLoading,
    editingMessageId, 
    setEditingMessageId,
    isEditing,
    isDeleting,
    editedMessageIds,
    streamingContents,
    streamingMessages,
    documentEditStates,
    sendMessage: sendChatMessage,
    editMessage,
    deleteMessage
  } = useChatInterface({
    contextType,
    contextId,
    documentTitle: documentName,
    documentContent: content,
    projectId: selectedProjectId || undefined,
    projectName
  });
  
  // Create a ref for the message list component to access scrollToBottom method
  const messageListRef = useRef<{ scrollToBottom: () => void }>(null);
  
  // Track when to scroll to bottom (only for user messages)
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(false);
  
  // UI event handlers
  const handleStartEdit = (messageId: string) => {
    setEditingMessageId(messageId);
  };
  
  const handleCancelEdit = () => {
    setEditingMessageId(null);
  };
  
  // Custom send message handler that triggers scroll
  const handleSendMessage = async (content: string) => {
    try {
      // Connect to the orchestrator agent, which will handle agent selection and streaming
      await sendChatMessage({
        content,
        agentType: 'orchestrator'  // Pass agentType as part of the message options
      });
      
      // Set flag to scroll to bottom when a user sends a message, but only if not suppressed
      if (!suppressAutoScroll) {
        setShouldScrollToBottom(true);
      }
    } catch (error) {
      console.error('Error in sendMessage:', error);
      if (!suppressAutoScroll) {
        setShouldScrollToBottom(true);
      }
    }
  };

  // Expose sendMessage function via ref
  useImperativeHandle(ref, () => ({
    sendMessage: async (content: string) => {
      await handleSendMessage(content);
    }
  }));
  
  // Reset the scroll flag after it's been processed
  useEffect(() => {
    if (shouldScrollToBottom) {
      // Reset the flag in the next render cycle
      const timer = setTimeout(() => {
        setShouldScrollToBottom(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [shouldScrollToBottom]);
  
  // Chat content (messages and input)
  const chatContent = (
    <>
      {/* Chat messages */}
      <div className="flex-1 min-h-0 overflow-hidden mb-0 w-full">
        <MessageList
          ref={messageListRef}
          messages={chatHistory}
          streamingContents={streamingContents}
          streamingMessages={streamingMessages}
          documentEditStates={documentEditStates}
          editingMessageId={editingMessageId}
          isEditing={isEditing}
          editedMessageIds={editedMessageIds}
          isInitialLoading={isInitialLoading}
          isLoading={isLoading}
          isMobileScreen={isMobileScreen}
          isStandalone={isStandalone}
          onEdit={editMessage}
          onDelete={deleteMessage}
          onCancelEdit={handleCancelEdit}
          onStartEdit={handleStartEdit}
          shouldScrollToBottom={suppressAutoScroll ? false : shouldScrollToBottom}
        />
      </div>
      
      {/* Input area */}
      <ChatInput
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
        isDisabled={!user}
        placeholder="How can InnerFlame help you today?"
        isAnonymous={isAnonymous}
        canvasHasContent={canvasHasContent}
      />
    </>
  );
  
  // If in mobile standalone mode or in a tab, return without card wrapper
  if (isStandalone) {
    return (
      <div 
        className={`h-full flex flex-col px-4 ${className}`}
        data-chat-container
      >
        <div className="flex-1 flex flex-col overflow-hidden">
          {chatContent}
        </div>
      </div>
    );
  }
  
  // In desktop sidebar, use card container
  return (
    <Card className={`h-full flex flex-col border-0 shadow-none ${className}`}>
      <CardContent className="flex-1 flex flex-col overflow-hidden px-4 pt-0">
        {chatContent}
      </CardContent>
    </Card>
  );
}); 