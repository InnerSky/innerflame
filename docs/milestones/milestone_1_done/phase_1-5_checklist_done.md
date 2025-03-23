# Project Chat Interface Enhancement - Phase 1.5 Checklist

## Objective
Enhance the Documents feature to display the chat interface even when only a project is selected (no document). This will allow users to have project-level conversations, with context_type set to "project" and context_id set to the project_id.

## Understanding the Codebase
- [x] Identify and review the component that handles tabs for document and chat side-by-side
  - Found in `DocumentWorkspace.tsx` which manages the layout for both mobile (tabs) and desktop (side-by-side) views
  - Currently, the component returns `null` if `!selectedDocument`, preventing any UI from showing
- [x] Examine the DocumentWorkspace component to understand how it displays content
  - It creates `EditorComponent` (DocumentEditor) and `ChatComponent` (ChatInterface)
  - For desktop, it shows them side by side; for mobile, it uses tabs with animation
- [x] Review ChatInterface component to understand context handling and messaging
  - Already supports project context via `determineMessageContext` function
  - Uses both `selectedDocument` and `selectedProjectId` from context
  - Shows context information at the top (project name and document name)
- [x] Understand how project context is managed in the document system
  - `selectedProjectId` is tracked in useDocuments hook and made available via context
  - Project metadata including title is available in `projectsData` in context
- [x] Verify how MessageContext is determined in the message model
  - `determineMessageContext` in `message.ts` handles three cases:
    1. Document selected: `{ contextType: MessageContextType.Document, contextId: selectedDocument.id }`
    2. Project selected: `{ contextType: MessageContextType.Project, contextId: selectedProjectId }`
    3. Neither: `{ contextType: MessageContextType.None, contextId: null }`
- [x] Examine DocumentEmptyState component to see how empty document states are handled
  - Currently shown in place of DocumentWorkspace when no document is selected
  - Has simple UI with an icon, message, and button to create a document

## Planning the Implementation
- [x] Decide on the UX for showing project info when no document is selected
  - Create a new ProjectInfo component to replace just the document editor portion
  - Keep the chat interface visible and functional
  - Show project title, description, and metadata in the document area
- [x] Determine changes needed in DocumentWorkspace
  - Modify to not return null when no document is selected but project is selected
  - Create conditional rendering for document vs. project vs. empty state
  - Keep chat functionality intact in both mobile and desktop layouts
- [x] Plan modifications needed for the ChatInterface to handle project-only contexts
  - Already handles project context well with `determineMessageContext`
  - Will need UI adjustments to clarify when in project-only mode
- [x] Consider layout changes needed to support the new interface
  - Desktop: Replace document editor with project info, keep chat sidebar
  - Mobile: Allow tab switching between project info and chat

## Implementation
- [x] Create a new ProjectInfo component to show project details when no document is selected
  - Created in `apps/web/src/features/documents/components/ProjectInfo.tsx`
  - Shows project title, overview, options for creating documents, and tips
  - Maintains consistent styling with the rest of the application
- [x] Modify DocumentWorkspace to check for project-only context and show appropriate view
  - Updated to check for `selectedProjectId` along with `selectedDocument`
  - Added conditional rendering for project-only mode with project info component
  - Added `onCreateNew` prop for project info to allow document creation
- [x] Update the layout components to handle project-only state
  - Modified `DocumentsDesktopLayout.tsx` to pass the `onCreateNew` prop 
  - Modified `DocumentsMobileLayout.tsx` to show UI when `selectedProjectId` is present
  - Added handling for both desktop and mobile layouts
- [x] Adjust ChatInterface to properly show messages in project context when no document is selected
  - Added specific handling for project-only mode
  - Updated context display to only show document info when relevant
  - Modified message placeholder text based on context
  - Added context-specific AI responses for project-only vs. document mode
  - Changed component title to reflect current context (Project Assistant vs. Document Assistant)
- [x] Add styling for the new project info display
  - Implemented card-based UI consistent with document editor
  - Added styled project tips and options for creating documents
  - Ensured responsive layout for both desktop and mobile views

## Testing and Refinement
- [x] Test the interface when switching between prox] Verify chat messages save properly with project context
- [x] Check that the layout maintains consistency across device sizes
- [x] Ensure smooth transitions when selecting or deselecting documents within a project

## Documentation
- [x] Add comments to explain the new behavior in relevant components
- [x] Update this checklist with implementation details and progress
- [x] Document any edge cases or special considerations
