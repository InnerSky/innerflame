import React, { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useDocumentsContext } from '@/features/documents/contexts/DocumentsContext.js';
import { MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.js';
import { 
  MessageContextType,
  determineMessageContext,
  Message as MessageModel,
  MessageSenderType
} from '@innerflame/types';
import { useAuth } from '@/contexts/AuthContext.js';
import { MessageList } from '@/features/documents/components/chat/MessageList.js';
import { OneChatInput, OneChatInputRef } from './OneChatInput.js';
import { useOneChat } from './useOneChat.js';
import { MessageServiceStatic as MessageService } from '@/lib/services.js';
import { Document } from '@/features/documents/models/document.js';

type OneChatProps = {
  className?: string;
  isStandalone?: boolean;
  suppressAutoScroll?: boolean;
  viewMode?: 'capture' | 'ask' | 'coach' | 'document';
};

// Define the extended ref interface
export interface OneChatRef {
  sendMessage: (content: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<boolean | undefined>;
  setInputText: (text: string) => void;
  getMessages: () => { messages: import('@innerflame/types').Message[], currentMessageIndex: number | null };
}

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

// Export OneChat as a forwardRef component
export const OneChat = forwardRef<OneChatRef, OneChatProps>(({ 
  className = '',
  isStandalone = false,
  suppressAutoScroll = false,
  viewMode = 'coach'
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
  
  // State for current mode (capture, ask, coach, document)
  const [currentMode, setCurrentMode] = useState<'capture' | 'ask' | 'coach' | 'document'>(viewMode);
  
  // Check if canvas has content
  const canvasHasContent = hasCanvasContent(content);
  
  // Add media query for mobile detection
  const isMobileScreen = useMediaQuery('(max-width: 768px)');
  
  // Document and project names for display (still useful for chat context)
  const documentName = selectedDocument?.title || 'No document';
  const projectName = selectedProjectId ? 
    (projectsData[selectedProjectId] || 'Unknown project') : 
    'All Documents';
  
  // State for selected document from modal
  const [modalSelectedDocument, setModalSelectedDocument] = useState<Document | null>(null);
  
  // State for previous mode before switching to document
  const [previousMode, setPreviousMode] = useState<'capture' | 'ask' | 'coach'>(
    viewMode === 'document' ? 'capture' : viewMode as 'capture' | 'ask' | 'coach'
  );
  
  // Use our custom OneChat hook for message loading/handling
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
  } = useOneChat({
    documentTitle: modalSelectedDocument?.title || documentName,
    documentContent: modalSelectedDocument?.content || content,
    projectId: selectedProjectId || undefined,
    projectName,
    viewMode: currentMode // Use the current mode from state
  });
  
  // Handle mode changes from the chat input
  const handleModeChange = (mode: 'capture' | 'ask' | 'coach' | 'document') => {
    // Save previous mode when switching to document mode
    if (mode === 'document' && currentMode !== 'document') {
      setPreviousMode(currentMode as 'capture' | 'ask' | 'coach');
    }
    
    setCurrentMode(mode);
    console.log(`OneChat - Mode changed to: ${mode}`);
  };
  
  // Debug chat history loading
  useEffect(() => {
    console.log(`OneChat - chatHistory length: ${chatHistory.length}`);
    console.log(`OneChat - isInitialLoading: ${isInitialLoading}`);
    if (chatHistory.length > 0) {
      console.log('Message sample:', chatHistory[0]);
    }
  }, [chatHistory, isInitialLoading]);
  
  // Create a ref for the message list component to access scrollToBottom method
  const messageListRef = useRef<{ scrollToBottom: () => void }>(null);
  
  // Track when to scroll to bottom (only for user messages)
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(false);
  
  // Create a ref for the OneChatInput component
  const chatInputRef = useRef<OneChatInputRef>(null);
  
  // Create a self-reference to pass to children
  const selfRef = useRef<OneChatRef | null>(null);
  
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
        agentType: currentMode // Use the current mode from state
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

  // Expose sendMessage and other functions via ref
  useImperativeHandle(ref, () => {
    // Create the ref interface object
    const interfaceRef: OneChatRef = {
      sendMessage: async (content: string) => {
        await handleSendMessage(content);
      },
      deleteMessage: async (messageId: string) => {
        return deleteMessage(messageId);
      },
      setInputText: (text: string) => {
        if (chatInputRef.current) {
          chatInputRef.current.setInputText(text);
          chatInputRef.current.focusInput();
        }
      },
      getMessages: () => {
        // Find the index of the current streaming message if any
        const currentMessageIndex = streamingMessages && Object.keys(streamingMessages).length > 0 
          ? chatHistory.findIndex(msg => streamingMessages[msg.id]) 
          : null;
          
        return {
          messages: chatHistory,
          currentMessageIndex
        };
      }
    };
    
    // Store in our self-reference
    selfRef.current = interfaceRef;
    
    return interfaceRef;
  }, [chatHistory, streamingMessages]);
  
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
  
  // Handle document selection from OneChatInput
  const handleDocumentSelect = (document: Document | null) => {
    setModalSelectedDocument(document);
    
    // If document selected, switch to document mode
    if (document) {
      setCurrentMode('document');
    } else {
      // When document is deselected, revert to previous mode
      setCurrentMode(previousMode);
    }
    
    console.log(`OneChat - Document ${document ? 'selected' : 'deselected'}: ${document?.title || ''}`);
  };
  
  // Calculate the effective document to use for context
  // Priority: modal selected document > document context document
  const effectiveDocument = modalSelectedDocument || selectedDocument;
  const effectiveDocumentName = modalSelectedDocument?.title || documentName;
  
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
          chatInterfaceRef={selfRef}
        />
      </div>
      
      {/* Input area */}
      <OneChatInput
        ref={chatInputRef}
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
        isDisabled={!user}
        placeholder={currentMode === 'coach' ? "Ask your coach a question..." : 
                   currentMode === 'document' ? "Ask about your documents..." : 
                   currentMode === 'ask' ? "Ask InnerFlame anything..." :
                   "Capture your thoughts..."}
        isAnonymous={isAnonymous}
        canvasHasContent={canvasHasContent}
        onModeChange={handleModeChange}
        initialMode={currentMode}
        onDocumentSelect={handleDocumentSelect}
        selectedDocument={modalSelectedDocument}
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
        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
          {chatContent}
        </div>
      </div>
    );
  }
  
  // In desktop sidebar, use card container
  return (
    <Card className={`h-full flex flex-col border-0 shadow-none ${className}`}>
      <CardContent className="flex-1 flex flex-col overflow-hidden px-4 pt-0 min-h-0">
        {chatContent}
      </CardContent>
    </Card>
  );
});

export default OneChat; 