import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useDocuments } from '../hooks/useDocuments';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { DocumentList } from '../components/DocumentList';
import { DocumentEditor } from '../components/DocumentEditor';
import { VersionHistoryModal } from '../components/VersionHistoryModal';
import { DeleteConfirmationDialog, DiscardChangesDialog } from '../components/ConfirmationDialogs';
import { FileText, FilePlus, Home, List } from 'lucide-react';
import { Spinner } from '@/components/Spinner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

// Create a hook for media queries
const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(false);
  
  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    
    // Update state based on media query
    const updateMatches = (e: MediaQueryListEvent | MediaQueryList) => {
      setMatches(e.matches);
    };
    
    // Initial check
    updateMatches(mediaQuery);
    
    // Listen for changes
    mediaQuery.addEventListener('change', updateMatches);
    
    // Cleanup
    return () => {
      mediaQuery.removeEventListener('change', updateMatches);
    };
  }, [query]);
  
  return matches;
};

const Documents = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  const {
    documents,
    filteredDocuments,
    selectedDocument,
    title,
    content,
    isPreviewMode,
    saveStatus,
    loading,
    error,
    lastSaved,
    searchQuery,
    sortDirection,
    documentVersions,
    viewingVersionIndex,
    showVersionModal,
    showDeleteDialog,
    showDiscardDialog,
    documentToDelete,
    
    setTitle,
    setContent,
    setSearchQuery,
    setViewingVersionIndex,
    setShowVersionModal,
    setShowDeleteDialog,
    
    fetchDocuments,
    createNewDocument,
    saveDocument,
    selectDocument,
    handleDiscardChanges,
    deleteDocument,
    confirmDeleteDocument,
    duplicateDocument,
    fetchDocumentVersions,
    activateVersion,
    togglePreviewMode,
    clearSearch,
    toggleSort,
    hasUnsavedChanges
  } = useDocuments(user?.id);
  
  // Memoize the hasUnsavedChanges value for proper reactivity
  const documentHasUnsavedChanges = useMemo(() => {
    return hasUnsavedChanges();
  }, [hasUnsavedChanges, title, content]);
  
  // Toggle drawer (mobile)
  const toggleDrawer = () => {
    setDrawerOpen(prev => !prev);
  };
  
  // Go to home
  const goToHome = () => {
    navigate('/');
  };
  
  // Save and switch document
  const handleSaveAndSwitch = async () => {
    await saveDocument();
    handleDiscardChanges();
  };
  
  useEffect(() => {
    // Ensure no drawer is visible by default on mobile
    if (isMobile) {
      setDrawerOpen(false);
    }
  }, [isMobile]);
  
  // Loading state
  if (loading && documents.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }
  
  // Error state
  if (error && documents.length === 0) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Top header for document actions */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 max-w-screen-2xl items-center">
          {isMobile && (
            <Button 
              variant="ghost"
              className="mr-2"
              onClick={toggleDrawer}
              aria-label="Toggle document list"
            >
              <List className="h-5 w-5" />
            </Button>
          )}
          
          <div className="flex-1"></div>
          <ThemeToggle />
          
          <div className="ml-4 flex">
            <Button 
              onClick={createNewDocument} 
              disabled={saveStatus === 'saving'}
              variant="subtle"
              className="h-9 px-4 transition-colors"
              aria-label="Create new document"
            >
              <FilePlus className="mr-2 h-4 w-4" />
              <span>New Document</span>
            </Button>
          </div>
        </div>
      </header>
      
      {isMobile ? (
        // Mobile layout
        <div className="flex flex-col flex-1">
          {/* Mobile Drawer Background Overlay */}
          <AnimatePresence>
            {drawerOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-black z-10"
                onClick={() => setDrawerOpen(false)}
                aria-hidden="true"
              />
            )}
          </AnimatePresence>
          
          {/* Document List Drawer */}
          <AnimatePresence>
            <motion.div 
              className="fixed left-0 top-0 bottom-0 z-20 w-[80%] max-w-[320px]"
              initial={{ x: -320 }}
              animate={drawerOpen ? { x: 0 } : { x: -320 }}
              exit={{ x: -320 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              style={{ 
                display: !drawerOpen ? 'none' : 'block',
                height: '100%'
              }}
            >
              <Card className="h-full rounded-none">
                <CardContent className="p-0">
                  <DocumentList
                    documents={filteredDocuments}
                    selectedDocument={selectedDocument}
                    searchQuery={searchQuery}
                    sortDirection={sortDirection}
                    onSearch={setSearchQuery}
                    onClearSearch={clearSearch}
                    onToggleSort={toggleSort}
                    onSelectDocument={(doc) => {
                      selectDocument(doc);
                      setDrawerOpen(false);
                    }}
                    onDuplicate={duplicateDocument}
                    onDelete={confirmDeleteDocument}
                  />
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>
          
          {/* Main Content */}
          <div className="flex-grow px-4 pt-4 flex flex-col">
            {selectedDocument ? (
              <DocumentEditor
                title={title}
                content={content}
                isPreviewMode={isPreviewMode}
                saveStatus={saveStatus}
                lastSaved={lastSaved}
                versionNumber={selectedDocument.versionNumber}
                hasUnsavedChanges={documentHasUnsavedChanges}
                onTitleChange={setTitle}
                onContentChange={setContent}
                onTogglePreview={togglePreviewMode}
                onSave={saveDocument}
                onVersionHistoryClick={fetchDocumentVersions}
              />
            ) : (
              <div className="text-center py-12 flex flex-col items-center justify-center h-full">
                <div className="mb-6 text-muted-foreground">
                  <FileText className="h-16 w-16 mx-auto mb-4 opacity-20" />
                  <p className="mb-4">Select a document or create a new one</p>
                </div>
                <Button onClick={createNewDocument} variant="default" className="transition-colors">
                  <FilePlus className="mr-2 h-5 w-5" />
                  Create New Document
                </Button>
              </div>
            )}
          </div>
        </div>
      ) : (
        // Desktop layout
        <div className="flex flex-1 container max-w-screen-2xl mx-auto">
          <div className="w-80 h-full flex-shrink-0 overflow-hidden border-r">
            <DocumentList
              documents={filteredDocuments}
              selectedDocument={selectedDocument}
              searchQuery={searchQuery}
              sortDirection={sortDirection}
              onSearch={setSearchQuery}
              onClearSearch={clearSearch}
              onToggleSort={toggleSort}
              onSelectDocument={selectDocument}
              onDuplicate={duplicateDocument}
              onDelete={confirmDeleteDocument}
            />
          </div>
          
          <div className="flex-grow px-4 md:px-8 py-6 flex flex-col">
            {selectedDocument ? (
              <DocumentEditor
                title={title}
                content={content}
                isPreviewMode={isPreviewMode}
                saveStatus={saveStatus}
                lastSaved={lastSaved}
                versionNumber={selectedDocument.versionNumber}
                hasUnsavedChanges={documentHasUnsavedChanges}
                onTitleChange={setTitle}
                onContentChange={setContent}
                onTogglePreview={togglePreviewMode}
                onSave={saveDocument}
                onVersionHistoryClick={fetchDocumentVersions}
              />
            ) : (
              <div className="text-center py-12 flex flex-col items-center justify-center h-full">
                <div className="mb-6 text-muted-foreground">
                  <FileText className="h-16 w-16 mx-auto mb-4 opacity-20" />
                  <p className="mb-4">Select a document to view or edit its content</p>
                </div>
                <Button onClick={createNewDocument} variant="default" className="transition-colors">
                  <FilePlus className="mr-2 h-5 w-5" />
                  Create New Document
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Modals */}
      {/* Version History Modal */}
      <VersionHistoryModal
        open={showVersionModal}
        onOpenChange={setShowVersionModal}
        versions={documentVersions}
        viewingIndex={viewingVersionIndex}
        onChangeIndex={setViewingVersionIndex}
        onActivateVersion={activateVersion}
      />
      
      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        document={documentToDelete}
        onConfirm={deleteDocument}
      />
      
      {/* Discard Changes Dialog */}
      <DiscardChangesDialog
        open={showDiscardDialog}
        onOpenChange={(open) => !open && setShowDeleteDialog(false)}
        documentTitle={selectedDocument?.title || ''}
        onDiscard={handleDiscardChanges}
        onSaveAndSwitch={handleSaveAndSwitch}
      />
    </div>
  );
};

export default Documents; 