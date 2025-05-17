import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button.js";
import { ArrowUp, ChevronDown, ChevronUp } from "lucide-react";
import { useChatState } from "@/features/chat/contexts/ChatStateContext.js";
import { CreateMessageParams, MessageContextType, MessageSenderType, Message as MessageModel } from "@innerflame/types";
import { MessageServiceStatic as MessageService, messageSubscriptionService } from "@/lib/services.js";
import { useAuth } from "@/contexts/AuthContext.js";
import { useToast } from "@/hooks/use-toast.ts";
import { MessageList } from "@/features/documents/components/chat/MessageList.js";
import { DocumentEditTagState } from "@/features/documents/utils/documentEditUtils.js";
import { cn } from "@/lib/utils.js";
import { DocumentsProvider } from "@/features/documents/contexts/DocumentsContext.js";
import { SaveStatus } from "@/features/documents/models/document.js";
import { Textarea } from "@/components/ui/textarea.js";

export const CaptureHome: React.FC = () => {
  const { openChat, oneChatRef } = useChatState();
  const [captureText, setCaptureText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showCaptures, setShowCaptures] = useState(false);
  const [contentVisible, setContentVisible] = useState(false);
  const [captureMessages, setCaptureMessages] = useState<MessageModel[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  
  // State for message editing
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedMessageIds, setEditedMessageIds] = useState<Set<string>>(new Set());
  
  // Check if on mobile device
  const [isMobileScreen, setIsMobileScreen] = useState(false);
  
  // Track if animations should be disabled (during message updates)
  const skipAnimationRef = useRef(false);

  // Track subscription cleanup functions
  const subscriptionCleanupRef = useRef<(() => void)[]>([]);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobileScreen(window.innerWidth < 768);
    };
    
    // Check on initial load
    checkMobile();
    
    // Add resize listener
    window.addEventListener('resize', checkMobile);
    
    // Clean up
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto-resize textarea as content changes
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      // Reset height to calculate proper scrollHeight
      textarea.style.height = 'auto';
      // Set to scrollHeight to match content (min 24px)
      textarea.style.height = `${Math.max(24, textarea.scrollHeight)}px`;
    }
  }, [captureText]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    // Only run animation if not adding a new message
    if (!skipAnimationRef.current) {
      if (showCaptures) {
        timeoutId = setTimeout(() => {
          setContentVisible(true);
        }, 50);
      } else {
        setContentVisible(false);
      }
    }
    
    // Reset the flag
    skipAnimationRef.current = false;
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [showCaptures]);

  const mockDocumentsContext = {
    selectedDocument: null,
    title: "",
    content: "",
    isPreviewMode: false,
    saveStatus: 'saved' as SaveStatus,
    lastSaved: null,
    hasUnsavedChanges: false,
    contentFormat: "markdown",
    documentVersions: [],
    
    selectedProjectId: null,
    projectsData: {},
    
    saveDocument: async () => {},
    selectDocument: () => {},
    selectProject: () => {},
    setTitle: () => {},
    setContent: () => {},
    togglePreviewMode: () => {},
    updateDocumentType: async () => {},
    updateContentFormat: async () => {},
    fetchDocumentVersions: async () => {},
    handleVersionHistoryClick: () => {},
    acceptDocumentVersion: async () => {},
    rejectDocumentVersion: async () => {}
  };

  useEffect(() => {
    if (!user) return;
    
    const fetchCaptureMessages = async () => {
      setIsLoadingMessages(true);
      try {
        const messages = await MessageService.loadMessages({
          contextType: MessageContextType.Capture,
          limit: 50
        });
        
        const sortedMessages = [...messages].sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        
        setCaptureMessages(sortedMessages);
      } catch (error) {
        console.error("Error loading capture messages:", error);
      } finally {
        setIsLoadingMessages(false);
      }
    };
    
    fetchCaptureMessages();

    // Set up real-time subscriptions
    const setupSubscriptions = () => {
      // Subscribe to messages with context type Capture
      const unsubscribe = messageSubscriptionService.subscribeToMessages(MessageContextType.Capture);

      // Handle new messages
      const insertHandler = messageSubscriptionService.onMessageInserted((newMessage) => {
        // Only handle messages with context type Capture
        if (newMessage.context_type !== MessageContextType.Capture) return;

        // Add new message to state
        setCaptureMessages(prevMessages => {
          // Check if the message already exists
          if (prevMessages.some(msg => msg.id === newMessage.id)) {
            return prevMessages;
          }
          
          // Add new message at the beginning (newest first)
          return [newMessage, ...prevMessages];
        });
      });

      // Handle updated messages
      const updateHandler = messageSubscriptionService.onMessageUpdated((updatedMessage) => {
        // Only handle messages with context type Capture
        if (updatedMessage.context_type !== MessageContextType.Capture) return;

        // Update the message in state
        setCaptureMessages(prevMessages => 
          prevMessages.map(message => 
            message.id === updatedMessage.id ? updatedMessage : message
          )
        );

        // Add to edited message IDs
        setEditedMessageIds(prev => {
          const newSet = new Set(prev);
          newSet.add(updatedMessage.id);
          return newSet;
        });
      });

      // Handle deleted messages
      const deleteHandler = messageSubscriptionService.onMessageDeleted((deletedMessage) => {
        // Remove the message from state
        setCaptureMessages(prevMessages => 
          prevMessages.filter(message => message.id !== deletedMessage.id)
        );
      });

      // Store cleanup functions
      subscriptionCleanupRef.current = [unsubscribe, insertHandler, updateHandler, deleteHandler];
    };

    setupSubscriptions();

    // Clean up subscriptions on unmount
    return () => {
      subscriptionCleanupRef.current.forEach(cleanup => cleanup());
    };
  }, [user]);

  const handleOpenCapture = () => {
    openChat("capture");
  };

  const toggleCapturesView = () => {
    setShowCaptures(prev => !prev);
  };

  const createCaptureMessage = async (content: string) => {
    if (!user) return null;
    
    try {
      const captureMessage = await MessageService.createMessage({
        content: content,
        userId: user.id,
        senderType: MessageSenderType.User,
        contextType: MessageContextType.Capture,
      });
      
      return captureMessage;
    } catch (error) {
      console.error("Error creating capture message:", error);
      return null;
    }
  };

  const handleCaptureSubmit = async () => {
    if (captureText.trim() && !isSending && user) {
      try {
        setIsSending(true);
        
        const captureMessage = await createCaptureMessage(captureText.trim());
        
        if (captureMessage) {
          console.log("Created capture message:", captureMessage.id);
          
          toast({
            title: "Thought captured",
            description: "Your thought has been saved",
            variant: "default",
            duration: 1000
          });
          
          if (oneChatRef.current) {
            // Refresh the messages (this depends on OneChat implementation)
            // If OneChat is properly subscribing to message events, this might not be necessary
          }
          
          // Set flag to skip animations when updating the list
          if (showCaptures && contentVisible) {
            skipAnimationRef.current = true;
            
            // Update messages without triggering animations
            setCaptureMessages(prev => {
              // Create a new array with the new message first
              return [captureMessage, ...prev];
            });
          }
          
          // Clear the input
          setCaptureText("");
          
          // Keep focus on the input field
          textareaRef.current?.focus();
        }
      } catch (error) {
        console.error("Error sending capture:", error);
        
        toast({
          title: "Capture failed",
          description: "Failed to save your thought",
          variant: "destructive",
        });
      } finally {
        setIsSending(false);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter") {
      // Allow new line with Shift+Enter or Ctrl+Enter
      if (e.shiftKey || e.ctrlKey) {
        return; // Do nothing, let the new line be added
      } else {
        // Submit on plain Enter
        e.preventDefault();
        handleCaptureSubmit();
      }
    }
  };

  const noop = () => Promise.resolve(false);
  const noopVoid = () => {};

  // Handler for starting to edit a message
  const handleStartEdit = (messageId: string) => {
    setEditingMessageId(messageId);
  };

  // Handler for canceling message edit
  const handleCancelEdit = () => {
    setEditingMessageId(null);
  };

  // Handler for saving an edited message
  const handleSaveEdit = async (messageId: string, content: string): Promise<boolean | undefined> => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to edit captures",
        variant: "destructive"
      });
      return false;
    }
    
    try {
      setIsEditing(true);
      
      // Update the message using MessageService
      const updatedMessage = await MessageService.updateMessage(messageId, content, user.id);
      
      if (updatedMessage) {
        // Update the local state with the edited message
        setCaptureMessages(prevMessages => 
          prevMessages.map(message => 
            message.id === messageId ? updatedMessage : message
          )
        );
        
        // Add to set of edited message IDs
        setEditedMessageIds(prev => {
          const newSet = new Set(prev);
          newSet.add(messageId);
          return newSet;
        });
        
        toast({
          title: "Message updated",
          description: "Your capture has been updated",
          variant: "default",
          duration: 1000
        });
        
        // Clear the editing state
        setEditingMessageId(null);
        
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error updating capture message:", error);
      
      toast({
        title: "Update failed",
        description: "Failed to update the capture",
        variant: "destructive"
      });
      
      return false;
    } finally {
      setIsEditing(false);
    }
  };

  // Add a handler for deleting messages
  const handleDeleteMessage = async (messageId: string): Promise<boolean | undefined> => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to delete captures",
        variant: "destructive"
      });
      return false;
    }
    
    try {
      // Delete the message using the MessageService, passing the user ID
      const success = await MessageService.deleteMessage(messageId, user.id);
      
      if (success) {
        // Update the local state to remove the deleted message
        setCaptureMessages(prevMessages => 
          prevMessages.filter(message => message.id !== messageId)
        );
        
        toast({
          title: "Message deleted",
          description: "Your capture has been deleted",
          variant: "default",
          duration: 1000
        });
        
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error deleting capture message:", error);
      
      toast({
        title: "Delete failed",
        description: "Failed to delete the capture",
        variant: "destructive"
      });
      
      return false;
    }
  };

  return (
    <div className={cn(
      "flex flex-col h-full w-full p-4 pb-0",
      !showCaptures && "justify-center"
    )}>
      <div className="max-w-[620px] w-full mx-auto flex flex-col min-h-0">
        <div className={cn(
          "transition-all duration-300 ease-in-out overflow-hidden", 
          showCaptures ? "max-h-0 opacity-0 mb-0" : "max-h-[200px] opacity-100 mb-6"
        )}>
          <div className="w-28 h-28 flex items-center justify-center mx-auto mb-4">
            <img 
              src="/images/capture ideas.png" 
              alt="Capture Ideas" 
              className="w-28 h-28 object-contain drop-shadow-md"
            />
          </div>
          <h1 className="text-2xl font-bold mb-4 text-center">Capture Your Thoughts</h1>
          <p className="text-muted-foreground text-center">
            Jot down your ideas, thoughts, and observations to reflect on later.
          </p>
        </div>
        
        <div className="flex items-center w-full border rounded-[25px] bg-background px-4 py-0 shadow-sm focus-within:ring-2 focus-within:ring-primary/30 mb-3 shrink-0">
          <Textarea 
            ref={textareaRef}
            value={captureText}
            onChange={(e) => setCaptureText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Capture a thought..."
            className="flex-1 bg-transparent border-none resize-none overflow-y-auto min-h-[38px] focus:outline-none focus:ring-0 focus:ring-offset-0 outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:border-transparent text-sm scrollbar-thin"
            style={{ maxHeight: '240px', paddingTop: '28px', paddingBottom: '8px', lineHeight: '22px' }}
          />
          <button 
            className="flex justify-center items-center h-8 w-8 min-h-[32px] min-w-[32px] rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ml-1"
            onClick={handleCaptureSubmit}
            disabled={!captureText.trim() || isSending}
          >
            {isSending ? (
              <div className="h-4 w-4 border-2 border-t-transparent border-white rounded-full animate-spin" />
            ) : (
              <ArrowUp className="h-4 w-4" />
            )}
          </button>
        </div>
        
        <button 
          onClick={toggleCapturesView}
          className="flex items-center justify-center gap-1 w-full py-1 text-xs text-muted-foreground/70 hover:text-muted-foreground transition-colors shrink-0"
        >
          {showCaptures ? "Hide captures" : "View captures"}
          {showCaptures ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>
        
        <div 
          className={cn(
            "mt-2 overflow-hidden transition-all duration-500 ease-in-out flex-1 min-h-0", 
            showCaptures 
              ? "max-h-[80vh] opacity-100" 
              : "max-h-0 opacity-0"
          )}
        >
          <div className={cn(
            "border rounded-lg bg-card h-full flex flex-col transition-all duration-300",
            showCaptures ? "transform-none" : "transform translate-y-4"
          )}>
            <div className="p-0 flex-1 min-h-0 overflow-hidden">
              <div className={cn(
                "h-full transition-opacity duration-300 ease-in-out",
                contentVisible ? "opacity-100" : "opacity-0"
              )}>
                {captureMessages.length > 0 && (
                  <DocumentsProvider value={mockDocumentsContext}>
                    <MessageList 
                      messages={captureMessages}
                      streamingContents={{}}
                      streamingMessages={{}}
                      documentEditStates={{}}
                      editingMessageId={editingMessageId}
                      isEditing={isEditing}
                      editedMessageIds={editedMessageIds}
                      isInitialLoading={isLoadingMessages}
                      isLoading={false}
                      isMobileScreen={isMobileScreen}
                      isStandalone={true}
                      onEdit={handleSaveEdit}
                      onDelete={handleDeleteMessage}
                      onCancelEdit={handleCancelEdit}
                      onStartEdit={handleStartEdit}
                      shouldScrollToBottom={false}
                    />
                  </DocumentsProvider>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaptureHome; 