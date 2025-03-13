// WebSocket Test Client
// This is a utility script to test the WebSocket server implementation

import WebSocket from 'ws';
import { randomUUID } from 'crypto';
import readline from 'readline';

// Create readline interface for interactive testing
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Message types matching the server and shared-types
enum MessageType {
  AUTH = 'auth',
  AUTH_SUCCESS = 'auth_success',
  AUTH_ERROR = 'auth_error',
  USER_PROMPT = 'user_prompt',
  STREAMING_RESPONSE = 'streaming_response',
  AI_RESPONSE = 'ai_response',
  AI_EDIT_PROPOSAL = 'ai_edit_proposal',
  ERROR = 'error',
  CONNECTION_STATUS = 'connection_status',
  ECHO = 'echo',
  ECHO_RESPONSE = 'echo_response'
}

// Connection status tracking
enum ConnectionStatus {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  AUTHENTICATED = 'authenticated',
  DISCONNECTED = 'disconnected',
  ERROR = 'error'
}

class TestClient {
  private ws: WebSocket;
  private sessionId?: string;
  private status: ConnectionStatus = ConnectionStatus.CONNECTING;
  private token?: string;
  private messageCounter: number = 0;
  private streamingResponse: string = '';
  
  constructor(serverUrl: string, token?: string) {
    this.token = token;
    this.ws = new WebSocket(serverUrl);
    this.setupEventHandlers();
    
    console.log(`Connecting to WebSocket server at: ${serverUrl}`);
  }
  
  private setupEventHandlers() {
    this.ws.on('open', () => {
      this.status = ConnectionStatus.CONNECTED;
      console.log('✅ Connected to server');
      
      if (this.token) {
        this.authenticate(this.token);
      } else {
        console.log('No token provided. Use authenticate <token> to authenticate');
        this.startCommandLoop();
      }
    });
    
    this.ws.on('message', (data: WebSocket.Data) => {
      try {
        const message = JSON.parse(data.toString());
        this.messageCounter++;
        this.handleMessage(message);
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    });
    
    this.ws.on('close', () => {
      this.status = ConnectionStatus.DISCONNECTED;
      console.log('❌ Connection closed');
      process.exit(0);
    });
    
    this.ws.on('error', (error) => {
      this.status = ConnectionStatus.ERROR;
      console.error('⚠️ WebSocket error:', error);
      process.exit(1);
    });
  }
  
  private handleMessage(message: any) {
    console.log(`\nReceived [${message.type}]:`, message);
    
    switch (message.type) {
      case MessageType.AUTH_SUCCESS:
        this.status = ConnectionStatus.AUTHENTICATED;
        this.sessionId = message.sessionId;
        console.log(`\n✅ Authenticated with session ID: ${this.sessionId}`);
        break;
        
      case MessageType.AUTH_ERROR:
        console.log('\n❌ Authentication failed:', message.content);
        break;
        
      case MessageType.CONNECTION_STATUS:
        console.log('\nConnection status:', message.content);
        break;
        
      case 'connection_established':
        // The server assigns a session ID on connection before authentication
        if (message.sessionId) {
          this.sessionId = message.sessionId;
          console.log(`\n🔌 Connection established with temporary session ID: ${this.sessionId}`);
        }
        break;
        
      case MessageType.STREAMING_RESPONSE:
        // Accumulate streaming response chunks
        this.streamingResponse += message.content;
        process.stdout.write(message.isComplete ? `\n✅ Response complete: ${message.content}\n` : `.`);
        if (message.isComplete) {
          console.log(`\nFull response: ${this.streamingResponse}`);
          this.streamingResponse = '';
        }
        break;
        
      case MessageType.ECHO_RESPONSE:
        console.log(`\n🔄 Echo response: ${message.content}`);
        break;
        
      case MessageType.ERROR:
        console.log(`\n❌ Error: ${message.error || message.content}`);
        break;
    }
    
    // Show prompt after processing message
    this.showPrompt();
  }
  
  private startCommandLoop() {
    this.showPrompt();
    
    rl.on('line', (input) => {
      this.processCommand(input.trim());
    });
  }
  
  private showPrompt() {
    const statusEmoji = this.status === ConnectionStatus.AUTHENTICATED ? '🟢' : 
                        this.status === ConnectionStatus.CONNECTED ? '🟡' : 
                        this.status === ConnectionStatus.ERROR ? '🔴' : '⚪';
                        
    const statusText = this.status === ConnectionStatus.AUTHENTICATED 
      ? `Authenticated: ${this.sessionId}` 
      : this.status;
      
    process.stdout.write(`\n${statusEmoji} [${statusText}] > `);
  }
  
  /**
   * Process a command as if it was entered by the user
   */
  public executeCommand(command: string) {
    this.processCommand(command);
  }
  
  /**
   * Run the automated test sequence
   */
  public runTests() {
    setTimeout(() => {
      this.runTestSequence();
    }, 1000);
  }
  
  private processCommand(input: string) {
    const [command, ...args] = input.split(' ');
    
    switch (command.toLowerCase()) {
      case 'authenticate':
      case 'auth':
        if (args.length === 0) {
          console.log('Usage: authenticate <token>');
        } else {
          this.authenticate(args.join(' '));
        }
        break;
        
      case 'prompt':
        if (args.length === 0) {
          console.log('Usage: prompt <text>');
        } else {
          this.sendPrompt(args.join(' '));
        }
        break;
        
      case 'echo':
        if (args.length === 0) {
          console.log('Usage: echo <text>');
        } else {
          this.sendEcho(args.join(' '));
        }
        break;
        
      case 'status':
        this.showStatus();
        break;
        
      case 'autotest':
        this.runTestSequence();
        break;
        
      case 'exit':
      case 'quit':
        console.log('Disconnecting...');
        this.ws.close();
        process.exit(0);
        break;
        
      case 'help':
        this.showHelp();
        break;
        
      default:
        console.log('Unknown command. Type "help" for available commands.');
    }
    
    this.showPrompt();
  }
  
  private authenticate(token: string) {
    const message = {
      type: MessageType.AUTH,
      messageId: randomUUID(),
      token
    };
    
    this.send(message);
    console.log('Authenticating...');
  }
  
  private sendPrompt(text: string) {
    if (this.status !== ConnectionStatus.AUTHENTICATED) {
      console.log('❌ You must authenticate first');
      return;
    }
    
    const message = {
      type: MessageType.USER_PROMPT,
      messageId: randomUUID(),
      sessionId: this.sessionId,
      content: text
    };
    
    this.send(message);
    console.log('📤 Sending prompt...');
  }
  
  private sendEcho(text: string) {
    const message = {
      type: MessageType.ECHO,
      messageId: randomUUID(),
      sessionId: this.sessionId,
      payload: text
    };
    
    this.send(message);
    console.log('📤 Sending echo...');
  }
  
  private send(message: any) {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.log('❌ Connection not open. Cannot send message.');
    }
  }
  
