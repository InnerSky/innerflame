// WebSocket server implementation for the AI service
import WebSocket from 'ws';
import http from 'http';
import { randomUUID } from 'crypto';
import { 
  UserPromptMessage,
  StreamingResponseMessage,
  BaseMessage
} from '@innerflame/shared-types';
import { processUserPrompt } from '../agents/promptProcessor';
import { verifyToken, extractTokenFromRequest } from '../utils/authUtils';
import { SessionManager, Session } from '../utils/sessionManager';

// Extended WebSocket for connection management
interface ExtendedWebSocket extends WebSocket {
  isAlive: boolean;
}

// Message types for basic implementation
const MessageType = {
  AUTH: 'auth',
  AUTH_SUCCESS: 'auth_success',
  AUTH_ERROR: 'auth_error',
  USER_PROMPT: 'user_prompt',
  STREAMING_RESPONSE: 'streaming_response',
  ERROR: 'error',
  CONNECTION_STATUS: 'connection_status',
  ECHO: 'echo',
  ECHO_RESPONSE: 'echo_response'
};

// WebSocket connection representation
interface WebSocketConnection {
  ws: ExtendedWebSocket;
  sessionId?: string;
  userId?: string;
  isAuthenticated: boolean;
}

export class AIWebSocketServer {
  private server: http.Server;
  private wss: WebSocket.Server;
  private connections: Map<ExtendedWebSocket, WebSocketConnection> = new Map();
  private sessionManager: SessionManager = new SessionManager();
  
  constructor(port: number) {
    // Create HTTP server
    this.server = http.createServer();
    
    // Create WebSocket server on top of HTTP server
    this.wss = new WebSocket.Server({ 
      server: this.server,
      // Attempt authentication on connection
      verifyClient: async (info, callback) => {
        try {
          // Extract token from request
          const token = extractTokenFromRequest(info.req);
          
          // No token, allow connection but client will need to authenticate later
          if (!token) {
            callback(true);
            return;
          }
          
          // Verify token - we don't need the result here as we'll authenticate again after connection
          await verifyToken(token);
          
          // Allow connection regardless, but we'll track authentication status
          callback(true);
        } catch (error) {
          console.error('Error during connection verification:', error);
          callback(true); // Still allow connection, but will be unauthenticated
        }
      }
    });
    
    // Start server on specified port
    this.server.listen(port, () => {
      console.log(`AI WebSocket server started on port ${port}`);
    });
    
    this.setupConnectionHandler();
    this.setupHeartbeat();
    this.setupSessionCleanup();
  }
  
  private setupConnectionHandler() {
    this.wss.on('connection', (ws: ExtendedWebSocket, request: http.IncomingMessage) => {
      // Create connection entry
      const connection: WebSocketConnection = {
        ws,
        isAuthenticated: false
      };
      
      this.connections.set(ws, connection);
      
      console.log(`New WebSocket connection`);
      
      // Add a ping-pong mechanism to detect actual disconnections
      ws.isAlive = true;
      ws.on('pong', () => {
        ws.isAlive = true;
      });
      
      // Try to authenticate with token from request
      const token = extractTokenFromRequest(request);
      if (token) {
        this.authenticateConnection(ws, token);
      } else {
        // Send a message indicating authentication is required
        this.sendMessage(ws, {
          type: MessageType.CONNECTION_STATUS,
          messageId: randomUUID(),
          content: 'Connected but not authenticated. Please authenticate.'
        } as BaseMessage);
      }
      
      // Handle incoming messages
      ws.on('message', async (data: WebSocket.Data) => {
        try {
          const message = JSON.parse(data.toString());
          await this.processMessage(ws, message);
        } catch (error) {
          console.error('Error processing message:', error);
          this.sendMessage(ws, {
            type: MessageType.ERROR,
            messageId: randomUUID(),
            content: `Error processing message: ${error instanceof Error ? error.message : 'Unknown error'}`
          } as BaseMessage);
        }
      });
      
      // Handle disconnection
      ws.on('close', async (code: number, reason: string) => {
        const connection = this.connections.get(ws);
        if (connection && connection.sessionId) {
          console.log(`WebSocket disconnected: ${connection.sessionId}, Code: ${code}, Reason: ${reason || 'No reason provided'}`);
          await this.sessionManager.deactivateSession(connection.sessionId);
        } else {
          console.log(`Unauthenticated WebSocket disconnected, Code: ${code}, Reason: ${reason || 'No reason provided'}`);
        }
        
        // Remove from connections map
        this.connections.delete(ws);
      });
      
      // Handle errors
      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
    });
  }
  
  private setupHeartbeat() {
    // Send regular pings to detect dead connections
    const interval = setInterval(() => {
      this.wss.clients.forEach((ws) => {
        const extWs = ws as ExtendedWebSocket;
        if (extWs.isAlive === false) {
          // If we haven't received a pong since our last ping,
          // close the connection with a clean closure code
          extWs.terminate();
          return;
        }
        
        // Mark as not alive until we get a pong back
        extWs.isAlive = false;
        
        // Send ping
        try {
          extWs.ping(() => {});
        } catch (e) {
          // Handle ping error
          console.error('Error sending ping:', e);
        }
      });
    }, 30000); // Check connections every 30 seconds
    
    // Clear interval on server shutdown
    this.wss.on('close', () => {
      clearInterval(interval);
    });
  }
  
  private setupSessionCleanup() {
    // Clean up inactive sessions every hour
    const HOUR_IN_MS = 60 * 60 * 1000;
    setInterval(async () => {
      const removedCount = await this.sessionManager.cleanupOldSessions(24 * HOUR_IN_MS);
      if (removedCount > 0) {
        console.log(`Cleaned up ${removedCount} inactive sessions`);
      }
    }, HOUR_IN_MS);
  }
  
