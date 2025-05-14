import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { Send, ChevronLeft, X, Sparkles, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils.js";
import { Card } from "@/components/ui/card.js";
import { Button } from "@/components/ui/button.js";
import { useNavigate } from "react-router-dom";

// Import OneChat component
import { OneChat, OneChatRef } from "@/features/oneChat/OneChat.js";
import { DocumentsProvider } from "@/features/documents/contexts/DocumentsContext.js";

// Import SaveStatus type
import { SaveStatus } from "@/features/documents/models/document.js";

// Import HistorySummary component
import { HistorySummary } from "@/features/history/HistorySummary.js";
import { HistoryDetail } from "@/features/history/HistoryDetail.js";
import { 
  getUserHistory, 
  groupHistoryByDate, 
  formatDate, 
  HistoryItem,
  subscribeToHistoryList
} from "@/features/history/historyService.js";
import { createHistory } from "@/api/history/index.js";
import { messageSubscriptionService } from "@/lib/services.js";
import { useAuth } from "@/contexts/AuthContext.js";

export const CoachHome: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"today" | "history">("today");
  const [showCoachInterface, setShowCoachInterface] = useState(false);
  const [showSpotlightModal, setShowSpotlightModal] = useState(false);
  const [messageIds, setMessageIds] = useState<string[]>([]);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);
  const [generatingSpotlight, setGeneratingSpotlight] = useState(false);
  const [hasAvailableMessages, setHasAvailableMessages] = useState(false);
  const navigate = useNavigate();
  const oneChatRef = useRef<OneChatRef>(null);
  const { user } = useAuth();
  
  // Extract user's full name for greeting
  const userFullName = useMemo(() => {
    if (!user) return 'there';
    
    // Use user metadata if available, or fall back to email/id
    const metadata = user.user_metadata;
    if (metadata?.full_name) return metadata.full_name;
    if (metadata?.name) return metadata.name;
    
    // Alternative: split email to get name
    if (user.email) {
      const emailName = user.email.split('@')[0];
      // Convert email format (e.g., john.doe) to name format (John Doe)
      return emailName
        .split(/[._-]/) // Split by common email separators
        .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(' ');
    }
    
    return 'there'; // Fallback
  }, [user]);
  
  // Setup real-time subscription when tab changes to history
  useEffect(() => {
    // Only set up subscription when the history tab is active
    if (activeTab !== 'history') return;
    
    setIsLoading(true);
    
    // Set up subscription to history updates
    const unsubscribe = subscribeToHistoryList((items) => {
      setHistoryItems(items);
      setIsLoading(false);
      setError(null);
    });
    
    // Handle initial loading or errors
    const handleInitialLoad = async () => {
      try {
        // Initial fetch in case subscription takes time
        const data = await getUserHistory();
        setHistoryItems(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load history');
        console.error('Error fetching history:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    handleInitialLoad();
    
    // Clean up subscription when component unmounts or tab changes
    return () => {
      unsubscribe();
    };
  }, [activeTab]);

  // Subscribe to message updates to keep track of available messages for spotlighting
  useEffect(() => {
    if (!user || !showCoachInterface) return;
    
    // Function to check for available messages
    const checkAvailableMessages = () => {
      if (oneChatRef.current) {
        const messagesData = oneChatRef.current.getMessages();
        // Filter out messages that already have an inhistory_id
        const availableMessages = messagesData.messages.filter(msg => !msg.inhistory_id);
        setHasAvailableMessages(availableMessages.length > 0);
      }
    };
    
    // Set up listener for message updates
    const messageUpdateHandler = messageSubscriptionService.onMessageUpdated((updatedMessage) => {
      console.log('CoachHome: Message updated:', updatedMessage.id, 'inhistory_id:', updatedMessage.inhistory_id);
      // When a message is updated (including inhistory_id changes), recheck available messages
      checkAvailableMessages();
    });
    
    // Initial check
    checkAvailableMessages();
    
    // Clean up subscription when component unmounts or when coach interface is hidden
    return () => {
      messageUpdateHandler();
    };
  }, [user, showCoachInterface]);

  // Add debug effect
  useEffect(() => {
    console.log('CoachHome mounted - OneChat will be loaded with useOneChat hook');
  }, []);

  // Check for available messages whenever coach interface is visible
  useEffect(() => {
    if (!showCoachInterface || !oneChatRef.current) return;
    
    const checkAvailableMessages = () => {
      if (oneChatRef.current) {
        const messagesData = oneChatRef.current.getMessages();
        // Filter out messages that already have an inhistory_id
        const availableMessages = messagesData.messages.filter(msg => !msg.inhistory_id);
        setHasAvailableMessages(availableMessages.length > 0);
      }
    };
    
    // Check initially
    checkAvailableMessages();
    
    // Set up interval to check periodically (as a backup)
    const intervalId = setInterval(checkAvailableMessages, 5000);
    
    return () => clearInterval(intervalId);
  }, [showCoachInterface]);

  // New effect to scroll to bottom when the modal appears
  useEffect(() => {
    if (showCoachInterface && oneChatRef.current) {
      // The OneChat component doesn't directly expose scrollToBottom,
      // but we can use a known technique to get the MessageList's scrollToBottom
      
      // Short timeout to ensure the component is fully rendered
      const timer = setTimeout(() => {
        // Find the message container by its data attribute
        const messageContainer = document.querySelector('[data-chat-container]');
        if (messageContainer) {
          // Find the scrollable area within the message container
          const scrollableElement = messageContainer.querySelector('.overflow-auto, .overflow-y-auto');
          if (scrollableElement instanceof HTMLElement) {
            // Immediately scroll to the bottom without animation
            scrollableElement.scrollTop = scrollableElement.scrollHeight;
          }
        }
      }, 50); // Small delay for rendering
      
      return () => clearTimeout(timer);
    }
  }, [showCoachInterface]);

  const handleOpenCoachInterface = () => {
    setShowCoachInterface(true);
  };

  const handleCloseCoachInterface = () => {
    setShowCoachInterface(false);
    setShowSpotlightModal(false);
  };

  const handleEndConversation = () => {
    setShowCoachInterface(false);
    setShowSpotlightModal(false);
  };

  const handleSpotlightClick = () => {
    // Get the current message IDs from OneChat
    if (oneChatRef.current) {
      const messagesData = oneChatRef.current.getMessages();
      
      // Filter out messages that already have an inhistory_id
      const availableMessages = messagesData.messages.filter(msg => !msg.inhistory_id);
      const currentMessageIds = availableMessages.map(msg => msg.id);
      
      if (currentMessageIds.length === 0) {
        // Show a toast or alert that there are no new messages to summarize
        console.log("No new messages available for summarization");
        setHasAvailableMessages(false);
        // You could add a toast notification here
        return;
      }
      
      setHasAvailableMessages(true);
      setMessageIds(currentMessageIds);
      setShowSpotlightModal(true);
    } else {
      console.error("OneChat reference not available");
    }
  };

  const handleGenerateSpotlight = async () => {
    try {
      // Show loading state
      setGeneratingSpotlight(true);
      
      // Create a history entry from the message IDs
      console.log(`CoachHome: Creating history from ${messageIds.length} messages`);
      const result = await createHistory(messageIds);
      console.log(`CoachHome: Created history with ID ${result.historyId}`);
      
      // Hide the spotlight modal
      setShowSpotlightModal(false);
      
      // Show the history detail for the newly created history
      setSelectedHistoryId(result.historyId);
    } catch (error) {
      console.error("Error generating spotlight:", error);
      // You could show an error toast here
    } finally {
      setGeneratingSpotlight(false);
    }
  };

  const handleMorningIntention = () => {
    setShowCoachInterface(true);
    
    // Allow time for the interface to open and the OneChat component to mount
    setTimeout(() => {
      if (oneChatRef.current) {
        oneChatRef.current.sendMessage("Start morning intention");
      }
    }, 300);
  };

  const handleEveningReflection = () => {
    setShowCoachInterface(true);
    
    // Allow time for the interface to open and the OneChat component to mount
    setTimeout(() => {
      if (oneChatRef.current) {
        oneChatRef.current.sendMessage("Start evening reflection");
      }
    }, 300);
  };

  const handleHistoryItemClick = (historyId: string) => {
    setSelectedHistoryId(historyId);
  };

  const handleCloseHistoryDetail = () => {
    setSelectedHistoryId(null);
    // No need to manually refresh as we now have real-time subscription
  };

  // Create mock Documents context for OneChat
  const mockDocumentsContext = useMemo(() => ({
    // Document state
    selectedDocument: null,
    title: "",
    content: "",
    isPreviewMode: false,
    saveStatus: 'saved' as SaveStatus,
    lastSaved: null,
    hasUnsavedChanges: false,
    contentFormat: "markdown",
    documentVersions: [],
    
    // Project state
    selectedProjectId: null,
    projectsData: {},
    
    // Operations
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
  }), []);

  // Render history item for a specific date
  const renderHistoryDateCard = (date: string, items: HistoryItem[]) => {
    const formattedDate = formatDate(date);
    const item = items[0]; // Get the first item for the date
    
    // Get title or generate a fallback
    const getTitle = () => {
      if (item.content.title) {
        return item.content.title;
      }
      
      // Use type if available as a fallback
      if (item.content.type) {
        const type = item.content.type;
        return type.charAt(0).toUpperCase() + type.slice(1) + ' reflection';
      }
      
      // Default title if no other options
      return 'Conversation';
    };
    
    return (
      <Card 
        key={date} 
        className="mb-4 bg-complement/5 hover:bg-complement/10 border-complement/10 transition-all duration-300 cursor-pointer"
        onClick={() => handleHistoryItemClick(items[0].id)}
      >
        <div className="p-4">
          <div className="font-medium text-lg">{getTitle()}</div>
          <div className="text-sm text-muted-foreground mt-1">{formattedDate}</div>
        </div>
      </Card>
    );
  };

  return (
    <div className="flex flex-col h-[100dvh] w-full">
      {/* Fixed header that stays at the top */}
                    <div className="sticky top-0 w-full bg-background/95 backdrop-blur-sm flex justify-center border-b z-40 shadow-sm">
          <div className="inline-flex items-center h-[60px]">
          <button
            onClick={() => setActiveTab("today")}
            className={cn(
              "px-4 h-full text-lg font-medium transition-colors relative flex items-center",
              activeTab === "today" 
                ? "text-primary" 
                : "text-muted-foreground hover:text-primary/80"
            )}
          >
            today
            {activeTab === "today" && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary"></div>
            )}
          </button>
          <span className="text-muted-foreground mx-1">|</span>
          <button
            onClick={() => setActiveTab("history")}
            className={cn(
              "px-4 h-full text-lg font-medium transition-colors relative flex items-center",
              activeTab === "history" 
                ? "text-primary" 
                : "text-muted-foreground hover:text-primary/80"
            )}
          >
            history
            {activeTab === "history" && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary"></div>
            )}
          </button>
        </div>
      </div>

      {/* Content area with padding-top to account for fixed header */}
      <div className="flex-1 overflow-hidden pt-[70px] md:pt-[60px]">
        <div 
          className="flex h-full transition-transform duration-300 ease-in-out"
          style={{ 
            transform: activeTab === "today" ? "translateX(0%)" : "translateX(-50%)",
            width: "200%" 
          }}
        >
                      {/* Today Content */}
          <div className="w-1/2 h-full flex flex-col items-center px-4 overflow-y-auto pb-20">
            <div className="mt-6 md:mt-10 flex flex-col items-center w-full max-w-md">
              {/* Flame Character */}
              <div className="w-20 h-20 flex items-center justify-center mb-6">
                <img 
                  src="/images/Logo_512x512.png" 
                  alt="InnerFlame Logo" 
                  className="w-20 h-20 object-contain drop-shadow-md"
                />
              </div>
              
              {/* Catch up text - now dynamic with user's full name */}
              <p className="text-xl mb-6 font-medium">{userFullName}, want to catch up?</p>
              
              {/* Message Input Field - Now clickable */}
              <div className="w-full relative mb-12">
                <div 
                  onClick={handleOpenCoachInterface}
                  className="flex items-center w-full border rounded-full bg-background px-4 py-3 shadow-sm focus-within:ring-2 focus-within:ring-primary/30 cursor-pointer"
                >
                  <div className="flex-1 text-muted-foreground text-sm">Message InnerFlame</div>
                  <button 
                    className="flex justify-center items-center h-8 w-8 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              {/* Cards - changed to display side by side by default */}
              <div className="grid grid-cols-2 gap-3 xs:gap-4 sm:gap-6 w-full">
                {/* Morning Intention Card - more compact styling */}
                <Card 
                  className="overflow-hidden bg-complement/10 dark:bg-complement/5 border-complement/20 dark:border-complement/10 shadow-md transition-transform hover:scale-105 duration-300 cursor-pointer min-w-[120px]"
                  onClick={handleMorningIntention}
                >
                  <div className="p-3 sm:p-6 flex flex-col items-center">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center mb-2 sm:mb-3">
                      <img 
                        src="/images/morning_sun.png" 
                        alt="Morning Sun" 
                        className="w-12 h-12 sm:w-16 sm:h-16 object-contain drop-shadow-sm"
                      />
                    </div>
                    <p className="text-base sm:text-xl font-medium">morning</p>
                    <p className="text-base sm:text-xl">intention</p>
                  </div>
                </Card>

                {/* Evening Reflection Card - more compact styling */}
                <Card 
                  className="overflow-hidden bg-complement/10 dark:bg-complement/5 border-complement/20 dark:border-complement/10 shadow-md transition-transform hover:scale-105 duration-300 cursor-pointer min-w-[120px]"
                  onClick={handleEveningReflection}
                >
                  <div className="p-3 sm:p-6 flex flex-col items-center">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center mb-2 sm:mb-3">
                      <img 
                        src="/images/night_moon.png" 
                        alt="Night Moon" 
                        className="w-12 h-12 sm:w-16 sm:h-16 object-contain drop-shadow-sm"
                      />
                    </div>
                    <p className="text-base sm:text-xl font-medium">evening</p>
                    <p className="text-base sm:text-xl">reflection</p>
                  </div>
                </Card>
              </div>
            </div>
          </div>
          
          {/* History Content */}
          <div className="w-1/2 h-full flex flex-col items-center px-4 py-6 overflow-y-auto pb-20">
            <div className="w-full max-w-3xl">
              {/* Loading state */}
              {isLoading && (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-12 h-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin mb-4"></div>
                  <p className="text-muted-foreground">Loading history...</p>
                </div>
              )}
              
              {/* Error state */}
              {!isLoading && error && (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="text-destructive mb-4">Failed to load history</div>
                  <p className="text-muted-foreground mb-6">{error}</p>
                  <Button 
                    onClick={() => {
                      // Force a refresh by toggling the tab
                      setActiveTab("today");
                      setTimeout(() => setActiveTab("history"), 10);
                    }}
                  >
                    Try Again
                  </Button>
                </div>
              )}
              
              {/* Empty state */}
              {!isLoading && !error && historyItems.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12">
                  <BookOpen className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-xl font-medium mb-2">No history yet</h3>
                  <p className="text-muted-foreground text-center mb-6">
                    Your conversation history will appear here after you've completed some reflections.
                  </p>
                  <Button onClick={() => setActiveTab("today")}>Start a Conversation</Button>
                </div>
              )}
              
              {/* Individual history items */}
              {!isLoading && !error && historyItems.length > 0 && (
                <div>
                  <div className="mb-4 flex justify-between items-center">
                    <h3 className="text-lg font-medium">All History ({historyItems.length})</h3>
                  </div>
                  
                  {historyItems.map((item) => (
                    <Card 
                      key={item.id} 
                      className="mb-4 bg-complement/5 hover:bg-complement/10 border-complement/10 transition-all duration-300 cursor-pointer"
                      onClick={() => handleHistoryItemClick(item.id)}
                    >
                      <div className="p-4">
                        <div className="font-medium text-lg">
                          {item.content.title || 
                            (item.content.type 
                              ? item.content.type.charAt(0).toUpperCase() + item.content.type.slice(1) + ' reflection'
                              : 'Conversation'
                            )
                          }
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">{formatDate(item.created_at)}</div>
                        {item.content.tags && item.content.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {item.content.tags.slice(0, 3).map((tag, index) => (
                              <div 
                                key={index}
                                className="inline-flex items-center rounded-full bg-primary/5 px-1.5 py-0.5 text-xs font-medium text-primary/70"
                              >
                                {tag}
                              </div>
                            ))}
                            {item.content.tags.length > 3 && (
                              <div className="inline-flex items-center rounded-full bg-primary/5 px-1.5 py-0.5 text-xs font-medium text-primary/70">
                                +{item.content.tags.length - 3} more
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Coach Interface - Slide up */}
      <div 
        className={cn(
          "fixed inset-0 bg-background z-50 transition-transform duration-300",
          showCoachInterface ? "translate-y-0" : "translate-y-full"
        )}
      >
        {/* Coach Interface Header */}
        <header className="w-full border-b bg-background">
          <div className="flex items-center justify-between h-14 px-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCloseCoachInterface}
              aria-label="Go back"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            
            <div className="w-8"></div> {/* Empty div for spacing */}
            
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSpotlightClick}
              aria-label="Create spotlight"
              className={cn(
                "transition-colors",
                hasAvailableMessages
                  ? "text-primary hover:text-primary/80"
                  : "text-muted-foreground cursor-not-allowed opacity-50"
              )}
              disabled={!hasAvailableMessages}
            >
              <Sparkles className="h-5 w-5" />
            </Button>
          </div>
        </header>
        
        {/* OneChat component wrapped in DocumentsProvider */}
        <div className="h-[calc(100vh-3.5rem)]">
          <DocumentsProvider value={mockDocumentsContext}>
            <OneChat 
              ref={oneChatRef}
              isStandalone={true}
              viewMode="coach"
            />
          </DocumentsProvider>
        </div>
      </div>

      {/* Spotlight Modal */}
      {showSpotlightModal && (
        <div 
          className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center"
          onClick={() => setShowSpotlightModal(false)}
        >
          <div 
            className="bg-background rounded-lg shadow-lg w-full max-w-md mx-auto p-6 flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sparkle Icon */}
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            
            <h2 className="text-xl font-semibold mb-3 text-center">Ready to create your spotlight?</h2>
            
            <p className="text-center text-muted-foreground mb-6">
              InnerFlame can now analyze your conversation and highlight meaningful insights. 
              Create your spotlight now or continue chatting to add more context.
            </p>
            
            <div className="w-full space-y-3">
              <Button 
                className="w-full"
                onClick={handleGenerateSpotlight}
                disabled={messageIds.length === 0 || generatingSpotlight}
              >
                {generatingSpotlight ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-background/30 border-t-background animate-spin mr-2"></div>
                    Generating...
                  </>
                ) : (
                  'Generate my spotlight'
                )}
              </Button>
              
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowSpotlightModal(false)}
              >
                Continue chatting
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* History Detail Modal */}
      {selectedHistoryId && (
        <HistoryDetail 
          historyId={selectedHistoryId}
          onClose={handleCloseHistoryDetail}
        />
      )}
    </div>
  );
};

export default CoachHome; 