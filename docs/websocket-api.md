# WebSocket API Documentation

This document describes the WebSocket API for the InnerFlame AI service, which provides real-time AI interactions for the web application.

## Overview

The WebSocket service allows for real-time communication between the web client and the AI service, facilitating features such as:

- Authentication and session management
- Real-time streaming of AI responses
- Document-specific AI assistance
- Persistent session state across reconnections

## Connection

The WebSocket server is available at the following endpoint:

```
ws://localhost:3001
```

In production, this would be replaced with a secure WebSocket endpoint (`wss://`).

## Message Structure

All messages follow a common base structure:

```typescript
interface BaseMessage {
  type: MessageType;
  messageId: string;
  sessionId?: string;
  timestamp?: string;
}
```

The `type` field determines the specific message type, and additional fields are required depending on the message type.

## Message Types

The following message types are supported:

### Authentication

#### Client -> Server

```typescript
interface AuthMessage extends BaseMessage {
  type: MessageType.AUTH;
  token: string;
}
```

#### Server -> Client (Success)

```typescript
interface AuthSuccessMessage extends BaseMessage {
  type: MessageType.AUTH_SUCCESS;
  sessionId: string;
}
```

#### Server -> Client (Error)

```typescript
interface AuthErrorMessage extends BaseMessage {
  type: MessageType.AUTH_ERROR;
  content: string;
}
```

### User Prompts

#### Client -> Server

```typescript
interface UserPromptMessage extends BaseMessage {
  type: MessageType.USER_PROMPT;
  sessionId: string;
  content: string;
  entityId?: string; // Optional document/entity context
}
```

### AI Responses

#### Server -> Client

```typescript
interface StreamingResponseMessage extends BaseMessage {
  type: MessageType.STREAMING_RESPONSE;
  content: string;
  isComplete: boolean; // True for the final chunk of a response
}
```

### Echo (for testing)

#### Client -> Server

```typescript
interface EchoMessage extends BaseMessage {
  type: MessageType.ECHO;
  sessionId?: string;
  payload: string;
}
```

#### Server -> Client

```typescript
interface EchoResponseMessage extends BaseMessage {
  type: MessageType.ECHO_RESPONSE;
  content: string;
}
```

### Error Messages

#### Server -> Client

```typescript
interface ErrorMessage extends BaseMessage {
  type: MessageType.ERROR;
  content: string;
}
```

### Connection Status

#### Server -> Client

```typescript
interface ConnectionStatusMessage extends BaseMessage {
  type: MessageType.CONNECTION_STATUS;
  content: string;
}
```

## Session Management

The WebSocket service maintains sessions for users, which persist across reconnections. Session details:

- Each session has a unique session ID generated upon creation
- Sessions are tied to a specific user ID from authentication
- Message history is preserved within a session
- Sessions can be inactive but will be reactivated on reconnection
- Inactive sessions are cleaned up after a configurable period

## Authentication Flow

1. Connect to the WebSocket server
2. Obtain a JWT token from Supabase authentication
3. Send an `AUTH` message with the token
4. Receive an `AUTH_SUCCESS` or `AUTH_ERROR` message
5. If successful, the response includes a `sessionId` to use for subsequent messages

## Usage Example

### Client Side (React with TypeScript)

```tsx
import useWebSocket from '../hooks/useWebSocket';
import { ConnectionStatus } from '@innerflame/shared-types';

function ChatComponent() {
  const { 
    status, 
    messages, 
    sendPrompt, 
    isAuthenticated 
  } = useWebSocket({
    url: 'ws://localhost:3001',
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    autoConnect: true
  });

  const handleSendMessage = (content: string) => {
    if (isAuthenticated) {
      sendPrompt(content);
    }
  };

  return (
    <div>
      <div>Status: {status}</div>
      <div>
        {messages.map(msg => (
          <div key={msg.messageId}>{msg.content}</div>
        ))}
      </div>
      <button onClick={() => handleSendMessage('Hello AI!')}>
        Send Message
      </button>
    </div>
  );
}
```

## Testing

A test client is available in the AI service codebase:

```bash
# Run the test client
cd apps/ai-service
npm run test:client -- --token <SUPABASE_JWT_TOKEN>

# Run automated tests
npm run test:client -- --token <SUPABASE_JWT_TOKEN> --test
```

## Error Handling

Common error scenarios and their corresponding messages:

| Scenario | Message Type | Content |
|----------|--------------|---------|
| Invalid authentication token | `AUTH_ERROR` | "Invalid token" |
| Expired token | `AUTH_ERROR` | "Token expired" |
| Unauthenticated request | `ERROR` | "Not authenticated" |
| Invalid session ID | `ERROR` | "Invalid session ID" |
| Server error | `ERROR` | Error details |

## Notes for Frontend Developers

When integrating with the WebSocket API:

1. Always handle connection status changes appropriately in the UI
2. Keep the connection alive with reconnection logic
3. Handle streaming responses by accumulating content chunks
4. Provide appropriate UX for authentication failures
5. Include entity context (e.g., document ID) when relevant to the AI's response

The provided `useWebSocket` hook in the web app handles most of these concerns automatically.
