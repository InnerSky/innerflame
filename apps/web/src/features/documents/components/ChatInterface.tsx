import React, { useRef, useState, useEffect } from 'react';
import { useDocumentsContext } from '../contexts/DocumentsContext.js';
import { MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.js';
import { 
  MessageContextType,
  determineMessageContext 
} from '../models/message.js';
import { useAuth } from '@/hooks/useAuth.ts';
import { useChatInterface } from '@/hooks/useChatInterface.ts';
import { MessageList } from './chat/MessageList.js';
import { ChatInput } from './chat/ChatInput.js';

type ChatInterfaceProps = {
  className?: string;
  isStandalone?: boolean;
  suppressAutoScroll?: boolean;
};

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

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  className = '',
  isStandalone = false,
  suppressAutoScroll = false
}) => {
  // Get document context
  const { 
    selectedDocument, 
    title, 
    content, 
    selectedProjectId,
    projectsData
  } = useDocumentsContext();
  
  // User authentication
  const { user } = useAuth();
  
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
  const handleSendMessage = (content: string) => {
    sendChatMessage(content);
    // Set flag to scroll to bottom when a user sends a message, but only if not suppressed
    if (!suppressAutoScroll) {
      setShouldScrollToBottom(true);
    }
  };
  
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
      <div className="flex-1 min-h-0 overflow-hidden mb-4 w-full">
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
        placeholder={isProjectOnlyMode 
          ? "Ask about your project... (Ctrl+Enter or Shift+Enter to send)" 
          : "Ask about your document... (Ctrl+Enter or Shift+Enter to send)"
        }
      />
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