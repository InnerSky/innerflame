import React, { useState, KeyboardEvent, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Button } from '@/components/ui/button.js';
import { Textarea } from '@/components/ui/textarea.js';
import { ArrowUp, Info, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog.js';
import { AuthModal } from '@/components/auth/AuthModal.js';
import { useTracking } from '@/contexts/TrackingContext.js';
import { PricingModal } from '@/components/PricingModal.js';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  isDisabled?: boolean;
  placeholder?: string;
  isAnonymous?: boolean;
  canvasHasContent?: boolean;
}

// Define the ref interface
export interface ChatInputRef {
  setInputText: (text: string) => void;
  focusInput: () => void;
}

export const ChatInput = forwardRef<ChatInputRef, ChatInputProps>(({
  onSendMessage,
  isLoading,
  isDisabled = false,
  placeholder = "How can InnerFlame help you today?",
  isAnonymous = false,
  canvasHasContent = false
}, ref) => {
  const [message, setMessage] = useState('');
  const [showManual, setShowManual] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { trackButtonClick } = useTracking();
  
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
      if (e.shiftKey) {
        // Allow new line with Shift+Enter
        return;
      } else {
        // Send message on plain Enter
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
                  placeholder={placeholder}
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
          
          {/* Toolbar */}
          <div className="flex items-center justify-between gap-2 px-5 pb-4">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setShowManual(true)}
            >
              <Info className="h-4 w-4" />
            </Button>
            {message.trim() && (
              <p className="text-xs text-muted-foreground">
                Use <strong>Shift</strong> + <strong>Return</strong> for a new line
              </p>
            )}
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
                <li>Press Return to send your message</li>
                <li>Use Shift+Return for new lines</li>
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

      {/* Pricing Modal */}
      <PricingModal 
        open={showPricingModal} 
        onOpenChange={setShowPricingModal} 
      />
    </div>
  );
}); 