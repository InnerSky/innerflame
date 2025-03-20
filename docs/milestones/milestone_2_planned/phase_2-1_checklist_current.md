# Phase 2.1 Checklist: ChatInterface Refactoring Plan

## Objective
Refactor the ChatInterface component to separate UI rendering from business logic, improving code maintainability, testability, and reusability.

## Current Implementation Analysis
The current `ChatInterface.tsx` has several issues that make it difficult to maintain:

1. **Mixed Concerns**: UI rendering and business logic are tightly coupled in one large component (~700 lines).
2. **Complex State Management**: Multiple interconnected state variables with complex update patterns.
3. **Direct API Calls**: Service calls embedded directly in the component.
4. **Streaming Logic**: SSE implementation mixed with UI rendering code.
5. **Debugging Code**: Extensive console logging mixed throughout the component.

## Proposed Refactoring: Custom Hook Pattern

### The Most Impactful Change
Extract all business logic into a custom hook (`useChatInterface`), leaving the component to handle only rendering and user interactions.

## Tasks

### 1. Create the Custom Hook
- [ ] Create a new file `hooks/useChatInterface.ts`
- [ ] Extract all state variables into the hook
- [ ] Move API calls and business logic to the hook
- [ ] Implement streaming functionality within the hook
- [ ] Return only necessary state and methods to the component

### 2. Refactor Chat Interface Component
- [ ] Remove business logic from the component
- [ ] Use the custom hook to access state and methods
- [ ] Focus the component on rendering and event handling
- [ ] Simplify conditional rendering logic

### 3. Create Smaller UI Components
- [ ] Extract MessageList into its own component
- [ ] Extract MessageItem for individual messages
- [ ] Create a separate StreamingMessage component
- [ ] Extract ChatInput as a reusable component

### 4. Improve State Management
- [ ] Consolidate related state variables
- [ ] Implement reducer pattern for complex state transitions
- [ ] Clearly separate UI state from domain state

### 5. Enhance Error Handling
- [ ] Centralize error handling in the custom hook
- [ ] Implement proper error states and recovery
- [ ] Provide clear error messages to the UI

## Implementation Approach

### Step 1: Create the Custom Hook
```typescript
// useChatInterface.ts
export function useChatInterface(props: {
  contextId?: string;
  contextType: MessageContextType;
  documentContent?: string;
}) {
  // State variables extracted from the component
  const [chatHistory, setChatHistory] = useState<MessageModel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContents, setStreamingContents] = useState<Record<string, string>>({});
  const [streamingMessages, setStreamingMessages] = useState<Record<string, boolean>>({});
  
  // Business logic methods
  const sendMessage = async (content: string) => { /* ... */ };
  const editMessage = async (messageId: string, newContent: string) => { /* ... */ };
  const deleteMessage = async (messageId: string) => { /* ... */ };
  
  // Streaming logic
  const handleStreamChunk = (messageId: string, chunk: string) => { /* ... */ };
  
  return {
    chatHistory,
    isLoading,
    streamingContents,
    streamingMessages,
    sendMessage,
    editMessage,
    deleteMessage
  };
}
```

### Step 2: Refactor the Component
```tsx
// ChatInterface.tsx
export const ChatInterface: React.FC<ChatInterfaceProps> = (props) => {
  const {
    chatHistory,
    isLoading,
    streamingContents,
    streamingMessages,
    sendMessage,
    editMessage,
    deleteMessage
  } = useChatInterface({
    contextId: props.contextId,
    contextType: props.contextType,
    documentContent: props.documentContent
  });
  
  // Component now focuses on UI rendering and event handling
  return (
    <div className="chat-container">
      <MessageList 
        messages={chatHistory}
        streamingContents={streamingContents}
        streamingMessages={streamingMessages}
        onEdit={editMessage}
        onDelete={deleteMessage}
      />
      <ChatInput 
        onSendMessage={sendMessage}
        isLoading={isLoading}
      />
    </div>
  );
};
```

## Benefits

1. **Improved Maintainability**: Clear separation of concerns makes the code easier to understand and modify.
2. **Better Testability**: Business logic in a custom hook is easier to test than UI components.
3. **Code Reuse**: The hook can be used by different components if needed.
4. **Simplified UI Components**: Components focus on rendering, making them more predictable.
5. **Easier Bug Fixing**: Issues in business logic vs. UI rendering are clearly separated.

## Verification Criteria
1. [ ] All existing functionality works as before
2. [ ] Code is more maintainable with clear separation of concerns
3. [ ] UI components are smaller and focused on rendering
4. [ ] Business logic is encapsulated in the custom hook
5. [ ] Streaming functionality works correctly with the new architecture

## Dependencies
- Existing ChatInterface.tsx component
- MessageService
- SSE implementation

## Notes
- This refactoring does not change functionality but improves code structure
- Focus on one aspect at a time, starting with the custom hook extraction
- Maintain test coverage throughout the refactoring process
- Consider adding TypeScript interfaces for all component props and hook return values 