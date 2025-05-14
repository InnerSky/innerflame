import React, { useEffect, useState, useRef, useMemo } from 'react';
import { ChevronLeft, Clock, Tag, MoreVertical, MessageSquare, Trash2, AlertTriangle, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils.js';
import { Button } from '@/components/ui/button.js';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu.js';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from '@/components/ui/dialog.js';
import { getHistoryById, getMessagesForHistory, deleteHistory, HistoryItem, formatDate } from './historyService.js';
import { MessageList } from '@/features/documents/components/chat/MessageList.js';
import { Message } from '@innerflame/types';
import { DocumentsProvider } from '@/features/documents/contexts/DocumentsContext.js';
import { SaveStatus } from '@/features/documents/models/document.js';
import { subscribeToHistory } from './historySubscription.js';

interface HistoryDetailProps {
  historyId: string;
  onClose: () => void;
}

export function HistoryDetail({ historyId, onClose }: HistoryDetailProps) {
  const [history, setHistory] = useState<HistoryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'spotlight'>('overview');
  const [showMessagesModal, setShowMessagesModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesError, setMessagesError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const messageListRef = useRef<{ scrollToBottom: () => void }>(null);

  // Create mock Documents context for MessageList
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

  useEffect(() => {
    // Trigger animation after mount
    setVisible(true);
    
    async function fetchHistoryDetails() {
      try {
        setLoading(true);
        const data = await getHistoryById(historyId);
        setHistory(data);
        // Default to overview tab, or spotlight if overview is minimal but spotlight has content
        if (data.content.overview && data.content.overview.length < 20 && data.content.headline) {
          setActiveTab('spotlight');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load history details';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    }

    fetchHistoryDetails();
    
    // Set up subscription to real-time updates
    const unsubscribe = subscribeToHistory(historyId, (updatedHistory) => {
      console.log("HistoryDetail: Received history update", updatedHistory);
      
      // Only update if content exists and has changed
      if (updatedHistory && updatedHistory.content) {
        setHistory(prev => {
          // If this is the first time we're getting content, or if the content has changed
          const hasNewContent = (!prev?.content.overview && updatedHistory.content.overview) || 
                                (!prev?.content.headline && updatedHistory.content.headline);
          const contentChanged = prev?.content.overview !== updatedHistory.content.overview ||
                                 prev?.content.headline !== updatedHistory.content.headline ||
                                 JSON.stringify(prev?.content.insights) !== JSON.stringify(updatedHistory.content.insights);
          
          if (hasNewContent || contentChanged) {
            console.log("HistoryDetail: Updating history with new content");
            return updatedHistory;
          }
          return prev;
        });
      }
    });
    
    // Clean up subscription on unmount
    return () => {
      unsubscribe();
    };
  }, [historyId]);

  const handleClose = () => {
    setVisible(false);
    // Wait for animation to complete before unmounting
    setTimeout(onClose, 300);
  };

  const handleShowMessages = async () => {
    try {
      setMessagesLoading(true);
      setMessagesError(null);
      const data = await getMessagesForHistory(historyId);
      setMessages(data);
      setShowMessagesModal(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load messages';
      setMessagesError(errorMessage);
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleDeleteHistory = async () => {
    try {
      setDeleteLoading(true);
      console.log(`HistoryDetail: Starting deletion of history ID ${historyId}`);
      await deleteHistory(historyId);
      console.log(`HistoryDetail: Successfully deleted history ID ${historyId}`);
      // Close all modals and return to history list
      setShowDeleteModal(false);
      handleClose();
    } catch (err) {
      console.error(`HistoryDetail: Error deleting history ID ${historyId}:`, err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete history';
      setError(errorMessage);
      setDeleteLoading(false);
    }
  };

  // Handle errors
  if (error) {
    return (
      <div className={cn(
        "fixed inset-0 bg-background z-50 flex flex-col transform transition-transform duration-300 ease-out",
        visible ? "translate-y-0" : "translate-y-full"
      )}>
        <header className="border-b">
          <div className="flex items-center h-14 px-4">
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </div>
        </header>
        <div className="flex-1 container py-8 flex items-center justify-center">
          <div className="text-center">
            <p className="text-destructive mb-4">Error loading history</p>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button onClick={handleClose}>Go Back</Button>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className={cn(
        "fixed inset-0 bg-background z-50 flex flex-col transform transition-transform duration-300 ease-out",
        visible ? "translate-y-0" : "translate-y-full"
      )}>
        <header className="border-b">
          <div className="flex items-center h-14 px-4">
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </div>
        </header>
        <div className="flex-1 container py-8 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading history details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!history) {
    return null;
  }

  const formattedDate = formatDate(history.created_at);
  
  // Check if content is completely empty or has default values
  // Consider content truly empty if both overview and spotlight (headline/insights) are minimal/default.
  const isContentGenerating = (
    (!history.content.overview || history.content.overview === '' || history.content.overview === 'No overview available' || history.content.overview === 'Summary of the conversation.' || history.content.overview === 'Error generating summary. Could not parse the content from the AI.' || history.content.overview === 'Error generating summary. An error occurred during the background processing task.') &&
    (!history.content.headline || history.content.headline === '' || history.content.headline === 'Spotlight Headline' || history.content.headline === 'Key takeaway from the conversation.' || history.content.headline === 'Error Generating Spotlight' || history.content.headline === 'Error Processing Spotlight') &&
    (!history.content.insights || history.content.insights.length === 0 || (history.content.insights.length === 1 && (history.content.insights[0] === 'No specific insights highlighted.' || history.content.insights[0] === 'General insights about the discussion.' || history.content.insights[0] === 'Summary could not be generated due to a parsing error.' || history.content.insights[0] === 'An error occurred during summary generation.')))
  );
  
  return (
    <div className={cn(
      "fixed inset-0 bg-background z-50 flex flex-col overflow-hidden transform transition-transform duration-300 ease-out",
      visible ? "translate-y-0" : "translate-y-full"
    )}>
      {/* Header */}
      <header className="border-b bg-background sticky top-0 z-10">
        <div className="flex items-center justify-between h-14 px-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            aria-label="Go back"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          {/* Tab switcher - updated for cleaner, more minimal look */}
          {!isContentGenerating && (
            <div className="inline-flex items-center rounded-full bg-muted/70 p-0.5 h-auto mx-2 my-1">
              <button
                onClick={() => setActiveTab('overview')}
                className={cn(
                  "relative px-2.5 py-0.5 text-xs font-medium rounded-full transition-colors",
                  activeTab === 'overview' 
                    ? "bg-background text-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('spotlight')}
                className={cn(
                  "relative px-2.5 py-0.5 text-xs font-medium rounded-full transition-colors",
                  activeTab === 'spotlight' 
                    ? "bg-background text-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Spotlight
              </button>
            </div>
          )}

          {/* More Options Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
                <span className="sr-only">More</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                className="flex items-center cursor-pointer" 
                onClick={handleShowMessages}
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                <span>Show messages</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="flex items-center text-destructive cursor-pointer" 
                onClick={() => setShowDeleteModal(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                <span>Delete history</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {isContentGenerating ? (
          <div className="h-full flex flex-col items-center justify-center p-6">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-6">
              <Sparkles className="h-8 w-8 text-primary animate-pulse" />
            </div>
            <h3 className="text-xl font-medium mb-2 text-center">Generating spotlight, please wait...</h3>
            <p className="text-muted-foreground text-center">
              InnerFlame is analyzing your conversation and creating meaningful insights.
            </p>
          </div>
        ) : (
          <div className="py-6 px-4 md:px-6">
            {activeTab === 'overview' && (
              <>
                {/* Meta information - Title for overview comes from formattedDate */}
                <div className="mb-6">
                  <h2 className="text-3xl font-bold mb-2">{history.content.title || formattedDate}</h2>
                  <div className="flex items-center text-muted-foreground text-sm">
                    <Clock className="h-4 w-4 mr-2" />
                    <span>{new Date(history.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                  {history.content.tags && history.content.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {history.content.tags.map((tag, index) => (
                        <div 
                          key={index}
                          className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                        >
                          <Tag className="h-3 w-3 mr-1" />
                          {tag}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Overview content */}
                <div>
                  {/* <h3 className="text-xl font-medium mb-2">Overview</h3> Removed explicit "Overview" h3 as title serves this purpose */}
                  <p className="text-base leading-relaxed whitespace-pre-line">{history.content.overview}</p>
                </div>
              </>
            )}

            {activeTab === 'spotlight' && (
              <>
                {/* Spotlight content */}
                {/* Headline for spotlight view */}
                <h2 className="text-3xl font-bold mb-4">{history.content.headline}</h2>
                
                {/* Quote */}
                {history.content.quote && (
                  <blockquote className="mb-6 p-4 bg-muted/50 border-l-4 border-primary italic rounded-md">
                    <p className="text-base leading-relaxed">"{history.content.quote}"</p>
                  </blockquote>
                )}
                
                {/* Insights */}
                <div className="space-y-4">
                  {history.content.insights.map((insight, index) => (
                    <p key={index} className="text-base leading-relaxed whitespace-pre-line">{insight}</p>
                  ))}
                </div>
                
                {/* Optional: Show only date and tags for Spotlight view, removing the time */}
                <div className="mt-8 pt-4 border-t border-muted/20">
                  <div className="flex flex-wrap gap-2">
                    {history.content.tags && history.content.tags.length > 0 && history.content.tags.map((tag, index) => (
                      <div 
                        key={index}
                        className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                      >
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Messages Modal */}
      <Dialog open={showMessagesModal} onOpenChange={setShowMessagesModal}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Messages</DialogTitle>
            <DialogDescription>
              Original messages that were used to create this summary.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 min-h-[400px] overflow-hidden my-4 border rounded-md">
            {messagesLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="w-8 h-8 rounded-full border-4 border-primary/30 border-t-primary animate-spin"></div>
              </div>
            ) : messagesError ? (
              <div className="flex flex-col items-center justify-center h-full p-4">
                <p className="text-destructive mb-2">Error loading messages</p>
                <p className="text-muted-foreground text-sm text-center">{messagesError}</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-full p-4">
                <p className="text-muted-foreground text-center">No messages found for this history.</p>
              </div>
            ) : (
              <DocumentsProvider value={mockDocumentsContext}>
                <MessageList
                  ref={messageListRef}
                  messages={messages}
                  streamingContents={{}}
                  streamingMessages={{}}
                  editingMessageId={null}
                  isEditing={false}
                  editedMessageIds={new Set()}
                  isInitialLoading={false}
                  isLoading={false}
                  isMobileScreen={false}
                  isStandalone={true}
                  onEdit={async () => false}
                  onDelete={async () => false}
                  onCancelEdit={() => {}}
                  onStartEdit={() => {}}
                  shouldScrollToBottom={true}
                />
              </DocumentsProvider>
            )}
          </div>
          
          <DialogFooter>
            <Button onClick={() => setShowMessagesModal(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center text-destructive">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Delete History
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this history? This will unlink all associated messages and remove this summary permanently.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(false)}
              disabled={deleteLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteHistory}
              disabled={deleteLoading}
            >
              {deleteLoading ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-background/30 border-t-background animate-spin mr-2"></div>
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 