import React, { useState, KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button.js';
import { Textarea } from '@/components/ui/textarea.js';
import { Send } from 'lucide-react';

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
  placeholder = "Ask about your document... (Ctrl+Enter or Shift+Enter to send)"
}) => {
  const [message, setMessage] = useState('');
  
  // Handle keyboard shortcuts
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Send message only on Ctrl+Enter or Shift+Enter
    if (e.key === 'Enter' && (e.ctrlKey || e.shiftKey)) {
      e.preventDefault(); // Prevent new line
      handleSendMessage();
    }
    // Regular Enter should just add a new line (default textarea behavior)
  };
  
  // Handle send button click
  const handleSendMessage = () => {
    if (message.trim() && !isLoading && !isDisabled) {
      onSendMessage(message);
      setMessage('');
    }
  };
  
  return (
    <div className="flex gap-2 mt-auto p-0.5 pb-1.5">
      <Textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="flex-1 min-h-[60px] max-h-[240px] resize-none overflow-y-auto"
        style={{
          height: 'auto',
          overflowY: message.split('\n').length > 10 ? 'scroll' : 'hidden'
        }}
        rows={Math.min(message.split('\n').length || 1, 10)}
        disabled={isLoading || isDisabled}
      />
      <Button 
        onClick={handleSendMessage} 
        type="submit" 
        className="h-auto self-end mb-1" 
        disabled={isLoading || isDisabled || !message.trim()}
      >
        <Send className="h-4 w-4" />
      </Button>
    </div>
  );
}; 