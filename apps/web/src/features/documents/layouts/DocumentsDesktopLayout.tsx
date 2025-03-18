import React from 'react';
import { DocumentsHeader } from '../components/DocumentsHeader.js';
import { DocumentWorkspace } from '../components/DocumentWorkspace.js';
import { DocumentEmptyState } from '../components/DocumentEmptyState.js';
import { DocumentList } from '../components/DocumentList.js';
import { ModalContainer } from '../components/ModalContainer.js';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert.js';
import { Spinner } from '@/components/Spinner.js';
import { useDocumentsContext } from '../contexts/DocumentsContext.js';
import { Document } from '../models/document.js';
import { ProjectInfoRefType } from '../components/ProjectInfo.js';

type DocumentsDesktopLayoutProps = {
  // User information
  userId?: string;
  
  // Project handling
  projectSelectorKey: number;
  onSelectProject: (projectId: string | null) => void;
  onCreateProject: (title: string, content: string) => Promise<any>;
  onGoHome: () => void;
  projectActionMenu: React.ReactNode;
  getHeaderTitle: () => string;
  onProjectInfoRefCreated?: (ref: React.RefObject<ProjectInfoRefType>) => void;
  
  // Document list props
  filteredDocuments: any[];
  searchQuery: string;
  sortDirection: 'asc' | 'desc';
  onSearch: (query: string) => void;
  onClearSearch: () => void;
  onToggleSort: () => void;
  onDuplicate: (document: Document) => Promise<void>;
  onConfirmDeleteDocument: (document: any) => void;
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

export const DocumentsDesktopLayout: React.FC<DocumentsDesktopLayoutProps> = ({
  // User information
  userId,
  
  // Project handling
  projectSelectorKey,
  onSelectProject,
  onCreateProject,
  onGoHome,
  projectActionMenu,
  getHeaderTitle,
  onProjectInfoRefCreated,
  
  // Document list props
  filteredDocuments,
  searchQuery,
  sortDirection,
  onSearch,
  onClearSearch,
  onToggleSort,
  onDuplicate,
  onConfirmDeleteDocument,
  onAssignToProject,
  onCreateNew,
  
  // Loading states
  loading,
  error,
  
  // Modal props
  showVersionModal,
  setShowVersionModal,
  viewingVersionIndex,
  setViewingVersionIndex,
  onActivateVersion,
  
  showDeleteDialog,
  setShowDeleteDialog,
  documentToDelete,
  onDeleteDocument,
  
  showDiscardDialog,
  setShowDiscardDialog,
  onDiscardChanges,
  onSaveAndSwitch,
  
  showProjectDialog,
  setShowProjectDialog,
  projectToEdit,
  onSaveProjectEdit,
  
  showDeleteProjectDialog,
  setShowDeleteProjectDialog,
  onDeleteProject
}) => {
  const { selectedDocument, selectDocument, selectedProjectId } = useDocumentsContext();
  
  return (
    <div className="flex flex-col min-h-screen py-6">
      <DocumentsHeader
        projectSelectorKey={projectSelectorKey}
        userId={userId}
        onSelectProject={onSelectProject}
        onCreateProject={onCreateProject}
        onGoHome={onGoHome}
        isMobile={false}
      />
      
      {loading && filteredDocuments.length === 0 ? (
        <div className="flex items-center justify-center min-h-[60vh]">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <div className="max-w-md mx-auto mt-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      ) : (
        <div className="flex flex-1 container max-w-screen-2xl mx-auto">
          <div className="w-80 flex-shrink-0 overflow-hidden border-r flex flex-col h-[calc(100vh-140px)]">
            <div className="p-4 flex flex-col h-full">
              <DocumentList
                documents={filteredDocuments}
                selectedDocument={selectedDocument}
                searchQuery={searchQuery}
                sortDirection={sortDirection}
                onSearch={onSearch}
                onClearSearch={onClearSearch}
                onToggleSort={onToggleSort}
                onSelectDocument={selectDocument}
                onDuplicate={onDuplicate}
                onDelete={onConfirmDeleteDocument}
                userId={userId}
                onAssignToProject={onAssignToProject}
                onCreateNew={onCreateNew}
                currentProjectId={selectedProjectId}
                getHeaderTitle={getHeaderTitle}
              />
            </div>
          </div>
          
          <div className="flex-grow">
            {selectedDocument || selectedProjectId ? (
              <DocumentWorkspace 
                isMobile={false} 
                className="px-4 md:px-8 py-6 h-[calc(100vh-140px)]"
                onCreateNew={onCreateNew}
                projectActionMenu={projectActionMenu}
                onProjectInfoRefCreated={onProjectInfoRefCreated}
              />
            ) : (
              <div className="px-4 md:px-8 py-6">
                <DocumentEmptyState
                  isMobile={false}
                  documentsExist={filteredDocuments.length > 0}
                  onCreateNew={onCreateNew}
                />
              </div>
            )}
          </div>
        </div>
      )}
      
      <ModalContainer
        showVersionModal={showVersionModal}
        setShowVersionModal={setShowVersionModal}
        viewingVersionIndex={viewingVersionIndex}
        setViewingVersionIndex={setViewingVersionIndex}
        onActivateVersion={onActivateVersion}
        
        showDeleteDialog={showDeleteDialog}
        setShowDeleteDialog={setShowDeleteDialog}
        documentToDelete={documentToDelete}
        onDeleteDocument={onDeleteDocument}
        
        showDiscardDialog={showDiscardDialog}
        setShowDiscardDialog={setShowDiscardDialog}
        onDiscardChanges={onDiscardChanges}
        onSaveAndSwitch={onSaveAndSwitch}
        
        showProjectDialog={showProjectDialog}
        setShowProjectDialog={setShowProjectDialog}
        projectToEdit={projectToEdit}
        onSaveProjectEdit={onSaveProjectEdit}
        
        showDeleteProjectDialog={showDeleteProjectDialog}
        setShowDeleteProjectDialog={setShowDeleteProjectDialog}
        onDeleteProject={onDeleteProject}
      />
    </div>
  );
}; 