import React, { useEffect, useState } from 'react';
import { DocumentsDesktopLayout } from './DocumentsDesktopLayout.js';
import { DocumentsMobileLayout } from './DocumentsMobileLayout.js';
import { Document } from '../models/document.js'; 
import { ProjectInfoRefType } from '../components/ProjectInfo.js';

// Custom hook for media queries
const useMediaQuery = (query: string) => {
  const [matches, setMatches] = React.useState(false);

  React.useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [matches, query]);

  return matches;
};

export type DocumentsResponsiveLayoutProps = {
  // User information
  userId?: string;
  
  // Drawer state
  drawerOpen: boolean;
  toggleDrawer: () => void;
  
  // Project handling
  projectSelectorKey: number;
  onSelectProject: (projectId: string | null) => void;
  onCreateProject: (title: string, content: string) => Promise<any>;
  onGoHome: () => void;
  projectActionMenu: React.ReactNode;
  getHeaderTitle: () => string;
  onProjectInfoRefCreated?: (ref: React.RefObject<ProjectInfoRefType>) => void;
  
  // Document list props
  filteredDocuments: Document[];
  searchQuery: string;
  sortDirection: 'asc' | 'desc';
  onSearch: (query: string) => void;
  onClearSearch: () => void;
  onToggleSort: () => void;
  onDuplicate: (document: Document) => Promise<void>;
  onConfirmDeleteDocument: (document: Document) => void;
  onAssignToProject: (documentId: string, projectId: string | null) => Promise<any>;
  onCreateNew: () => void;
  
  // Loading states
  loading: boolean;
  error: string | null;
  
  // Modal handling
  showVersionModal: boolean;
  setShowVersionModal: (show: boolean) => void;
  viewingVersionIndex: number;
  setViewingVersionIndex: (index: number) => void;
  onActivateVersion: (version: any) => void;
  
  showDeleteDialog: boolean;
  setShowDeleteDialog: (show: boolean) => void;
  documentToDelete: any | null;
  onDeleteDocument: () => void;
  
  showDiscardDialog: boolean;
  setShowDiscardDialog: (show: boolean) => void;
  onDiscardChanges: () => void;
  onSaveAndSwitch: () => Promise<void>;
  
  showProjectDialog: boolean;
  setShowProjectDialog: (show: boolean) => void;
  projectToEdit: { id: string; title: string; content: string } | null;
  onSaveProjectEdit: (title: string, content: string) => Promise<void>;
  
  showDeleteProjectDialog: boolean;
  setShowDeleteProjectDialog: (show: boolean) => void;
  onDeleteProject: () => void;
};

export const DocumentsResponsiveLayout: React.FC<DocumentsResponsiveLayoutProps> = (props) => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  // Track previous mobile state to detect layout changes
  const [prevIsMobile, setPrevIsMobile] = useState(isMobile);
  
  // Close drawer ONLY when switching from desktop to mobile, not on every render
  useEffect(() => {
    // Only run this effect when isMobile state actually changes
    if (prevIsMobile !== isMobile) {
      // If switching to mobile and drawer is open, close it
      if (isMobile && props.drawerOpen) {
        props.toggleDrawer();
      }
      // Update previous state
      setPrevIsMobile(isMobile);
    }
  }, [isMobile, prevIsMobile, props.drawerOpen, props.toggleDrawer]);
  
  if (isMobile) {
    return <DocumentsMobileLayout {...props} />;
  }
  
  return <DocumentsDesktopLayout {...props} />;
}; 