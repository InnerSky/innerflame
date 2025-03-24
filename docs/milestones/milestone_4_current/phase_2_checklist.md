# Phase 2 Checklist: Chat UI Enhancement for Document Editing

## Objective
Enhance the chat UI to display a special visual indicator when document edits are being streamed, distinguishing document edit responses from regular messages. This implementation should provide a seamless experience where users can see document edits forming in real-time with proper visual feedback.

## Tasks

### Analysis & Planning
- [x] Review the existing chat interface components:
  - [x] `ChatInterface.tsx`: Main container component that orchestrates the chat UI
  - [x] `MessageList.tsx`: Component that renders the list of messages
  - [x] `MessageItem.tsx`: Individual message display that needs modification for document edits
- [x] Analyze streaming state management in `useChatInterface.ts` hook
- [x] Identify integration points in the SSE client for tag detection

### Document Edit UI Implementation
- [x] Create a new `DocumentEditBubble.tsx` component that will:
  - [x] Display document content with visual enhancements for edits
  - [x] Show a specialized loading indicator during streaming
  - [x] Support transitioning between states (waiting → streaming → complete)
- [x] Implement the XML tag detection logic during streaming:
  - [x] Detect opening `<document_edit>` tag
  - [x] Track the nested `<content>` tag
  - [x] Recognize closing `</document_edit>` tag
- [x] Enhance the `MessageItem.tsx` component to:
  - [x] Switch to document edit mode when tags are detected
  - [x] Render the `DocumentEditBubble` component for document edits
  - [x] Support reverting to normal message mode when needed

### Streaming State Management
- [x] Update the `useChatInterface.ts` hook to:
  - [x] Track document edit streaming state
  - [x] Accumulate content between tags
  - [x] Extract document content for processing
- [x] Add debounced parsing logic to handle partial XML tags
- [x] Create helper functions to:
  - [x] Determine if a message contains document edits
  - [x] Extract document content from XML
  - [x] Format document edits for display

### Visual Feedback Implementation
- [x] Design and implement visual indicators for document edit states:
  - [x] Waiting for edits (after `<document_edit>` but before content)
  - [x] Loading/streaming indicator while content is being received
  - [x] Completion indicator when document edit is finalized
- [x] Add appropriate styling for document edit bubbles:
  - [x] Different background color or border
  - [x] Visual separation from normal messages
  - [x] Appropriate spacing and layout

### Integration & Testing
- [x] Connect components to existing streaming infrastructure
- [ ] Test different document edit scenarios:
  - [ ] Simple edits (adding text, removing text)
  - [ ] Complex edits (restructuring, formatting)
  - [ ] Edge cases (very large documents, empty documents)
- [x] Ensure smooth transitions between streaming states
- [x] Verify that normal chat messages continue to work correctly

## Verification Criteria
1. [x] Chat UI correctly detects `<document_edit>` tags in streamed content
2. [x] Document edit bubbles display a distinct visual appearance
3. [x] Streaming document edits show appropriate loading indicators
4. [x] UI properly transitions between waiting, streaming, and complete states
5. [x] Multiple document edits in a conversation display correctly
6. [x] Normal chat messages work alongside document edits
7. [x] The experience is responsive and works on both desktop and mobile

## Dependencies
- [x] System prompt implementation from Phase 1
- [x] Existing SSE client for streaming
- [x] Current chat interface components

## Implementation Approach Based on Cline Architecture
Drawing from the Cline streaming editor architecture, our implementation:

1. **Monitors Incoming Chunks**: Similar to Cline's DiffViewProvider, we detect document edit tags in real-time as content streams in.

2. **Visual Distinction**: Like Cline's DecorationController, we use visual indicators to distinguish document edits from regular chat messages.

3. **State Transitions**: Handle transitions between different states (waiting, streaming, complete) with appropriate visual feedback.

4. **Content Accumulation**: Accumulate XML-tagged content while preserving the streaming experience for the user.

## Key Learnings & Implementation Notes

### Segmented Message Rendering
- Implemented a message segmentation system that handles both regular text and document edits in a single response
- Created `parseMessageSegments` and `parseStreamingSegments` utilities to break messages into appropriate segments
- This allows text before, after, and between document edit blocks to display correctly

### State Management
- Added document edit state tracking in the `useChatInterface` hook
- Implemented debounced parsing to prevent excessive re-renders during streaming
- Created a clean state transition system from NONE → WAITING → CONTENT_STARTED → COMPLETED

### Mixed Content Handling
- Enhanced the `MessageItem` component to display multiple segments with different rendering strategies
- Regular text segments use the standard `MarkdownRenderer`
- Document edit segments use the specialized `DocumentEditBubble`
- This approach provides a seamless experience for complex AI responses

### Edge Case Handling
- Implemented robust parsing for incomplete XML tags during streaming
- Added fallback displays for different document edit states
- Created safety mechanisms to prevent displaying malformed XML tags during streaming

The implementation successfully maintains the original UX of streaming while adding specialized handling for document edits, ensuring that text outside of document edit XML tags is also properly displayed to users. 