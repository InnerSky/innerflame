# Documents Feature

This directory contains all the code related to the Documents feature, organized in a feature-based structure.

## Directory Structure

- `/components` - UI components specific to the Documents feature
- `/hooks` - Custom React hooks for Documents state management
- `/models` - Domain models and type definitions
- `/pages` - Page components that use the other parts
- `/repositories` - Data access layer for Documents

## Key Components

- `DocumentList` - Displays a list of documents with search and sort functionality
- `DocumentEditor` - Editor for document content with markdown preview
- `VersionHistoryModal` - Modal for viewing and restoring document versions
- `ConfirmationDialogs` - Reusable confirmation dialogs for document operations

## Data Flow

1. The `Documents` page uses the `useDocuments` hook to manage state
2. The hook uses the `DocumentRepository` to interact with the database
3. The repository maps database entities to domain models using functions in `mappers.ts`
4. UI components receive data and callbacks from the page component

## Usage

Import the Documents page component:

```tsx
import Documents from '@/features/documents/pages/Documents';
```

Or use the barrel exports:

```tsx
import { Documents } from '@/features/documents';
```

# Document Management with Project Organization

This document management system supports organizing documents within projects for better content organization.

## Features

### Project Selector

The Project Selector allows users to:

- Create new projects
- Switch between projects to view project-specific documents
- View all documents by selecting "All Projects"

### Project-Document Relationships

Documents can be associated with projects in several ways:

1. **Creating a new document** while a project is selected automatically adds the document to that project
2. **Assigning existing documents** to projects through the document context menu
3. **Moving documents between projects** or removing them from projects

### Implementation Details

The project-document relationship is implemented through metadata:

- Projects are stored as documents with type `DocumentType.Project`
- Regular documents have a `projectId` field in their metadata that points to the parent project
- The relationship is managed through Supabase using JSON field queries

### Data Flow

1. The `DocumentRepository` handles the database interactions:
   - `getUserProjectsOnly()` - Retrieves all projects for a user
   - `getDocumentsByProject()` - Retrieves documents for a specific project
   - `setDocumentProject()` - Updates a document's project association

2. The `useDocuments` hook manages the state and operations:
   - Tracks the currently selected project
   - Filters documents based on project selection
   - Adds newly created documents to the current project

3. UI Components:
   - `ProjectSelector` - Dropdown to select and create projects
   - `DocumentList` - Displays documents with project indicators
   - Project assignment through document context menu

## Future Enhancements

- Project hierarchies (nested projects)
- Project sharing and collaboration
- Batch operations for document organization
- Project statistics and visualization 