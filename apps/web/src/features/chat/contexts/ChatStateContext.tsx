import React, { createContext, useState, useContext, useRef, useEffect } from "react";
import { OneChatRef } from "@/features/oneChat/OneChat.js";
import { messageSubscriptionService } from "@/lib/services.js";

type ChatViewMode = "capture" | "coach" | "studio";

interface ChatStateContextType {
  isOpen: boolean;
  viewMode: ChatViewMode;
  hasAvailableMessages: boolean;
  oneChatRef: React.RefObject<OneChatRef>;
  openChat: (mode?: ChatViewMode) => void;
  closeChat: () => void;
  sendMessage: (message: string) => void;
}

const ChatStateContext = createContext<ChatStateContextType | undefined>(undefined);

export function ChatStateProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ChatViewMode>("coach");
  const [hasAvailableMessages, setHasAvailableMessages] = useState(false);
  const oneChatRef = useRef<OneChatRef>(null);

  // Check for available messages whenever chat is open
  useEffect(() => {
    if (!isOpen || !oneChatRef.current) return;
    
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
      console.log('ChatState: Message updated:', updatedMessage.id, 'inhistory_id:', updatedMessage.inhistory_id);
      // When a message is updated (including inhistory_id changes), recheck available messages
      checkAvailableMessages();
    });
    
    // Initial check
    checkAvailableMessages();
    
    // Set up interval to check periodically (as a backup)
    const intervalId = setInterval(checkAvailableMessages, 5000);
    
    // Clean up subscription when component unmounts or when chat interface is hidden
    return () => {
      messageUpdateHandler();
      clearInterval(intervalId);
    };
  }, [isOpen]);

  // Add effect to prevent body scrolling when chat interface is visible
  useEffect(() => {
    if (isOpen) {
      // Save the current overflow style
      const originalOverflow = document.body.style.overflow;
      // Prevent scrolling on the main page
      document.body.style.overflow = 'hidden';
      
      // Clean up function - restore original overflow when component unmounts or modal closes
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
    // No cleanup needed if modal isn't showing
    return undefined;
  }, [isOpen]);

  const openChat = (mode?: ChatViewMode) => {
    if (mode) {
      setViewMode(mode);
    }
    setIsOpen(true);
  };

  const closeChat = () => {
    setIsOpen(false);
  };

  const sendMessage = (message: string) => {
    if (oneChatRef.current) {
      // Allow time for the interface to open
      setTimeout(() => {
        oneChatRef.current?.sendMessage(message);
      }, 300);
    }
  };

  return (
    <ChatStateContext.Provider
      value={{
        isOpen,
        viewMode,
        hasAvailableMessages,
        oneChatRef,
        openChat,
        closeChat,
        sendMessage
      }}
    >
      {children}
    </ChatStateContext.Provider>
  );
}

export function useChatState() {
  const context = useContext(ChatStateContext);
  if (context === undefined) {
    throw new Error("useChatState must be used within a ChatStateProvider");
  }
  return context;
} 