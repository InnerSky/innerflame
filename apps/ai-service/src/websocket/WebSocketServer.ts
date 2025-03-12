// WebSocket server implementation for the AI service
import WebSocket from 'ws';
import { randomUUID } from 'crypto';
import { 
  BaseMessage,
  SessionState,
  UserPromptMessage,
  StreamingResponseMessage
} from '@innerflame/shared-types';
import { processUserPrompt } from '../agents/promptProcessor';

export class AIWebSocketServer {
  private wss: WebSocket.Server;
  private sessions: Map<string, SessionState> = new Map();
  
  constructor(port: number) {
    this.wss = new WebSocket.Server({ port });
    console.log(`AI WebSocket server started on port ${port}`);
    
    this.setupConnectionHandler();
    this.setupHeartbeat();
  }
  
  private setupConnectionHandler() {
    this.wss.on('connection', (ws: WebSocket) => {
      // Initialize a new session
      const sessionId = randomUUID();
      const userId = 'anonymous'; // Would be extracted from JWT in production
      
      // Store session info
      this.sessions.set(sessionId, {
        sessionId,
        userId,
        messageHistory: [],
        lastActivity: new Date(),
        isActive: true
      });
      
      console.log(`New WebSocket connection: ${sessionId}`);
      
      // Send welcome message
      this.sendMessage(ws, {
        type: 'connection_established',
        sessionId,
        messageId: randomUUID(),
        content: 'Connected to AI service'
      });
      
      // Handle incoming messages
      ws.on('message', async (data: WebSocket.Data) => {
        try {
          const message = JSON.parse(data.toString()) as BaseMessage;
          
          // Update session activity
          const session = this.sessions.get(sessionId);
          if (session) {
            session.lastActivity = new Date();
            session.messageHistory.push(message);
          }
          
          // Process based on message type
          await this.processMessage(ws, message, sessionId);
        } catch (error) {
          console.error('Error processing message:', error);
          this.sendMessage(ws, {
            type: 'error',
            sessionId,
            messageId: randomUUID(),
            content: `Error processing message: ${error instanceof Error ? error.message : 'Unknown error'}`
          });
        }
      });
      
      // Handle disconnection
      ws.on('close', () => {
        console.log(`WebSocket connection closed: ${sessionId}`);
        
        const session = this.sessions.get(sessionId);
        if (session) {
          session.isActive = false;
          // In production: persist session state to database
        }
      });
    });
  }
  
  private setupHeartbeat() {
    // Ping clients every 30 seconds to keep connections alive
    setInterval(() => {
      this.wss.clients.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.ping();
        }
      });
    }, 30000);
  }
  
  private async processMessage(ws: WebSocket, message: BaseMessage, sessionId: string) {
    switch (message.type) {
      case 'user_prompt':
        await this.handleUserPrompt(ws, message as UserPromptMessage, sessionId);
        break;
      default:
        console.warn(`Unknown message type: ${message.type}`);
        this.sendMessage(ws, {
          type: 'error',
          sessionId,
          messageId: randomUUID(),
          content: `Unsupported message type: ${message.type}`
        });
    }
  }
  
  private async handleUserPrompt(ws: WebSocket, message: UserPromptMessage, sessionId: string) {
    try {
      // Process the prompt and stream results back to client
      const responseId = randomUUID();
      
      // Start streaming response
      this.sendMessage(ws, {
        type: 'streaming_response',
        sessionId,
        messageId: responseId,
        content: 'Processing your request...',
        isComplete: false
      } as StreamingResponseMessage);
      
      // Simulate AI processing with processUserPrompt function
      await processUserPrompt(message.content, (chunk: string, isComplete: boolean) => {
        // Send each chunk as it's generated
        this.sendMessage(ws, {
          type: 'streaming_response',
          sessionId,
          messageId: responseId,
          content: chunk,
          isComplete
        } as StreamingResponseMessage);
      });
      
    } catch (error) {
      console.error('Error processing user prompt:', error);
      this.sendMessage(ws, {
        type: 'error',
        sessionId,
        messageId: randomUUID(),
        content: `Error processing your prompt: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  }
  
  private sendMessage(ws: WebSocket, message: any) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }
  
  public shutdown() {
    console.log('Shutting down WebSocket server');
    this.wss.close();
  }
}
