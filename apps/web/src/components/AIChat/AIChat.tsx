import React, { useState, useEffect, useRef } from 'react';
import useWebSocket from '../../hooks/useWebSocket';
import { 
  ConnectionStatus, 
  MessageType, 
  BaseMessage, 
  StreamingResponseMessage,
  UserPromptMessage 
} from '@innerflame/shared-types';

// Component props
interface AIChatProps {
  supabaseUrl: string;
  supabaseAnonKey: string;
  websocketUrl: string;
  entityId?: string;
}

/**
 * AI Chat Component
 * 
 * Provides a real-time chat interface with the AI service using WebSockets
 */
const AIChat: React.FC<AIChatProps> = ({ 
  supabaseUrl, 
  supabaseAnonKey, 
  websocketUrl,
  entityId
}) => {
  // State for the input message
  const [input, setInput] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [currentResponse, setCurrentResponse] = useState<string>('');
  
  // Reference to the chat container
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  // Connect to the WebSocket service
  const { 
    status,
    error,
    messages,
    sendPrompt,
    connect,
    disconnect,
    isAuthenticated
  } = useWebSocket({
    url: websocketUrl,
    autoConnect: true,
    reconnectInterval: 2000,
    maxReconnectAttempts: 5,
    supabaseUrl,
    supabaseAnonKey
  });
  
  // Handle form submission to send a message
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || !isAuthenticated) return;
    
    // Send the message to the AI service
    sendPrompt(input, entityId);
    
    // Reset the input
    setInput('');
    
    // Show typing indicator
    setIsTyping(true);
    
    // Reset the current streaming response
    setCurrentResponse('');
  };
  
  // Listen for streaming response messages
  useEffect(() => {
    // Extract the latest message from the AI
    const latestMessages = messages.filter(message => 
      message.type === MessageType.STREAMING_RESPONSE
    ) as StreamingResponseMessage[];
    
    if (latestMessages.length > 0) {
      const lastMessage = latestMessages[latestMessages.length - 1];
      
      // Update the current response text
      setCurrentResponse(prev => prev + lastMessage.content);
      
      // If this is the final chunk, stop the typing indicator
      if (lastMessage.isComplete) {
        setIsTyping(false);
      }
    }
  }, [messages]);
  
  // Format user-friendly status
  const getStatusDisplay = () => {
    switch (status) {
      case ConnectionStatus.CONNECTING:
        return '🔄 Connecting...';
      case ConnectionStatus.CONNECTED:
        return '🔌 Connected (Not Authenticated)';
      case ConnectionStatus.AUTHENTICATED:
        return '✓ Connected';
      case ConnectionStatus.DISCONNECTED:
        return '❌ Disconnected';
      case ConnectionStatus.ERROR:
        return `⚠️ Error: ${error || 'Connection Error'}`;
      default:
        return 'Unknown Status';
    }
  };
  
  // Filter and display chat messages
  const displayMessages = () => {
    // Get unique user messages (USER_PROMPT type)
    const userMessages = messages.filter(msg => 
      msg.type === MessageType.USER_PROMPT
    ) as UserPromptMessage[];
    
    return (
      <>
        {userMessages.map((message, index) => (
          <div key={message.messageId} className="chat-thread">
            <div className="user-message">
              <div className="avatar">👤</div>
              <div className="message-content">{message.content}</div>
            </div>
            
            <div className="ai-message">
              <div className="avatar">🤖</div>
              <div className="message-content">
                {getAIResponseForUserMessage(index)}
              </div>
            </div>
          </div>
        ))}
        
        {/* Typing indicator for when AI is generating a response */}
        {isTyping && (
          <div className="ai-message">
            <div className="avatar">🤖</div>
            <div className="message-content typing-indicator">
              {currentResponse || '...'}
            </div>
          </div>
        )}
      </>
    );
  };
  
  // Helper function to get the AI response for a specific user message
  const getAIResponseForUserMessage = (userMessageIndex: number) => {
    // Find all streaming responses that came after this user message
    // and before the next user message
    const userMessageIds = messages
      .filter(msg => msg.type === MessageType.USER_PROMPT)
      .map(msg => msg.messageId);
    
    const currentUserMsgId = userMessageIds[userMessageIndex];
    const nextUserMsgId = userMessageIds[userMessageIndex + 1];
    
    const currentUserMsgIndex = messages.findIndex(msg => msg.messageId === currentUserMsgId);
    const nextUserMsgIndex = nextUserMsgId 
      ? messages.findIndex(msg => msg.messageId === nextUserMsgId)
      : messages.length;
    
    // Get all streaming responses between these messages
    const responsesForThisMessage = messages
      .slice(currentUserMsgIndex + 1, nextUserMsgIndex)
      .filter(msg => msg.type === MessageType.STREAMING_RESPONSE) as StreamingResponseMessage[];
    
    // Combine all response chunks
    let fullResponse = '';
    for (const chunk of responsesForThisMessage) {
      fullResponse += chunk.content;
    }
    
    return fullResponse || 'No response yet...';
  };
  
  return (
    <div ref={chatContainerRef} className="ai-chat-container">
      <div className="chat-header">
        <h2>AI Assistant</h2>
        <div className="connection-status">
          {getStatusDisplay()}
        </div>
        <div className="connection-actions">
          <button 
            onClick={connect} 
            disabled={status !== ConnectionStatus.DISCONNECTED}
            className="connect-button"
          >
            Connect
          </button>
          <button 
            onClick={disconnect} 
            disabled={status === ConnectionStatus.DISCONNECTED}
            className="disconnect-button"
          >
            Disconnect
          </button>
        </div>
      </div>
      
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="empty-chat">
            <p>No messages yet. Start a conversation with the AI assistant.</p>
          </div>
        ) : (
          displayMessages()
        )}
      </div>
      
      <form onSubmit={handleSubmit} className="chat-input-form">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          disabled={!isAuthenticated || isTyping}
          className="chat-input"
        />
        <button 
          type="submit" 
          disabled={!isAuthenticated || isTyping || !input.trim()}
          className="send-button"
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default AIChat;
