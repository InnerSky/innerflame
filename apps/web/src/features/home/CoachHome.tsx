import React, { useState, useMemo, useEffect } from "react";
import { Send, ChevronLeft, X } from "lucide-react";
import { cn } from "@/lib/utils.js";
import { Card } from "@/components/ui/card.js";
import { Button } from "@/components/ui/button.js";
import { useNavigate } from "react-router-dom";

// Import OneChat component
import { OneChat } from "@/features/oneChat/OneChat.js";
import { DocumentsProvider } from "@/features/documents/contexts/DocumentsContext.js";

// Import SaveStatus type
import { SaveStatus } from "@/features/documents/models/document.js";

export const CoachHome: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"today" | "history">("today");
  const [showCoachInterface, setShowCoachInterface] = useState(false);
  const navigate = useNavigate();

  // Add debug effect
  useEffect(() => {
    console.log('CoachHome mounted - OneChat will be loaded with useOneChat hook');
  }, []);

  const handleOpenCoachInterface = () => {
    setShowCoachInterface(true);
  };

  const handleCloseCoachInterface = () => {
    setShowCoachInterface(false);
  };

  const handleEndConversation = () => {
    setShowCoachInterface(false);
    // Additional logic for ending conversation could go here
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

  return (
    <div className="flex flex-col h-full w-full overflow-hidden relative">
      {/* Toggle */}
      <div className="flex justify-center py-4 border-b mb-2">
        <div className="inline-flex items-center">
          <button
            onClick={() => setActiveTab("today")}
            className={cn(
              "px-4 py-2 text-lg font-medium transition-colors relative",
              activeTab === "today" 
                ? "text-primary" 
                : "text-muted-foreground hover:text-primary/80"
            )}
          >
            today
            {activeTab === "today" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>
            )}
          </button>
          <span className="text-muted-foreground mx-1">|</span>
          <button
            onClick={() => setActiveTab("history")}
            className={cn(
              "px-4 py-2 text-lg font-medium transition-colors relative",
              activeTab === "history" 
                ? "text-primary" 
                : "text-muted-foreground hover:text-primary/80"
            )}
          >
            history
            {activeTab === "history" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>
            )}
          </button>
        </div>
      </div>

      {/* Sliding Content */}
      <div className="flex-1 overflow-hidden">
        <div 
          className="flex h-full transition-transform duration-300 ease-in-out"
          style={{ 
            transform: activeTab === "today" ? "translateX(0%)" : "translateX(-50%)",
            width: "200%" 
          }}
        >
          {/* Today Content */}
          <div className="w-1/2 h-full flex flex-col items-center px-4 overflow-y-auto pb-6">
            <div className="mt-10 flex flex-col items-center w-full max-w-md">
              {/* Flame Character */}
              <div className="w-20 h-20 flex items-center justify-center mb-6">
                <img 
                  src="/images/Logo_512x512.png" 
                  alt="InnerFlame Logo" 
                  className="w-20 h-20 object-contain drop-shadow-md"
                />
              </div>
              
              {/* Catch up text */}
              <p className="text-xl mb-6 font-medium">Po, want to catch up?</p>
              
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
              
              {/* Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
                {/* Morning Intention Card */}
                <Card className="overflow-hidden bg-complement/10 dark:bg-complement/5 border-complement/20 dark:border-complement/10 shadow-md transition-transform hover:scale-105 duration-300">
                  <div className="p-6 flex flex-col items-center">
                    <div className="w-16 h-16 flex items-center justify-center mb-3">
                      <img 
                        src="/images/morning_sun.png" 
                        alt="Morning Sun" 
                        className="w-16 h-16 object-contain drop-shadow-sm"
                      />
                    </div>
                    <p className="text-xl font-medium">morning</p>
                    <p className="text-xl">intention</p>
                  </div>
                </Card>

                {/* Evening Reflection Card */}
                <Card className="overflow-hidden bg-complement/10 dark:bg-complement/5 border-complement/20 dark:border-complement/10 shadow-md transition-transform hover:scale-105 duration-300">
                  <div className="p-6 flex flex-col items-center">
                    <div className="w-16 h-16 flex items-center justify-center mb-3">
                      <img 
                        src="/images/night_moon.png" 
                        alt="Night Moon" 
                        className="w-16 h-16 object-contain drop-shadow-sm"
                      />
                    </div>
                    <p className="text-xl font-medium">evening</p>
                    <p className="text-xl">reflection</p>
                  </div>
                </Card>
              </div>
            </div>
          </div>
          
          {/* History Content */}
          <div className="w-1/2 h-full flex flex-col items-center px-4 py-6 overflow-y-auto">
            <div className="w-full max-w-3xl">
              {/* Date boxes */}
              {[
                { date: "May 15, 2024", items: 2 },
                { date: "May 14, 2024", items: 1 },
                { date: "May 13, 2024", items: 2 },
                { date: "May 12, 2024", items: 1 },
                { date: "May 11, 2024", items: 2 },
              ].map((entry, index) => (
                <Card 
                  key={index} 
                  className="mb-4 bg-complement/10 dark:bg-complement/5 border-complement/20 dark:border-complement/10 shadow-md transition-transform hover:scale-105 duration-300"
                >
                  <div className="px-4 py-3 border-b border-complement/20 dark:border-complement/10">
                    <div className="text-sm text-muted-foreground">{entry.date}</div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">Past entries ({entry.items})</div>
                      <div className="text-xs px-2 py-1 bg-complement/20 dark:bg-complement/30 rounded-full">
                        {entry.items === 1 ? "Evening" : "Morning & Evening"}
                      </div>
                    </div>
                    <div className="mt-3 h-12 w-full bg-complement/10 dark:bg-complement/20 rounded-lg flex items-center justify-center">
                      <span className="text-sm text-muted-foreground">Tap to view entry details</span>
                    </div>
                  </div>
                </Card>
              ))}
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
            
            <h1 className="text-lg font-medium">Coach</h1>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={handleEndConversation}
              aria-label="End conversation"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </header>
        
        {/* OneChat component wrapped in DocumentsProvider */}
        <div className="h-[calc(100vh-3.5rem)]">
          <DocumentsProvider value={mockDocumentsContext}>
            <OneChat 
              isStandalone={true}
              viewMode="coach"
            />
          </DocumentsProvider>
        </div>
      </div>
    </div>
  );
};

export default CoachHome; 