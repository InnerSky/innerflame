import { useState, useCallback, useEffect } from 'react';
import { Document, DocumentVersion, SaveStatus, SortDirection } from '../models/document';
import { DocumentRepository } from '../repositories/documentRepository';

export function useDocuments(userId?: string) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [documentVersions, setDocumentVersions] = useState<DocumentVersion[]>([]);
  const [viewingVersionIndex, setViewingVersionIndex] = useState(0);
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null);
  const [pendingDocument, setPendingDocument] = useState<Document | null>(null);
  
  const repository = new DocumentRepository();
  
  // Initialize documents
  useEffect(() => {
    if (userId) {
      fetchDocuments();
    }
  }, [userId]);
  
  // Update filtered documents when documents, search, or sort changes
  useEffect(() => {
    let filtered = [...documents];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(doc => 
        doc.title.toLowerCase().includes(query) || 
        (doc.content && doc.content.toLowerCase().includes(query))
      );
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      const dateA = a.updatedAt.getTime();
      const dateB = b.updatedAt.getTime();
      return sortDirection === 'desc' ? dateB - dateA : dateA - dateB;
    });
    
    setFilteredDocuments(filtered);
  }, [documents, searchQuery, sortDirection]);
  
  // Update local state when selected document changes
  useEffect(() => {
    if (selectedDocument) {
      setTitle(selectedDocument.title);
      setContent(selectedDocument.content);
    } else {
      setTitle('');
      setContent('');
    }
  }, [selectedDocument]);
  
  // Update save status when content or title changes
  useEffect(() => {
    if (selectedDocument) {
      if (title !== selectedDocument.title || content !== selectedDocument.content) {
        setSaveStatus('unsaved');
      }
    }
  }, [title, content, selectedDocument]);
  
  // Fetch documents
  const fetchDocuments = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const docs = await repository.getUserDocuments(userId);
      setDocuments(docs);
      setFilteredDocuments(docs);
      
      // Select first document if none selected
      if (docs.length > 0 && !selectedDocument) {
        setSelectedDocument(docs[0]);
      }
    } catch (err) {
      console.error('Error fetching documents:', err);
      setError('Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, [userId, selectedDocument, repository]);
  
  // Create new document
  const createNewDocument = useCallback(async () => {
    if (!userId) return;
    
    setSaveStatus('saving');
    
    try {
      const newDoc = await repository.createDocument(userId, 'Untitled Document', '');
      setDocuments(prev => [newDoc, ...prev]);
      setSelectedDocument(newDoc);
      setTitle(newDoc.title);
      setContent(newDoc.content);
      setLastSaved(new Date());
      setSaveStatus('saved');
      
      // Focus title input
      setTimeout(() => {
        const titleInput = document.querySelector('input[placeholder="Document Title"]') as HTMLInputElement;
        if (titleInput) {
          titleInput.focus();
          titleInput.select();
        }
      }, 100);
      
      return newDoc;
    } catch (err) {
      console.error('Error creating document:', err);
      setSaveStatus('error');
      setError('Failed to create document');
      return null;
    }
  }, [userId, repository]);
  
  // Save document
  const saveDocument = useCallback(async () => {
    if (!selectedDocument || !userId) return;
    
    setSaveStatus('saving');
    
    try {
      const updatedDoc = await repository.saveDocument(
        selectedDocument.id, 
        title, 
        content
      );
      
      // Update documents list
      setDocuments(prev => 
        prev.map(doc => doc.id === updatedDoc.id ? updatedDoc : doc)
      );
      
      // Update selected document
      setSelectedDocument(updatedDoc);
      
      setLastSaved(new Date());
      setSaveStatus('saved');
    } catch (err) {
      console.error('Error saving document:', err);
      setSaveStatus('error');
      setError('Failed to save document');
    }
  }, [selectedDocument, userId, title, content, repository]);
  
  // Check if there are unsaved changes
  const hasUnsavedChanges = useCallback(() => {
    return Boolean(
      selectedDocument && 
      (title !== selectedDocument.title || content !== selectedDocument.content)
    );
  }, [selectedDocument, title, content]);
  
  // Select a document
  const selectDocument = useCallback((document: Document) => {
    // If it's the same document, do nothing
    if (selectedDocument?.id === document.id) {
      return;
    }
    
    // Check if there are unsaved changes
    if (hasUnsavedChanges()) {
      setPendingDocument(document);
      setShowDiscardDialog(true);
      return;
    }
    
    // Switch to the document
    setSelectedDocument(document);
    setTitle(document.title);
    setContent(document.content);
    setPendingDocument(null);
    setSaveStatus('idle');
  }, [selectedDocument, hasUnsavedChanges]);
  
  // Handle discarding changes
  const handleDiscardChanges = useCallback(() => {
    if (pendingDocument) {
      setSelectedDocument(pendingDocument);
      setTitle(pendingDocument.title);
      setContent(pendingDocument.content);
      setPendingDocument(null);
      setSaveStatus('idle');
    }
    setShowDiscardDialog(false);
  }, [pendingDocument]);
  
  // Delete document
  const deleteDocument = useCallback(async () => {
    if (!documentToDelete) return;
    
    try {
      await repository.deleteDocument(documentToDelete.id);
      
      // Update local state
      const newDocuments = documents.filter(doc => doc.id !== documentToDelete.id);
      setDocuments(newDocuments);
      
      // If deleted document was selected, select another one
      if (selectedDocument?.id === documentToDelete.id) {
        if (newDocuments.length > 0) {
          setSelectedDocument(newDocuments[0]);
          setTitle(newDocuments[0].title);
          setContent(newDocuments[0].content);
        } else {
          setSelectedDocument(null);
          setTitle('');
          setContent('');
        }
      }
    } catch (err) {
      console.error('Error deleting document:', err);
      setError('Failed to delete document');
    } finally {
      setShowDeleteDialog(false);
      setDocumentToDelete(null);
    }
  }, [documentToDelete, selectedDocument, documents, repository]);
  
  // Confirm delete document
  const confirmDeleteDocument = useCallback((document: Document) => {
    setDocumentToDelete(document);
    setShowDeleteDialog(true);
  }, []);
  
  // Duplicate document
  const duplicateDocument = useCallback(async (document: Document) => {
    try {
      const newDoc = await repository.duplicateDocument(document.id);
      setDocuments(prev => [newDoc, ...prev]);
    } catch (err) {
      console.error('Error duplicating document:', err);
      setError('Failed to duplicate document');
    }
  }, [repository]);
  
  // Fetch document versions
  const fetchDocumentVersions = useCallback(async () => {
    if (!selectedDocument) return;
    
    try {
      const versions = await repository.getDocumentVersions(selectedDocument.id);
      setDocumentVersions(versions);
      setViewingVersionIndex(0);
      setShowVersionModal(true);
    } catch (err) {
      console.error('Error fetching document versions:', err);
      setError('Failed to load document versions');
    }
  }, [selectedDocument, repository]);
  
  // Activate a version
  const activateVersion = useCallback(async (version: DocumentVersion) => {
    try {
      const updatedDoc = await repository.activateVersion(version);
      
      // Update documents list
      setDocuments(prev => 
        prev.map(doc => doc.id === updatedDoc.id ? updatedDoc : doc)
      );
      
      // Update selected document
      setSelectedDocument(updatedDoc);
      setTitle(updatedDoc.title);
      setContent(updatedDoc.content);
      
      setLastSaved(new Date());
      setSaveStatus('saved');
      setShowVersionModal(false);
    } catch (err) {
      console.error('Error activating version:', err);
      setError('Failed to activate version');
    }
  }, [repository]);
  
  // Toggle preview mode
  const togglePreviewMode = useCallback(() => {
    setIsPreviewMode(prev => !prev);
  }, []);
  
  // Clear search query
  const clearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);
  
  // Toggle sort direction
  const toggleSort = useCallback(() => {
    setSortDirection(prev => prev === 'desc' ? 'asc' : 'desc');
  }, []);
  
  return {
    // State
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
    
    // State setters
    setTitle,
    setContent,
    setSearchQuery,
    setViewingVersionIndex,
    setShowVersionModal,
    setShowDeleteDialog,
    
    // Operations
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
  };
} 