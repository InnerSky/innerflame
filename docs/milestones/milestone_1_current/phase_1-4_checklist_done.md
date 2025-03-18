# Phase 1-4: Context-Aware Messaging in Document Interface

## Objective
Enhance the Chat Interface to create and display messages with the appropriate context (document or project) based on what's currently selected. This creates a universal interface that dynamically loads messages with the correct context and sends new messages with context metadata.

## Checklist

### Review and Understanding
- [x] 1. Review the current ChatInterface implementation and message handling
- [x] 2. Examine Supabase schema for messages table and understand the structure
- [x] 3. Understand the current DocumentsContext and how context information is managed
- [x] 4. Review any existing message services or related utilities

### Message Model and Type Implementation
- [x] 5. Create a Message model with proper types based on Supabase schema
- [x] 6. Define MessageContextType enum ('none', 'project', 'document')
- [x] 7. Implement helper functions to determine current context type and ID

### Message Service Implementation
- [x] 8. Create a MessageService for handling message operations
- [x] 9. Implement loadMessages method to fetch messages by context type and ID
- [x] 10. Implement createMessage method that includes context information
- [x] 11. Create helper methods for message transformation and organization

### ChatInterface Enhancement
- [x] 12. Modify ChatInterface to use MessageService
- [x] 13. Update the message state management to handle real messages
- [x] 14. Enhance the sendMessage function to determine and include context
- [x] 15. Update the UI to display context information clearly
- [x] 16. Implement loading states for message operations

### Testing and Refinement
- [x] 17. Test message creation with different contexts (none, project, document)
- [x] 18. Test message loading with context filtering
- [x] 19. Ensure proper error handling and user feedback
- [x] 20. Optimize performance for message loading and display

## Expected Outcomes
- ✅ Context-aware messaging that tracks what document or project a message relates to
- ✅ Improved organization of messages by context
- ✅ Consistent message structure that follows database schema
- ✅ Better user experience with clear context indicators
- ✅ Foundation for implementing more advanced chat features

## Progress Notes
- Reviewed current ChatInterface component which already displays project and document names at the top. It currently uses local state (useState) for message management and has a mock response system. The component also has appropriate styling for both standalone and card-based usage, with clear message bubbles for user and assistant messages.

- Examined the Supabase messages table schema which already has the structure we need:
  - `content`: The message text content
  - `context_id`: ID of the related context (document or project)
  - `context_type`: Type of context ('document', 'project', etc.)
  - `user_id`: The user who sent the message
  - `sender_type`: Type of sender (user, assistant, etc.)
  - `created_at`: Timestamp when the message was created
  - Other fields for embedding, threading, and AI features

- Reviewed the DocumentsContext which provides all the necessary information for determining message context:
  - `selectedDocument`: Currently selected document (if any)
  - `selectedProjectId`: Currently selected project ID (if any) 
  - Context management functions like `selectDocument` and `selectProject`
  - The context also provides access to document content, which will be useful for AI-powered responses

- No existing message services were found in the codebase. We'll need to implement a new service to handle message operations with the Supabase API. This will include methods for creating, loading, and managing messages with appropriate context information.

- Created a Message model in `message.ts` with proper TypeScript types based on the Supabase schema:
  - Defined `MessageContextType` enum with 'none', 'project', and 'document' options
  - Defined `MessageSenderType` enum with 'user', 'assistant', and 'system' options
  - Created the core `Message` interface extending the Supabase tables type
  - Added helper functions for mapping database rows to domain models
  - Implemented `determineMessageContext` function to detect current context

- Created a MessageService in `messageService.ts` with the following capabilities:
  - `loadMessages`: Generic method for loading messages with flexible filtering options
  - `createMessage`: Method for creating new messages with appropriate context information
  - Helper methods for common use cases:
    - `getDocumentMessages`: Load messages for a specific document
    - `getProjectMessages`: Load messages for a specific project
    - `getGeneralMessages`: Load messages with no specific context
  - Proper error handling and database row mapping to domain models

- Updated the ChatInterface component to be fully context-aware:
  - Implemented useEffect to load messages based on the current context
  - Enhanced the sendMessage function to determine and include context information
  - Added loading states for both initial loading and message sending
  - Updated the UI to display context information clearly with @project and @document tags
  - Added proper error handling and user feedback
  - Optimized performance by only re-fetching messages when context changes

- Created a useAuth hook to provide authenticated user information to the chat interface

## Next Steps
This implementation has created a robust foundation for context-aware messaging in the document interface. Future enhancements could include:

1. Adding message threading capabilities
2. Implementing AI-powered responses with access to the document content
3. Supporting message reactions or categorization
4. Integrating with document version history
5. Adding real-time updates using Supabase subscriptions 