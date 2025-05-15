import React, { useState, useMemo, useEffect } from "react";
import { BookOpen, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils.js";
import { Card } from "@/components/ui/card.js";
import { Button } from "@/components/ui/button.js";
import { useNavigate } from "react-router-dom";

// Import services
import { 
  getUserHistory, 
  groupHistoryByDate, 
  formatDate, 
  HistoryItem,
  subscribeToHistoryList
} from "@/features/history/historyService.js";
import { useAuth } from "@/contexts/AuthContext.js";

// Import HistoryDetail component
import { HistoryDetail } from "@/features/history/HistoryDetail.js";

// Import the ChatState context
import { useChatState } from "@/features/chat/contexts/ChatStateContext.js";

export const CoachHome: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"today" | "history">("today");
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Get chat state
  const { openChat, sendMessage } = useChatState();
  
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

  const handleOpenCoachInterface = () => {
    openChat("coach");
  };

  const handleMorningIntention = () => {
    openChat("coach");
    sendMessage("Start morning intention");
  };

  const handleEveningReflection = () => {
    openChat("coach");
    sendMessage("Start evening reflection");
  };

  const handleHistoryItemClick = (historyId: string) => {
    setSelectedHistoryId(historyId);
  };

  const handleCloseHistoryDetail = () => {
    setSelectedHistoryId(null);
  };

  return (
    <div className="flex flex-col h-full w-full">
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

      {/* Content area */}
      <div className="flex-1 overflow-hidden">
        <div 
          className="flex transition-transform duration-300 ease-in-out h-full"
          style={{ 
            transform: activeTab === "today" ? "translateX(0%)" : "translateX(-50%)",
            width: "200%" 
          }}
        >
          {/* Today Content */}
          <div className="w-1/2 flex flex-col items-center px-4 overflow-y-auto p-4 pb-0">
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
                    className="flex justify-center items-center h-8 w-8 min-h-[32px] min-w-[32px] rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    <ArrowUp className="h-4 w-4" />
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
          <div className="w-1/2 flex flex-col items-center px-4 overflow-y-auto p-4 pb-0">
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