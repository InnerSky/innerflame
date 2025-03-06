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