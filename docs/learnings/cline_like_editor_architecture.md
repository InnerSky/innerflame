# Cline-like Streaming Document Editor Architecture

## Overview
This document outlines a plan for implementing a streaming document editor inspired by the Cline architecture, adapted specifically for InnerFlame's document management system. The goal is to create a minimum viable product (MVP) that enables real-time editing of documents with AI assistance while maintaining a smooth user experience.

## Key Features Comparison

| Feature | Cline Implementation | Needed for MVP? | Rationale |
|---------|---------------------|-----------------|-----------|
| Real-time content streaming | Uses SSE for token-by-token updates | Yes | Essential for responsive UX during document generation |
| Visual diff view | DiffViewProvider with side-by-side comparison | Yes | Required for clear change visualization |
| Error/diagnostic feedback | Real-time error detection and display | Yes | Necessary for user confidence and error handling |
| File creation/modification | Command-based file operations | Yes | Core functionality for document editing |
| User approval workflow | Controls for accepting/rejecting changes | Yes | Essential for user control over AI-generated content |
| Stream abort capability | Can cancel streaming mid-generation | Yes | Important for user control and resource management |
| Multiple provider support | Abstraction for different AI providers | No | Will focus on single provider for MVP |
| Token usage tracking | Monitors token consumption | No | Not essential for initial MVP |

## Version Management

### Version Control Implementation
The system will maintain document versioning with the following workflow:

1. **Generation Phase**:
   - AI-generated content is streamed to a temporary document state
   - Original content is preserved in memory for comparison

2. **Review Phase**:
   - User reviews changes with visual diff highlighting
   - Generated content shown with green highlighting
   - Original content can be viewed with red highlighting on toggle

3. **Decision Phase**:
   - If user approves ("Looks Good"):
     - Create new version record in `entity_versions` table
     - Set new version as current (`isCurrent = true`)
     - Update document's `currentVersionId` and `versionNumber`
     - Store AI generation metadata in version record
   - If user rejects ("Revert"):
     - Discard temporary changes
     - Keep current version as active

### Backend Persistence

All document version management is handled by the backend API, not the frontend, with the following approach:

1. **API-Driven Versioning**:
   - The frontend sends an "approve changes" API request with the document ID and new content
   - Backend handles all database interactions for version creation
   - Previous versions are automatically marked as non-current

2. **Database Structure**:
   - `entities` table stores the current state and metadata of documents
   - `entity_versions` table maintains the full version history
   - Version records include:
     - `entity_id`: Reference to the document
     - `version_number`: Sequential version counter
     - `full_content`: Document content for that version
     - `is_current`: Boolean flag marking the active version
     - `version_type`: Set to 'ai_generation' for AI-assisted changes
     - `base_version_id`: Reference to the parent version
     - `created_at`: Timestamp of creation

3. **Version Handling Flow**:
   - When changes are approved, frontend calls `documentRepository.createVersionAndUpdateDocument()`
   - Backend creates a new version record and updates document metadata
   - Returns the updated document with the new version information
   - All database transactions are handled as an atomic operation

4. **Version Reverting**:
   - Frontend provides a "Revert" button that discards the temporary changes
   - No database operation is needed for rejection since changes were only temporary

## Architecture Plan for MVP

### Core Components

1. **StreamingDocumentProvider**
   - Central orchestrator for document streaming updates
   - Manages document state transitions during streaming
   - Handles temporary document state during review
   - Communicates with backend for version creation when changes are approved
   - Integrates with existing DocumentsContext for document operations

2. **DiffView Component**
   - Displays visual diff of changes with color highlighting
   - Manages toggle between showing new content (green) and old content (red)
   - Supports sectional navigation of changes
   - Implements click-to-toggle behavior for comparing versions

### Integration with Existing Components

1. **DocumentsContext Integration**
   - Extend the existing DocumentsContext with streaming capabilities:
     ```typescript
     interface DocumentsContextType {
       // Existing properties...
       
       // New streaming properties
       isStreaming: boolean;
       streamingContent: string | null;
       temporaryDocument: {
         content: string;
         sections: Array<{
           startIndex: number;
           endIndex: number;
           newText: string;
           oldText: string;
         }>;
       } | null;
       streamingError: string | null;
       
       // New streaming operations
       startDocumentStreaming: (prompt: string) => Promise<void>;
       abortStreaming: () => void;
       approveChanges: () => Promise<void>;
       rejectChanges: () => void;
       toggleDiffSection: (sectionIndex: number) => void;
     }
     ```

2. **Document Editor Enhancement**
   - Add diff view components to the existing DocumentEditor:
     - Green highlighting for added/changed content
     - Red highlighting for removed/replaced content on toggle
     - Click-to-toggle functionality on changed sections
     - "Looks Good" and "Revert" buttons for approval flow

3. **Version Repository Extension**
   - Add methods for version creation and management:
     ```typescript
     interface DocumentRepository {
       // Existing methods...
       
       // New version methods
       createVersionAndUpdateDocument: (
         documentId: string, 
         versionData: Partial<DocumentVersion>,
         newVersionNumber: number
       ) => Promise<Document>;
       
       revertToVersion: (
         documentId: string, 
         versionId: string
       ) => Promise<Document>;
     }
     ```

