import React, { useState, KeyboardEvent, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Button } from '@/components/ui/button.js';
import { Textarea } from '@/components/ui/textarea.js';
import { ArrowUp, Info, Check, FileText } from 'lucide-react';
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

interface OneChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  isDisabled?: boolean;
  placeholder?: string;
  isAnonymous?: boolean;
  canvasHasContent?: boolean;
  onModeChange?: (mode: 'capture' | 'ask' | 'coach' | 'document') => void;
  initialMode?: 'capture' | 'ask' | 'coach' | 'document';
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
  initialMode = 'coach'
}, ref) => {
  const [message, setMessage] = useState('');
  const [showManual, setShowManual] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [currentMode, setCurrentMode] = useState<'capture' | 'ask' | 'coach' | 'document'>(initialMode);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { trackButtonClick } = useTracking();
  
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

  // Placeholder for mock documents
  const mockDocuments = [
    { id: 'doc1', title: 'Project Overview' },
    { id: 'doc2', title: 'Business Model Canvas' },
    { id: 'doc3', title: 'Customer Research' },
    { id: 'doc4', title: 'Pitch Deck' },
    { id: 'doc5', title: 'Marketing Strategy' },
  ];

  const handleDocumentSelect = (docId: string) => {
    setCurrentMode('document');
    setShowDocumentModal(false);
    // In a real implementation, you would notify the parent about the selected document
  };

  const tabLabels = [
    { key: 'capture', label: 'capture' },
    { key: 'ask', label: 'ask' },
    { key: 'coach', label: 'reflect' },
    { key: 'document', label: 'create' },
  ];
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
          <div className="px-4 pt-4 pb-3">
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
                    overflowY: message.split('\n').length > 12 ? 'scroll' : 'hidden'
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
          <div className="flex items-center justify-between gap-2 px-5 pb-4">
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
                {tabLabels.map((tab, idx) => (
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
            {mockDocuments.map(doc => (
              <Button
                key={doc.id}
                variant="outline"
                className="w-full justify-start gap-2 h-auto p-3 hover:bg-muted"
                onClick={() => handleDocumentSelect(doc.id)}
              >
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span>{doc.title}</span>
              </Button>
            ))}
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