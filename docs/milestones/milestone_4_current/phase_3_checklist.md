# Phase 3 Checklist: Document Version Management for XML-based Edits

## Objective

Create a backend system that detects document edits in XML tags from AI streaming responses and automatically creates a new document version in the database. When the AI generates a document edit using the `<document_edit>` tags, the system should parse the content, create a new version in the `entity_versions` table, and update the document to use this new version.

## Core Requirements

1. Detect when streaming completes with a document edit
2. Extract edited document content from the XML tags
3. Create a new document version in the database
4. Update the document to reference the new version
5. Handle errors and edge cases gracefully

## Tasks

### Analysis & Implementation Planning

- [x] Review existing document versioning system:
  - [x] Examine how document versions are created in `DocumentRepository.saveDocument()`
  - [x] Study how versions are managed in the database (`entities` and `entity_versions` tables)
  - [x] Understand the current flow from `useChatInterface` to the backend

- [x] Identify integration points:
  - [x] Determine where in the streaming flow to detect completed document edits
  - [x] Identify how to access document context during streaming
  - [x] Evaluate where to add version creation logic

### Backend Implementation

- [x] Create a document version service in `apps/api/src/services/documents/documentVersionService.ts`:
  - [x] Implement a function to extract document content from XML tags
  - [x] Add logic to create a new version in the `entity_versions` table
  - [x] Implement status tracking for version creation

- [x] Modify SSE stream handling in `apps/api/src/controllers/sse.ts`:
  - [x] Update the `sendComplete` function to detect document edits 
  - [x] Add XML parsing logic to extract edited content
  - [x] Implement document version creation when edits are detected

- [x] Create a new document edit handler in `apps/api/src/handlers/documentEditHandler.ts`:
  - [x] Implement the `processDocumentEdit` function to handle XML content extraction
  - [x] Add function to create new document version with content from XML tags
  - [x] Add proper error handling for version creation failures

### Integration with Frontend

- [x] Update SSE streaming endpoint in `apps/api/src/index.ts`:
  - [x] Add document version handling to the stream completion logic
  - [x] Pass document edit status in the complete event

- [x] Enhance `apps/web/src/features/documents/services/sseClient.ts`:
  - [x] Update the `CompleteEvent` type to include document version information 
  - [x] Process version creation status in the `onComplete` callback

- [x] Update `apps/web/src/hooks/useChatInterface.ts`:
  - [x] Add handling for document version creation success/failure
  - [x] Refresh document content after successful version creation
  - [x] Add user feedback for successful version creation

### Error Handling & Edge Cases

- [x] Implement robust error handling:
  - [x] Handle XML parsing failures
  - [x] Manage database errors during version creation
  - [x] Provide appropriate error messages for different failure scenarios

- [x] Address edge cases:
  - [x] Handle incomplete or malformed XML in document edits
  - [x] Manage concurrent edit situations
  - [x] Handle permission issues for document updates

### Testing

- [ ] Create test scenarios:
  - [ ] Test simple document edits
  - [ ] Test complex document modifications
  - [ ] Test error conditions and recovery

- [ ] Verify integration:
  - [ ] Confirm frontend properly reflects new versions
  - [ ] Verify document history shows AI-generated versions
  - [ ] Test document restore functionality with AI-created versions

## Implementation Details

### Integration Architecture

The implementation will leverage the existing `onComplete` handler in the SSE streaming flow. Here's the sequence:

1. When a streaming message completes in `apps/api/src/controllers/sse.ts`, the `sendComplete` function will:
   - Check the message content for `<document_edit>` tags using a regex pattern
   - If found, extract the content between `<content>` tags
   - Call the new `documentEditHandler.processDocumentEdit` function

2. The document edit handler will:
   - Access the document context from the request (documentId, title)
   - Extract the new content from XML tags
   - Call `documentVersionService.createAIEditVersion` function

3. The document version service will:
   - Fetch the current document and version
   - Create a new version in the `entity_versions` table with:
     - Version type: 'ai_edit'
     - Proper version number incrementation
     - Full content from the AI edit
   - Update the entity record with new title if changed
   - Return success/failure status

4. The SSE controller will include version creation info in the complete event response:
   - Add `documentVersionCreated: true/false` to the complete event data
   - Include version information if successful

5. The frontend `useChatInterface` will:
   - Handle the version created status in the `onComplete` callback
   - Refresh document content if needed
   - Show success/error feedback to the user

### Database Operations

The key database operations will mimic the existing pattern in `DocumentRepository.saveDocument()`:

```typescript
// Mark previous version as not current
await supabase
  .from('entity_versions')
  .update({ is_current: false })
  .eq('id', currentVersion.id);

// Create new version
const { data: newVersion, error: newVersionError } = await supabase
  .from('entity_versions')
  .insert({
    entity_id: documentId,
    entity_type: 'user_document',
    version_number: newVersionNumber,
    full_content: createFullContent(title, newContent),
    version_type: 'ai_edit',  // New version type specific to AI edits
    is_current: true,
    base_version_id: currentVersion?.id,
    created_at: now
  })
  .select()
  .single();
```

### Technical Considerations

- The implementation should use transactional operations to ensure database consistency
- Error handling must include proper cleanup if version creation fails
- The system should maintain proper version history and relationships
- Performance impact on the streaming experience should be minimal
- Security measures should verify user ownership of documents

## Dependencies

- [x] Phase 1: System prompt implementation
- [x] Phase 2: Chat UI enhancement for document editing
- [x] Existing document repository and versioning system
- [x] Streaming infrastructure for AI responses 