### Backend API Integration

1. **API Endpoints**:
   - Extend the existing AI streaming endpoint to support document editing
   - Reuse the SSE (Server-Sent Events) infrastructure for streaming
   - Add system prompt to instruct AI about document edit formatting

2. **API/Frontend Communication**:
   ```typescript
   // Frontend document approval flow
   async function approveChanges() {
     if (!temporaryDocument || !selectedDocument) return;
     
     try {
       // Call backend API to create new version
       // All database operations happen in the backend
       const updatedDoc = await documentRepository.createVersionAndUpdateDocument(
         selectedDocument.id, 
         {
           content: {
             title: selectedDocument.title,
             content: temporaryDocument.content,
           },
           entityType: selectedDocument.entityType,
           isCurrent: true,
           createdAt: new Date(),
           // Add AI generation metadata
           changes: {
             source: 'ai_generation',
             timestamp: new Date().toISOString(),
             prompt: lastPromptUsed
           }
         },
         selectedDocument.versionNumber ? selectedDocument.versionNumber + 1 : 1
       );
       
       // Update local state with the response from backend
       setSelectedDocument(updatedDoc);
       setContent(temporaryDocument.content);
       setTemporaryDocument(null);
       setIsStreaming(false);
     } catch (error) {
       // Handle errors
     }
   }
   ```

### System Prompt & Response Handling

1. **AI System Prompt**
   - Create a specialized system prompt inspired by Cline's approach:
     ```typescript
     // src/features/documents/services/documentSystemPrompt.ts
     export const DOCUMENT_SYSTEM_PROMPT = `
     You are an AI assistant helping users with document editing. 
     
     When editing documents, if you need to suggest changes, use the following XML format:
     
     <document_edit>
     <content>
     Your suggested document content here. Include the FULL document content, not just the changes.
     </content>
     </document_edit>
     
     Your edits will be processed and presented to the user with a visual diff highlighting the changes.
     The user will be able to review the changes and either approve or reject them.
     
     Do not include any other XML-style tags in your response, as they might be misinterpreted as commands.
     
     When responding to user queries about documents, aim to be helpful, clear, and accurate.
     `;
     ```

2. **Streaming Document Hook**
   - Implement a custom hook that processes streaming chunks and handles document edits:
     ```typescript
     // src/features/documents/hooks/useStreamingDocument.ts
     export function useStreamingDocument() {
       // State for streaming and temporary document
       const [isStreaming, setIsStreaming] = useState(false);
       const [streamingContent, setStreamingContent] = useState<string | null>(null);
       const [temporaryDocument, setTemporaryDocument] = useState<TemporaryDocument | null>(null);
       const [streamingError, setStreamingError] = useState<string | null>(null);
       
       // Function to extract document edit content from streaming response
       const extractDocumentEdit = useCallback((text: string): string | null => {
         const match = text.match(/<document_edit>\s*<content>([\s\S]*?)<\/content>\s*<\/document_edit>/);
         return match ? match[1] : null;
       }, []);
       
       // Function to handle streaming chunks
       const handleStreamChunk = useCallback((chunk: string) => {
         setStreamingContent((prev) => {
           const newContent = (prev || "") + chunk;
           
           // Try to extract document edit content
           const editContent = extractDocumentEdit(newContent);
           
           if (editContent) {
             // If we have document edit content, calculate diff and update temporary document
             const sections = calculateDiff(content, editContent);
             setTemporaryDocument({
               content: editContent,
               sections
             });
           }
           
           return newContent;
         });
       }, [content, extractDocumentEdit]);
       
       // Function to start document streaming
       const startDocumentStreaming = useCallback(async (prompt: string) => {
         if (!selectedDocument) return;
         
         setIsStreaming(true);
         setStreamingContent("");
         setStreamingError(null);
         
         // Use the existing sseClient without modification
         const stream = createAIStream({
           message: prompt,
           userId,
           contextType: 'document',
           documentId: selectedDocument.id,
           documentTitle: selectedDocument.title,
           documentContent: selectedDocument.content,
           onChunk: handleStreamChunk,
           onError: (error) => setStreamingError(error),
           onComplete: () => setIsStreaming(false)
         });
         
         // Return stream control functions
         return {
           abort: stream.close
         };
       }, [selectedDocument, userId, handleStreamChunk]);
       
       // ... additional functions for approveChanges, rejectChanges, etc.
       
       return {
         isStreaming,
         streamingContent,
         temporaryDocument,
         streamingError,
         startDocumentStreaming,
         approveChanges,
         rejectChanges,
         abortStreaming,
         toggleDiffSection
       };
     }
     ```

### Essential Files to Create

```
src/features/documents/services/StreamingDocumentProvider.tsx
src/features/documents/services/documentSystemPrompt.ts
src/features/documents/components/DiffView.tsx
src/features/documents/components/DiffViewControls.tsx
src/features/documents/hooks/useStreamingDocument.ts
src/features/documents/utils/diffCalculator.ts
```

