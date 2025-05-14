import React, { useState, KeyboardEvent, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Button } from '@/components/ui/button.js';
import { Textarea } from '@/components/ui/textarea.js';
import { ArrowUp, Info, Check, FileText, Pen, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog.js';
import { AuthModal } from '@/components/auth/AuthModal.js';
import { useTracking } from '@/contexts/TrackingContext.js';
import { PricingModal } from '@/components/PricingModal.js';
import { cn } from '@/lib/utils.js';
import { useAuth } from '@/contexts/AuthContext.js';
import { DocumentService } from '@/features/documents/services/documentService.js';
import { Document } from '@/features/documents/models/document.js';

interface OneChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  isDisabled?: boolean;
  placeholder?: string;
  isAnonymous?: boolean;
  canvasHasContent?: boolean;
  onModeChange?: (mode: 'capture' | 'ask' | 'coach' | 'document') => void;
  initialMode?: 'capture' | 'ask' | 'coach' | 'document';
  onDocumentSelect?: (document: Document | null) => void;
  selectedDocument?: Document | null;
}

// Define the ref interface
export interface OneChatInputRef {
  setInputText: (text: string) => void;
  focusInput: () => void;
}

export const OneChatInput = forwardRef<OneChatInputRef, OneChatInputProps>(({
  onSendMessage,
  isLoading,
  isDisabled = false,
  placeholder = "How can InnerFlame help you today?",
  isAnonymous = false,
  canvasHasContent = false,
  onModeChange,
  initialMode = 'coach',
  onDocumentSelect,
  selectedDocument
}, ref) => {
  const [message, setMessage] = useState('');
  const [showManual, setShowManual] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [currentMode, setCurrentMode] = useState<'capture' | 'ask' | 'coach' | 'document'>(initialMode);
  const [previousMode, setPreviousMode] = useState<'capture' | 'ask' | 'coach'>(initialMode === 'document' ? 'capture' : initialMode as 'capture' | 'ask' | 'coach');
  const [userDocuments, setUserDocuments] = useState<Document[]>([]);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(selectedDocument?.id || null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { trackButtonClick } = useTracking();
  const { user } = useAuth();
  const documentService = DocumentService.getInstance();
  
  // Detect if we're on a mobile device
  const [isMobile, setIsMobile] = useState(false);
  
  // Check if the device is mobile on component mount
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Initial check
    checkMobile();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Notify parent when mode changes
  useEffect(() => {
    if (onModeChange) {
      onModeChange(currentMode);
    }
  }, [currentMode, onModeChange]);
  
  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    setInputText: (text: string) => {
      setMessage(text);
    },
    focusInput: () => {
      textareaRef.current?.focus();
    }
  }));
  
  // Handle keyboard shortcuts
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      if (e.shiftKey || isMobile) {
        // Allow new line with Shift+Enter or on mobile
        return;
      } else {
        // Send message on plain Enter (desktop only)
        e.preventDefault();
        handleSendMessage();
      }
    }
  };
  
  // Handle send button click
  const handleSendMessage = () => {
    if (message.trim() && !isLoading && !isDisabled) {
      onSendMessage(message);
      setMessage('');
    }
  };

  // Handle focus state for highlighting
  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  // Handle mode changes
  const handleModeChange = (mode: 'capture' | 'ask' | 'coach' | 'document') => {
    if (mode === 'document') {
      // Save the current mode before switching to document mode
      if (currentMode !== 'document') {
        setPreviousMode(currentMode as 'capture' | 'ask' | 'coach');
      }
      setShowDocumentModal(true);
    } else {
      setCurrentMode(mode);
    }
  };

  // Determine if we should show the conversion overlay
  const showConversionOverlay = isAnonymous && canvasHasContent;
  
  // Handle plan button click
  const handleActivePlanClick = () => {
    trackButtonClick("chat_overlay_activate_plan", {
      data: {
        source: "chat_input",
        context: "lean_canvas"
      }
    });
    
    // Open the pricing modal instead of navigating
    setShowPricingModal(true);
  };

  // Set up real-time subscription to documents when modal opens
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    
    const setupDocumentSubscription = async () => {
      if (showDocumentModal && user?.id) {
        setIsLoadingDocuments(true);
        
        try {
          // Fetch initial documents
          const initialDocuments = await documentService.getUserDocuments(user.id);
          setUserDocuments(initialDocuments);
          
          // Subscribe to real-time updates
          unsubscribe = documentService.subscribeToUserDocuments(user.id, (documents) => {
            setUserDocuments(documents);
          });
        } catch (error) {
          console.error("Error loading documents:", error);
        } finally {
          setIsLoadingDocuments(false);
        }
      }
    };
    
    setupDocumentSubscription();
    
    // Clean up subscription when modal closes
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [showDocumentModal, user?.id]);

  // Handle document select
  const handleDocumentSelect = (docId: string) => {
    const selectedDoc = userDocuments.find(doc => doc.id === docId);
    setSelectedDocumentId(docId);
    setCurrentMode('document');
    setShowDocumentModal(false);
    
    // Notify parent component about selected document
    if (onDocumentSelect && selectedDoc) {
      onDocumentSelect(selectedDoc);
    }
  };

  // Handle document deselect
  const handleDocumentDeselect = () => {
    setSelectedDocumentId(null);
    
    // Switch back to the previous mode
    setCurrentMode(previousMode);
    
    // Notify parent component about deselection
    if (onDocumentSelect) {
      onDocumentSelect(null);
    }
  };

  const tabLabels = [
    { key: 'capture', label: 'capture' },
    { key: 'coach', label: 'reflect' },
    { key: 'ask', label: 'ask' },
    { key: 'document', label: 'doc agent' },
  ];
  
  // Filter out the document tab if no document is selected
  const filteredTabs = selectedDocumentId ? tabLabels : tabLabels.filter(tab => tab.key !== 'document');
  
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [highlightStyle, setHighlightStyle] = useState<{ left: number; width: number }>({ left: 0, width: 0 });

  useEffect(() => {
    const idx = tabLabels.findIndex(t => t.key === currentMode);
    const btn = tabRefs.current[idx];
    if (btn) {
      const { offsetLeft, offsetWidth } = btn;
      setHighlightStyle({ left: offsetLeft, width: offsetWidth });
    }
  }, [currentMode]);

  return (
    <div className={`flex flex-col mt-auto transition-all duration-200`}>
      {/* Card-like container with pronounced edge */}
      <div 
        className={`
          relative w-full 
          bg-background 
          rounded-t-lg 
          shadow-md 
          border-2
          border-b-0
          ${isFocused ? 'border-primary/60' : 'border-border'} 
          transition-colors duration-200
        `}
      >
        {/* Input area */}
        <div className={`${showConversionOverlay ? 'hidden' : ''}`}>
          <div className="pl-2 pr-4 pt-4 pb-3">
            {/* Document button or selected document display */}
            <div className="mb-.5 ml-2">
              {selectedDocumentId ? (
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    className="h-6 min-h-0 text-xs leading-none text-foreground hover:text-foreground flex items-center gap-1.5 rounded-md px-2 py-0.5 border border-primary/30 hover:border-primary/50 bg-primary/10 hover:bg-primary/20"
                  >
                    <FileText className="h-3 w-3" />
                    <span className="leading-none">
                      {userDocuments.find(doc => doc.id === selectedDocumentId)?.title || "Unnamed document"}
                    </span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0 rounded-full"
                    onClick={handleDocumentDeselect}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <Button 
                  variant="ghost" 
                  className="h-6 min-h-0 text-xs leading-none text-muted-foreground/60 hover:text-foreground flex items-center gap-1.5 rounded-md px-2 py-0.5 border border-muted-foreground/30 hover:border-muted-foreground/50 bg-transparent hover:bg-background/60"
                  onClick={() => handleModeChange('document')}
                >
                  <Pen className="h-3 w-3" />
                  <span className="leading-none">work on a document</span>
                </Button>
              )}
            </div>
            <div className="relative w-full">
              <div className="w-full pr-12 overflow-hidden">
                <Textarea
                  ref={textareaRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  placeholder={currentMode === 'coach' ? "Ask your coach a question..." : 
                              currentMode === 'document' ? "Ask about your documents..." : 
                              currentMode === 'ask' ? "Ask InnerFlame anything..." : 
                              "Capture your thoughts..."}
                  className="w-full min-h-[72px] max-h-[288px] resize-none overflow-y-auto border-0 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none"
                  style={{
                    height: 'auto',
                    overflowY: message.split('\n').length > 10 ? 'scroll' : 'hidden'
                  }}
                  rows={Math.min(Math.max(message.split('\n').length || 3, 3), 12)}
                  disabled={isLoading || isDisabled}
                />
              </div>
              {/* Absolutely positioned send button */}
              <Button 
                onClick={handleSendMessage} 
                type="submit" 
                className="absolute right-0 top-[2px] w-10 h-9 rounded-md p-0 flex items-center justify-center"
                disabled={isLoading || isDisabled || !message.trim()}
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Toolbar with mode toggles */}
          <div className="flex items-center justify-between gap-2 pl-4 pr-5 pb-4">
            {/* Mode toggle buttons */}
            <div className="relative inline-flex rounded-md bg-muted/40">
              {/* Sliding indicator - absolutely positioned */}
              <div
                className="absolute top-0 left-0 h-8 rounded-md bg-neutral-500 shadow-sm transition-all duration-200 ease-out z-0"
                style={{
                  width: `${highlightStyle.width + 16}px`,
                  left: `${highlightStyle.left - 8}px`,
                  pointerEvents: 'none',
                }}
                aria-hidden="true"
              />
              {/* Tab buttons as inline-flex */}
              <div className="flex h-8 items-center relative z-10" role="tablist" aria-label="Chat mode options">
                {filteredTabs.map((tab, idx) => (
                  <button
                    key={tab.key}
                    ref={el => tabRefs.current[idx] = el}
                    role="tab"
                    type="button"
                    aria-selected={currentMode === tab.key}
                    tabIndex={currentMode === tab.key ? 0 : -1}
                    className={cn(
                      "flex items-center justify-center h-8 px-4 mx-2 p-0 leading-none",
                      "text-xs font-medium transition-colors rounded-md bg-transparent",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                      currentMode === tab.key
                        ? "text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    onClick={() => handleModeChange(tab.key as 'capture' | 'ask' | 'coach' | 'document')}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {message.trim() && !isMobile && (
              <p className="text-xs text-muted-foreground">
                Use <strong>Shift</strong> + <strong>Return</strong> for a new line
              </p>
            )}
            
            {/* Info button - moved to right */}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setShowManual(true)}
            >
              <Info className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Conversion overlay */}
        {showConversionOverlay && (
          <div className="w-full bg-background/95 backdrop-blur-sm flex items-center justify-center rounded-t-lg border-2 border-primary">
            <div className="text-center w-full max-w-md py-6 px-4">
              <h3 className="text-lg font-semibold text-primary bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-6">
                Activate Your Traction Flywheel
              </h3>
              <div className="space-y-3 text-left mb-6">
                <div className="flex items-center gap-2">
                  <div className="rounded-full bg-green-100 p-1 flex-shrink-0">
                    <Check className="h-3 w-3 text-green-600" />
                  </div>
                  <span className="text-xs">12 plug-and-play Game-Plan templates</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="rounded-full bg-green-100 p-1 flex-shrink-0">
                    <Check className="h-3 w-3 text-green-600" />
                  </div>
                  <span className="text-xs">Guided Build-Measure-Learn cycles</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="rounded-full bg-green-100 p-1 flex-shrink-0">
                    <Check className="h-3 w-3 text-green-600" />
                  </div>
                  <span className="text-xs">Powered by AI in one workspace</span>
                </div>
              </div>
              <div>
                <Button 
                  className="w-full bg-gradient-to-r from-orange-600 to-red-600 text-white hover:from-orange-700 hover:to-red-700 text-xs py-2"
                  onClick={handleActivePlanClick}
                >
                  Yes, please!
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* User Manual Modal */}
      <Dialog open={showManual} onOpenChange={setShowManual}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>InnerFlame Assistant User Manual</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Welcome to InnerFlame Assistant! Here's how to get the most out of your interaction:</p>
            
            <div className="space-y-2">
              <h3 className="font-medium">Basic Usage</h3>
              <ul className="list-disc pl-4 space-y-1">
                <li>Type your message in the text area</li>
                <li>{isMobile ? 'Press the send button to send your message' : 'Press Return to send your message'}</li>
                <li>{isMobile ? 'Press Return for new lines' : 'Use Shift+Return for new lines'}</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">Modes</h3>
              <ul className="list-disc pl-4 space-y-1">
                <li><strong>Capture</strong>: Record your thoughts and ideas</li>
                <li><strong>Coach</strong>: Get guidance from your InnerFlame coach</li>
                <li><strong>Document</strong>: Interact with your saved documents</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">Tips</h3>
              <ul className="list-disc pl-4 space-y-1">
                <li>Be specific in your questions</li>
                <li>You can ask follow-up questions</li>
                <li>The assistant remembers context from your conversation</li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Document Selection Modal */}
      <Dialog open={showDocumentModal} onOpenChange={setShowDocumentModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select a Document</DialogTitle>
            <DialogDescription>
              Choose a document to ask questions about
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-[50vh] overflow-y-auto">
            {isLoadingDocuments ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            ) : userDocuments.length > 0 ? (
              userDocuments.map(doc => (
                <Button
                  key={doc.id}
                  variant="outline"
                  className="w-full justify-start gap-2 h-auto p-3 hover:bg-muted"
                  onClick={() => handleDocumentSelect(doc.id)}
                >
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span>{doc.title}</span>
                </Button>
              ))
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                No documents found. Create a document to get started.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Pricing Modal */}
      <PricingModal 
        open={showPricingModal} 
        onOpenChange={setShowPricingModal} 
      />
    </div>
  );
});

export default OneChatInput; 