# Phase 2-2 Server-Side Message Persistence Checklist

## Overview
Currently, assistant messages are saved to Supabase from the frontend after streaming completes. This creates a vulnerability where messages are lost if the user closes their browser or loses connectivity during streaming. This checklist outlines the tasks to implement server-side persistence for assistant messages.

## Tasks

### Understanding the Current Implementation
- [x] Review `useChatInterface.ts` to understand the current frontend message handling flow
  - Currently, the assistant message is saved in the `onComplete` callback in the frontend
  - This happens after the streaming is completed
- [x] Review `sseClient.ts` to understand how streaming is currently set up
  - The frontend creates an SSE connection to the backend
  - The backend streams tokens as they're generated
  - The backend sends a final 'complete' event with the full response
- [x] Review backend streaming handlers in `apps/api/src/routes/ai.ts` and `streamingAgent` implementation
  - The `handleStreamRequest` function processes the request and calls the streaming agent
  - The streaming agent generates the response and streams it via SSE
  - The `sendComplete` function is called when streaming is done
- [x] Review how messages are currently stored in Supabase via `MessageService`
  - Messages are stored in the `messages` table in Supabase
  - The `MessageService` is only implemented in the frontend

### Backend Implementation
- [x] Create a new server-side message service for saving assistant messages to Supabase
  - Created `MessageService` in `apps/api/src/services/message/messageService.ts`
  - Implemented `createMessage` method similar to the frontend service
- [x] Modify the `sendComplete` function to save the complete message when streaming is finished
  - Updated `sendComplete` in `apps/api/src/controllers/sse.ts` to save messages
  - Added message ID to the completion event data
- [x] Add proper error handling for message persistence failures
  - Added try/catch blocks in `sendComplete`
  - Added error information to the completion event data
- [x] Ensure user context and metadata are properly passed from the streaming request to the message creation
  - Updated `streamingAgent` to accept the request object
  - Updated `handleStreamRequest` to pass the request object to the agent

### Frontend Implementation 
- [x] Remove the message creation logic from the `onComplete` callback in `useChatInterface.ts`
  - Moved message creation to a fallback function
  - Only called if server-side creation fails
- [x] Update the frontend to handle receiving the saved message ID from the server
  - Added check for `messageId` in the completion event
  - Added code to handle the message based on server response
- [x] Update the chat interface to properly update the UI with the saved message
  - Added code to fetch the complete message from the server
  - Updated chat history with the received message
- [x] Add fallback error handling if the message wasn't saved server-side
  - Added fallback to client-side message creation
  - Added error reporting to the user

### Documentation
- [x] Document the new server-side persistence flow
  - Updated comments in the code to explain the flow
  - Described the fallback mechanism
- [x] Update any relevant comments in the code
  - Added explanatory comments to all modified functions
  - Added parameter documentation

## Completion Criteria
- [x] The assistant message is saved to Supabase from the server-side when streaming completes
- [x] The frontend properly updates the UI with the persisted message
- [x] If a user closes their browser during streaming, the message is still saved to Supabase 