### Implementation Strategy

#### Phase 1: Core Streaming Infrastructure
1. Create system prompt for document editing
   ```typescript
   // src/features/documents/services/documentSystemPrompt.ts
   export const DOCUMENT_SYSTEM_PROMPT = `...`;
   ```

2. Develop `useStreamingDocument` hook with integrated response processing
   ```typescript
   // src/features/documents/hooks/useStreamingDocument.ts
   export function useStreamingDocument() {
     // State management and streaming functionality
     // Includes document edit extraction and diff calculation
   }
   ```

3. Implement `StreamingDocumentProvider` service
   ```typescript
   // src/features/documents/services/StreamingDocumentProvider.tsx
   export function StreamingDocumentProvider({ children }) {
     // Use the streaming document hook
     const {
       isStreaming,
       streamingContent,
       temporaryDocument,
       streamingError,
       startDocumentStreaming,
       approveChanges,
       rejectChanges,
       abortStreaming,
       toggleDiffSection
     } = useStreamingDocument();
     
     // Provide streaming context to children
     return (
       <StreamingDocumentContext.Provider
         value={{
           isStreaming,
           streamingContent,
           temporaryDocument,
           streamingError,
           startDocumentStreaming,
           approveChanges,
           rejectChanges,
           abortStreaming,
           toggleDiffSection
         }}
       >
         {children}
       </StreamingDocumentContext.Provider>
     );
   }
   ```

#### Phase 2: User Interface Components
1. Build `DiffView` component for highlighting changes
   ```tsx
   // src/features/documents/components/DiffView.tsx
   export function DiffView({ 
     originalContent,
     newContent,
     sections,
     activeSections,
     onSectionToggle
   }) {
     return (
       <div className="relative">
         {sections.map((section, index) => (
           <span 
             key={index}
             className={activeSections.includes(index) 
               ? "bg-red-100 cursor-pointer" 
               : "bg-green-100 cursor-pointer"}
             onClick={() => onSectionToggle(index)}
           >
             {activeSections.includes(index) 
               ? section.oldText 
               : section.newText}
           </span>
         ))}
       </div>
     );
   }
   ```

2. Create `DiffViewControls` component
   ```tsx
   // src/features/documents/components/DiffViewControls.tsx
   export function DiffViewControls({ 
     onApprove, 
     onReject, 
     onAbort, 
     isStreaming 
   }) {
     return (
       <div className="flex gap-2 items-center">
         <Button
           onClick={onApprove}
           disabled={isStreaming}
           variant="primary"
         >
           Looks Good
         </Button>
         <Button
           onClick={onReject}
           disabled={isStreaming}
           variant="outline"
         >
           Revert
         </Button>
         {isStreaming && (
           <Button
             onClick={onAbort}
             variant="destructive"
           >
             Abort
           </Button>
         )}
       </div>
     );
   }
   ```

3. Create utility for calculating diffs
   ```typescript
   // src/features/documents/utils/diffCalculator.ts
   export function calculateDiff(originalText: string, newText: string) {
     // Implementation of diff algorithm to find changed sections
     // Returns an array of sections with startIndex, endIndex, oldText, newText
   }
   ```

#### Phase 3: Integration and Refinement
1. Connect streaming and diff system to existing document editor in Documents.tsx
2. Implement proper error handling and user notifications
3. Add abort capability

## Architecture Diagram

```
┌───────────────────────────────┐      ┌───────────────────┐
│  Enhanced Document Editor     │      │  AI Model API     │
│  ┌───────────────────────┐    │      │                   │
│  │     DiffView          │◄───┼──────┼─► Existing        │
│  │                       │    │      │   SSE Client      │
│  └───────────────────────┘    │      │                   │
│           ▲                   │      └───────────────────┘
│           │                   │               │
│  ┌───────────────────────┐    │               │
│  │  DiffViewControls     │    │               ▼
│  │ (Looks Good/Revert)   │    │      ┌───────────────────┐
│  └───────────────────────┘    │      │ Backend API       │
│           ▲                   │      │                   │
│           │                   │◄─────┤ - System Prompt   │
│  ┌───────────────────────┐    │      │ - Version Creation│
│  │ StreamingDocumentProv │    │      │                   │
│  │ (with useStreamingDoc)│    │      └───────────────────┘
│  └───────────────────────┘    │               │
└───────────────────────────────┘               ▼
                                       ┌───────────────────┐
                                       │ Database          │
                                       │                   │
                                       │ - entities        │
                                       │ - entity_versions │
                                       └───────────────────┘
```

## Next Steps

1. Create the system prompt for document editing
2. Implement the diff calculation utility
3. Build the useStreamingDocument hook with integrated response formatting
4. Create the DiffView component with toggle functionality
5. Implement StreamingDocumentProvider and context
6. Integrate with the backend API for document version management
7. Implement the approval/rejection workflow with backend persistence
