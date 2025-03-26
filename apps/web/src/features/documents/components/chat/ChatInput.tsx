import React, { useState, KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button.js';
import { Textarea } from '@/components/ui/textarea.js';
import { Send, Info } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog.js';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  isDisabled?: boolean;
  placeholder?: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isLoading,
  isDisabled = false,
  placeholder = "How can InnerFlame help you today?"
}) => {
  const [message, setMessage] = useState('');
  const [showManual, setShowManual] = useState(false);
  
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
  
  return (
    <div className="flex flex-col gap-2 mt-auto">
      <div className="flex gap-2 p-0.5">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 min-h-[72px] max-h-[288px] resize-none overflow-y-auto"
          style={{
            height: 'auto',
            overflowY: message.split('\n').length > 12 ? 'scroll' : 'hidden'
          }}
          rows={Math.min(Math.max(message.split('\n').length || 3, 3), 12)}
          disabled={isLoading || isDisabled}
        />
        <Button 
          onClick={handleSendMessage} 
          type="submit" 
          className="h-auto self-start" 
          disabled={isLoading || isDisabled || !message.trim()}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 px-1 pb-1">
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
    </div>
  );
}; 