  private async authenticateConnection(ws: ExtendedWebSocket, token: string) {
    try {
      // Verify the token
      const authResult = await verifyToken(token);
      
      if (!authResult.isAuthenticated || !authResult.userId) {
        this.sendMessage(ws, {
          type: MessageType.AUTH_ERROR,
          messageId: randomUUID(),
          content: authResult.error || 'Authentication failed'
        } as BaseMessage);
        return;
      }
      
      // Get connection
      const connection = this.connections.get(ws);
      if (!connection) {
        return;
      }
      
      // Update connection with auth info
      connection.isAuthenticated = true;
      connection.userId = authResult.userId;
      
      // Check for existing sessions for this user
      const userSessions = await this.sessionManager.getUserSessions(authResult.userId);
      let session: Session;
      
      if (userSessions.length > 0) {
        // Reuse most recent active session
        const mostRecentSession = userSessions
          .sort((a: Session, b: Session) => b.lastActivity.getTime() - a.lastActivity.getTime())[0];
        
        const reactivated = await this.sessionManager.reactivateSession(mostRecentSession.sessionId);
        if (reactivated) {
          session = mostRecentSession;
        } else {
          // If reactivation fails, create new session
          session = await this.sessionManager.createSession(authResult.userId);
        }
      } else {
        // Create new session
        session = await this.sessionManager.createSession(authResult.userId);
      }
      
      // Update connection with session ID
      connection.sessionId = session.sessionId;
      
      // Send success message
      this.sendMessage(ws, {
        type: MessageType.AUTH_SUCCESS,
        messageId: randomUUID(),
        sessionId: session.sessionId,
        content: 'Authentication successful'
      } as BaseMessage);
      
      console.log(`User ${authResult.userId} authenticated with session ${session.sessionId}`);
    } catch (error) {
      console.error('Authentication error:', error);
      this.sendMessage(ws, {
        type: MessageType.AUTH_ERROR,
        messageId: randomUUID(),
        content: `Authentication error: ${error instanceof Error ? error.message : 'Unknown error'}`
      } as BaseMessage);
    }
  }
  
  private async processMessage(ws: ExtendedWebSocket, message: any) {
    const connection = this.connections.get(ws);
    if (!connection) {
      return;
    }
    
    // Handle authentication message even if not authenticated
    if (message.type === MessageType.AUTH) {
      await this.authenticateConnection(ws, message.token);
      return;
    }
    
    // Echo message for testing purposes
    if (message.type === MessageType.ECHO) {
      this.sendMessage(ws, {
        type: MessageType.ECHO_RESPONSE,
        messageId: randomUUID(),
        sessionId: connection.sessionId,
        content: message.payload
      });
      return;
    }
    
    // All other messages require authentication
    if (!connection.isAuthenticated) {
      this.sendMessage(ws, {
        type: MessageType.AUTH_ERROR,
        messageId: randomUUID(),
        content: 'Authentication required'
      } as BaseMessage);
      return;
    }
    
    // Validate session ID if provided in message
    if (message.sessionId && connection.sessionId !== message.sessionId) {
      this.sendMessage(ws, {
        type: MessageType.ERROR,
        messageId: randomUUID(),
        sessionId: connection.sessionId,
        content: 'Session ID mismatch'
      } as BaseMessage);
      return;
    }
    
    switch (message.type) {
      case MessageType.USER_PROMPT:
        await this.handleUserPrompt(ws, message as UserPromptMessage);
        break;
      default:
        console.warn(`Unknown message type: ${message.type}`);
        this.sendMessage(ws, {
          type: MessageType.ERROR,
          messageId: randomUUID(),
          sessionId: connection.sessionId,
          content: `Unsupported message type: ${message.type}`
        } as BaseMessage);
    }
  }
  
  private async handleUserPrompt(ws: ExtendedWebSocket, message: UserPromptMessage) {
    const connection = this.connections.get(ws);
    if (!connection || !connection.sessionId) {
      return;
    }
    
    try {
      // Process the prompt and stream results back to client
      const responseId = randomUUID();
      
      // Add message to session history
      if (connection.sessionId) {
        await this.sessionManager.addMessage(connection.sessionId, message);
      }
      
      // Start streaming response
      this.sendMessage(ws, {
        type: MessageType.STREAMING_RESPONSE,
        sessionId: connection.sessionId,
        messageId: responseId,
        content: 'Processing your request...',
        isComplete: false
      } as StreamingResponseMessage);
      
      // Process the user prompt
      await processUserPrompt(message.content, (chunk: string, isComplete: boolean) => {
        // Send each chunk as it's generated
        this.sendMessage(ws, {
          type: MessageType.STREAMING_RESPONSE,
          sessionId: connection.sessionId,
          messageId: responseId,
          content: chunk,
          isComplete
        } as StreamingResponseMessage);
      });
      
    } catch (error) {
      console.error('Error processing user prompt:', error);
      this.sendMessage(ws, {
        type: MessageType.ERROR,
        sessionId: connection.sessionId,
        messageId: randomUUID(),
        content: `Error processing your prompt: ${error instanceof Error ? error.message : 'Unknown error'}`
      } as BaseMessage);
    }
  }
  
  private sendMessage(ws: ExtendedWebSocket, message: any) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }
  
  public shutdown() {
    console.log('Shutting down WebSocket server');
    this.wss.close();
    this.server.close();
  }
}
