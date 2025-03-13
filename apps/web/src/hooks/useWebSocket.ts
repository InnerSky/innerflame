// WebSocket hook for AI service integration
import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { 
  BaseMessage, 
  UserPromptMessage, 
  StreamingResponseMessage,
  ConnectionStatus,
  MessageType,
  AuthSuccessMessage,
  AuthErrorMessage,
  ErrorMessage
} from '@innerflame/shared-types';

interface WebSocketState {
  status: ConnectionStatus;
  sessionId?: string;
  error?: string;
  messages: BaseMessage[];
}

interface WebSocketOptions {
  url: string;
  autoConnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  supabaseUrl: string;
  supabaseAnonKey: string;
}

/**
 * Hook for WebSocket communication with the AI service
 * @param options WebSocket connection options
 * @returns WebSocket state and methods
 */
export function useWebSocket(options: WebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const supabaseRef = useRef<SupabaseClient | null>(null);
  
  const [state, setState] = useState<WebSocketState>({
    status: ConnectionStatus.DISCONNECTED,
    messages: []
  });
  
  // Initialize Supabase client
  useEffect(() => {
    if (!supabaseRef.current) {
      supabaseRef.current = createClient(
        options.supabaseUrl,
        options.supabaseAnonKey
      );
    }
    
    // Set up auth state change listener
    const { data: { subscription } } = supabaseRef.current.auth.onAuthStateChange(
      async (event) => {
        if (event === 'SIGNED_IN') {
          // Try to authenticate WebSocket if it's already open
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            await authenticate();
          }
        } else if (event === 'SIGNED_OUT') {
          // Handle sign out - disconnect WebSocket
          disconnect();
          
          // Reconnect as unauthenticated if autoConnect is enabled
          if (options.autoConnect !== false) {
            connect();
          }
        }
      }
    );
    
    return () => {
      subscription.unsubscribe();
    };
  }, [options.supabaseUrl, options.supabaseAnonKey]);
  
  // Connect to WebSocket
  const connect = useCallback(async () => {
    // If we're already connecting or connected, don't try to connect again
    if (wsRef.current && 
        (wsRef.current.readyState === WebSocket.CONNECTING || 
         wsRef.current.readyState === WebSocket.OPEN)) {
      console.log('WebSocket already connecting or connected, skipping connection attempt');
      return;
    }
    
    // Close existing connection if any
    if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) {
      wsRef.current.close();
    }
    
    setState(prev => ({ ...prev, status: ConnectionStatus.CONNECTING }));
    
    try {
      const ws = new WebSocket(options.url);
      wsRef.current = ws;
      
      ws.onopen = async () => {
        console.log('WebSocket connected');
        setState(prev => ({ ...prev, status: ConnectionStatus.CONNECTED }));
        reconnectAttemptsRef.current = 0;
        
        // Try to authenticate immediately if we have a session
        const { data } = await supabaseRef.current?.auth.getSession() || { data: null };
        if (data?.session) {
          await authenticate();
        }
      };
      
      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as BaseMessage;
          handleMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      ws.onclose = (event) => {
        console.log('WebSocket connection closed:', event.code, event.reason);
        setState(prev => ({ 
          ...prev, 
          status: ConnectionStatus.DISCONNECTED,
          sessionId: undefined
        }));
        
        // Only attempt reconnect for abnormal closures or if server was restarted
        // Don't reconnect for normal closures (1000) or if we initiated the close (1001)
        const shouldReconnect = 
          (event.code !== 1000 && event.code !== 1001) || 
          event.reason === 'server_restart';
          
        if (shouldReconnect && options.autoConnect !== false) {
          // Add small random delay to prevent immediate reconnection storm
          const jitter = Math.random() * 1000; // Random delay up to 1 second
          setTimeout(() => attemptReconnect(), jitter);
        }
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setState(prev => ({ 
          ...prev, 
          status: ConnectionStatus.ERROR, 
          error: 'WebSocket connection error'
        }));
      };
      
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
      setState(prev => ({ 
        ...prev, 
        status: ConnectionStatus.ERROR, 
        error: error instanceof Error ? error.message : 'Failed to connect'
      }));
      
      if (options.autoConnect !== false) {
        attemptReconnect();
      }
    }
  }, [options.url]);
  
  // Attempt to reconnect
  const attemptReconnect = useCallback(() => {
    const maxAttempts = options.maxReconnectAttempts || 5;
    
    if (reconnectAttemptsRef.current >= maxAttempts) {
      console.log(`Maximum reconnect attempts (${maxAttempts}) reached`);
      setState(prev => ({ 
        ...prev, 
        error: `Failed to reconnect after ${maxAttempts} attempts. Please refresh the page.`
      }));
      return;
    }
    
    const interval = options.reconnectInterval || 2000;
    // Use a more conservative backoff strategy with a maximum delay cap
    const delay = Math.min(
      interval * Math.pow(1.5, reconnectAttemptsRef.current),
      30000 // Cap max delay at 30 seconds
    );
    
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${reconnectAttemptsRef.current + 1}/${maxAttempts})`);
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    reconnectTimeoutRef.current = setTimeout(() => {
      reconnectAttemptsRef.current++;
      connect();
    }, delay);
  }, [connect, options.maxReconnectAttempts, options.reconnectInterval]);
  
  // Authenticate with the server
  const authenticate = useCallback(async () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.log('Cannot authenticate - WebSocket not connected');
      return;
    }
    
    if (!supabaseRef.current) {
      console.log('Cannot authenticate - Supabase client not initialized');
      return;
    }
    
    try {
      // Get session token from Supabase
      const { data } = await supabaseRef.current.auth.getSession();
      const token = data.session?.access_token;
      
      if (!token) {
        console.log('No valid session token found');
        return;
      }
      
      // Send authentication message
      sendMessage({
        type: MessageType.AUTH,
        messageId: crypto.randomUUID(),
        token
      });
      
      console.log('Authentication message sent');
    } catch (error) {
      console.error('Error authenticating:', error);
    }
  }, []);
  
  // Handle incoming WebSocket messages
  const handleMessage = useCallback((message: BaseMessage) => {
    // Add message to state
    setState(prev => ({
      ...prev,
      messages: [...prev.messages, message]
    }));
    
    // Handle specific message types
    switch (message.type) {
      case MessageType.AUTH_SUCCESS:
        const authSuccessMsg = message as AuthSuccessMessage;
        setState(prev => ({
          ...prev,
          status: ConnectionStatus.AUTHENTICATED,
          sessionId: authSuccessMsg.sessionId
        }));
        console.log('Authenticated with session:', authSuccessMsg.sessionId);
        break;
        
      case MessageType.AUTH_ERROR:
        const authErrorMsg = message as AuthErrorMessage;
        setState(prev => ({
          ...prev,
          error: authErrorMsg.content
        }));
        console.error('Authentication error:', authErrorMsg.content);
        break;
        
      case MessageType.ERROR:
        const errorMsg = message as ErrorMessage;
        console.error('Server error:', errorMsg.content);
        break;
        
      default:
        // No specific handling for other message types
        break;
    }
  }, []);
  
  // Send a message to the WebSocket server
  const sendMessage = useCallback((message: any) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.error('Cannot send message - WebSocket not connected');
      return false;
    }
    
    try {
      wsRef.current.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  }, []);
  
  // Send a user prompt to the AI
  const sendPrompt = useCallback((content: string, entityId?: string) => {
    if (state.status !== ConnectionStatus.AUTHENTICATED) {
      console.error('Cannot send prompt - Not authenticated');
      return false;
    }
    
    return sendMessage({
      type: MessageType.USER_PROMPT,
      messageId: crypto.randomUUID(),
      sessionId: state.sessionId,
      content,
      entityId
    } as UserPromptMessage);
  }, [sendMessage, state.sessionId, state.status]);
  
  // Disconnect WebSocket
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (wsRef.current) {
      // Use code 1000 (Normal Closure) to signal intentional disconnect
      wsRef.current.close(1000, 'User initiated disconnect');
      wsRef.current = null;
    }
    
    setState(prev => ({ 
      ...prev, 
      status: ConnectionStatus.DISCONNECTED,
      sessionId: undefined 
    }));
  }, []);
  
  // Effect to auto-connect on mount if autoConnect is true
  useEffect(() => {
    if (options.autoConnect !== false) {
      connect();
    }
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect, options.autoConnect]);
  
  return {
    status: state.status,
    sessionId: state.sessionId,
    error: state.error,
    messages: state.messages,
    connect,
    disconnect,
    authenticate,
    sendMessage,
    sendPrompt,
    isAuthenticated: state.status === ConnectionStatus.AUTHENTICATED
  };
}

export default useWebSocket;
