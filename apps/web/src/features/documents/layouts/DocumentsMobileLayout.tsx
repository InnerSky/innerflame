import React from 'react';
import { DocumentsHeader } from '../components/DocumentsHeader.js';
import { DocumentWorkspace } from '../components/DocumentWorkspace.js';
import { DocumentEmptyState } from '../components/DocumentEmptyState.js';
import { DocumentList } from '../components/DocumentList.js';
import { ModalContainer } from '../components/ModalContainer.js';
import { AlertCircle, X } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert.js';
import { Spinner } from '@/components/Spinner.js';
import { useDocumentsContext } from '../contexts/DocumentsContext.js';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button.js';
import { Document } from '../models/document.js';
import { ProjectInfoRefType } from '../components/ProjectInfo.js';

type DocumentsMobileLayoutProps = {
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

export const DocumentsMobileLayout: React.FC<DocumentsMobileLayoutProps> = ({
  // User information
  userId,
  
  // Drawer state
  drawerOpen,
  toggleDrawer,
  
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
  
  // Handler for selecting a document and closing the drawer
  const handleSelectDocument = (document: any) => {
    selectDocument(document);
    toggleDrawer();
  };
  
  return (
    <div className="flex flex-col h-[100dvh] overflow-hidden">
      <DocumentsHeader
        projectSelectorKey={projectSelectorKey}
        userId={userId}
        onSelectProject={onSelectProject}
        onCreateProject={onCreateProject}
        onGoHome={onGoHome}
        onToggleDrawer={toggleDrawer}
        isMobile={true}
      />
      
      {/* Mobile layout content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Mobile Document List Drawer */}
        <AnimatePresence>
          {drawerOpen && (
            <>
              {/* Overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-black/50 z-40"
                onClick={toggleDrawer}
              />
              
              {/* Drawer */}
              <motion.div
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                transition={{ duration: 0.2 }}
                className="fixed left-0 top-0 bottom-0 w-4/5 max-w-[280px] z-50 bg-background shadow-lg h-full"
              >
                {/* Close button positioned outside the drawer */}
                <div className="absolute right-[-50px] top-[6px] z-50">
                  <Button variant="ghost" size="icon" onClick={toggleDrawer} className="bg-background/80 backdrop-blur-sm">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="h-full flex flex-col overflow-hidden">
                  <div className="flex-1 overflow-hidden">
                    <DocumentList
                      documents={filteredDocuments}
                      selectedDocument={selectedDocument}
                      searchQuery={searchQuery}
                      sortDirection={sortDirection}
                      onSearch={onSearch}
                      onClearSearch={onClearSearch}
                      onToggleSort={onToggleSort}
                      onSelectDocument={handleSelectDocument}
                      onDuplicate={onDuplicate}
                      onDelete={onConfirmDeleteDocument}
                      userId={userId}
                      onAssignToProject={onAssignToProject}
                      onCreateNew={onCreateNew}
                      currentProjectId={selectedProjectId}
                      getHeaderTitle={getHeaderTitle}
                      onDrawerClose={toggleDrawer}
                    />
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
        
        {/* Document content area */}
        <div className="flex-1 flex flex-col h-[calc(100vh-58px)] overflow-hidden">
          {loading && filteredDocuments.length === 0 ? (
            <div className="flex items-center justify-center h-[60vh]">
              <Spinner size="lg" />
            </div>
          ) : error ? (
            <div className="p-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </div>
          ) : selectedDocument || selectedProjectId ? (
            <DocumentWorkspace 
              isMobile={true} 
              className="flex-1" 
              onCreateNew={onCreateNew}
              projectActionMenu={projectActionMenu}
              onProjectInfoRefCreated={onProjectInfoRefCreated}
            />
          ) : (
            <div className="p-4 flex-1 overflow-hidden">
              <DocumentEmptyState
                isMobile={true}
                documentsExist={filteredDocuments.length > 0}
                onCreateNew={onCreateNew}
                onShowDocuments={toggleDrawer}
              />
            </div>
          )}
        </div>
      </div>
      
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