  private showStatus() {
    console.log('\n📊 Connection Statistics:');
    console.log(`Status: ${this.status}`);
    console.log(`Session ID: ${this.sessionId || 'None'}`);
    console.log(`Messages Received: ${this.messageCounter}`);
    console.log(`WebSocket State: ${this.getReadyStateString()}`);
  }
  
  private getReadyStateString(): string {
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING: return 'CONNECTING';
      case WebSocket.OPEN: return 'OPEN';
      case WebSocket.CLOSING: return 'CLOSING';
      case WebSocket.CLOSED: return 'CLOSED';
      default: return 'UNKNOWN';
    }
  }
  
  private runTestSequence() {
    console.log('\n🧪 Running test sequence...');
    
    // Step 1: Send an echo message (works without authentication)
    setTimeout(() => {
      console.log('\n🧪 Test 1: Echo message test');
      this.sendEcho('test echo message');
    }, 500);
    
    // Step 2: Try to send a prompt without authentication (should fail)
    setTimeout(() => {
      console.log('\n🧪 Test 2: Unauthenticated prompt test (should fail)');
      if (this.status !== ConnectionStatus.AUTHENTICATED) {
        this.sendPrompt('This should fail without auth');
      } else {
        console.log('Already authenticated, skipping this test');
      }
    }, 2000);
    
    // Step 3: If we have a token, try to authenticate
    setTimeout(() => {
      if (this.token && this.status !== ConnectionStatus.AUTHENTICATED) {
        console.log('\n🧪 Test 3: Authentication test');
        this.authenticate(this.token);
      } else if (this.status === ConnectionStatus.AUTHENTICATED) {
        console.log('\n🧪 Test 3: Already authenticated');
      } else {
        console.log('\n🧪 Test 3: Authentication test skipped (no token)');
      }
    }, 3500);
    
    // Step 4: If we're authenticated, send a prompt
    setTimeout(() => {
      console.log('\n🧪 Test 4: Authenticated prompt test');
      if (this.status === ConnectionStatus.AUTHENTICATED) {
        this.sendPrompt('Test prompt after authentication');
      } else {
        console.log('Not authenticated, skipping this test');
      }
    }, 5000);
  }
  
  private showHelp() {
    console.log('\n📖 Available commands:');
    console.log('  authenticate <token> - Authenticate with the server');
    console.log('  prompt <text>        - Send a prompt to the AI');
    console.log('  echo <text>          - Send an echo message (for testing)');
    console.log('  status               - Show connection status and statistics');
    console.log('  autotest             - Run a test sequence automatically');
    console.log('  help                 - Show this help message');
    console.log('  exit                 - Disconnect and exit');
  }
}

// Main function
function main() {
  const args = process.argv.slice(2);
  let serverUrl = 'ws://localhost:3001';
  let token: string | undefined;
  let runTest = false;
  
  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--server' || args[i] === '-s') {
      if (i + 1 < args.length) {
        serverUrl = args[i + 1];
        i++;
      }
    } else if (args[i] === '--token' || args[i] === '-t') {
      if (i + 1 < args.length) {
        token = args[i + 1];
        i++;
      }
    } else if (args[i] === '--test') {
      runTest = true;
    }
  }
  
  console.log(`🔌 Connecting to ${serverUrl}...`);
  const client = new TestClient(serverUrl, token);
  
  // Run test sequence automatically if requested
  if (runTest) {
    client.runTests();
  }
}

if (require.main === module) {
  main();
}

export { TestClient };
