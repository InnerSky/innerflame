import React, { useState } from "react";
import { ChevronLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button.js";
import { cn } from "@/lib/utils.js";
import { OneChat } from "@/features/oneChat/OneChat.js";
import { DocumentsProvider } from "@/features/documents/contexts/DocumentsContext.js";
import { SaveStatus } from "@/features/documents/models/document.js";
import { useChatState } from "../contexts/ChatStateContext.js";
import { createHistory } from "@/api/history/index.js";

// Map our app's view modes to OneChat's supported view modes
const mapViewMode = (mode: "capture" | "coach" | "studio"): "capture" | "coach" | "ask" | "document" => {
  switch (mode) {
    case "capture": return "capture";
    case "coach": return "coach";
    case "studio": return "ask"; // Using "ask" mode for studio
    default: return "coach";
  }
};

export const ChatOverlay: React.FC = () => {
  const { isOpen, viewMode, closeChat, oneChatRef, hasAvailableMessages } = useChatState();
  const [showSpotlightModal, setShowSpotlightModal] = useState(false);
  const [messageIds, setMessageIds] = useState<string[]>([]);
  const [generatingSpotlight, setGeneratingSpotlight] = useState(false);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);

  // Create mock Documents context for OneChat
  const mockDocumentsContext = {
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
  };

  const handleSpotlightClick = () => {
    // Get the current message IDs from OneChat
    if (oneChatRef.current) {
      const messagesData = oneChatRef.current.getMessages();
      
      // Filter out messages that already have an inhistory_id
      const availableMessages = messagesData.messages.filter(msg => !msg.inhistory_id);
      const currentMessageIds = availableMessages.map(msg => msg.id);
      
      if (currentMessageIds.length === 0) {
        console.log("No new messages available for summarization");
        // You could add a toast notification here
        return;
      }
      
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
      console.log(`ChatOverlay: Creating history from ${messageIds.length} messages`);
      const result = await createHistory(messageIds);
      console.log(`ChatOverlay: Created history with ID ${result.historyId}`);
      
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

  return (
    <>
      {/* Chat Interface Overlay */}
      <div 
        className={cn(
          "fixed inset-0 bg-background z-[50] transition-transform duration-300",
          isOpen ? "translate-y-0" : "translate-y-full"
        )}
      >
        {/* Interface Header */}
        <header className="w-full border-b bg-background">
          <div className="flex items-center justify-between h-14 px-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={closeChat}
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
        <div className="h-[calc(100dvh-3.5rem)] flex justify-center">
          <div className="w-full max-w-[750px] pb-safe">
            <DocumentsProvider value={mockDocumentsContext}>
              <OneChat 
                ref={oneChatRef}
                isStandalone={true}
                viewMode={mapViewMode(viewMode)}
              />
            </DocumentsProvider>
          </div>
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
    </>
  );
}; 