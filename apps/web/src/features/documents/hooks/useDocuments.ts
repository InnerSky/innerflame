import { useState, useCallback, useEffect, useRef } from 'react';
import { Document, DocumentVersion, SaveStatus, SortDirection, DocumentType, ContentFormat } from '../models/document';
import { DocumentRepository } from '../repositories/documentRepository';
import { supabase } from '@/lib/supabase';
import { DocumentService } from '../services/documentService';

// Note: 'userId' parameter is used with methods that expect a userId string,
// while Document objects have a 'user_id' property (from Supabase Tables)
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
  
  // New state for document type and content format
  const [documentType, setDocumentType] = useState<DocumentType>(DocumentType.UserDocument);
  const [contentFormat, setContentFormat] = useState<ContentFormat>(ContentFormat.Markdown);
  
  // New state for project selection
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [projectDocuments, setProjectDocuments] = useState<Document[]>([]);
  
  // Reference for autosave timeout
  const autosaveTimeoutRef = useRef<number | null>(null);
  
  const repository = new DocumentRepository();
  
  // Initialize documents
  useEffect(() => {
    if (userId) {
      fetchDocuments();
    }
  }, [userId]);
  
  // Fetch documents when selected project changes
  useEffect(() => {
    if (userId && selectedProjectId) {
      fetchDocumentsByProject();
    } else if (userId) {
      fetchDocuments();
    }
  }, [userId, selectedProjectId]);
  
  // Update filtered documents when documents, search, or sort changes
  useEffect(() => {
    // Determine which document set to use based on project selection
    const docsToFilter = selectedProjectId ? projectDocuments : documents;
    let filtered = [...docsToFilter];
    
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
  }, [documents, projectDocuments, selectedProjectId, searchQuery, sortDirection]);
  
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
      } else {
        // If content is identical to the original, reset save status
        setSaveStatus(lastSaved ? 'saved' : 'idle');
      }
    }
  }, [title, content, selectedDocument, lastSaved]);
  
  // Fetch documents
  const fetchDocuments = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const docs = await repository.getUserDocuments(userId);
      setDocuments(docs);
      setFilteredDocuments(docs);
      
      // No longer auto-selecting the first document on general fetch
      // if (docs.length > 0 && !selectedDocument) {
      //   setSelectedDocument(docs[0]);
      // }
    } catch (err) {
      console.error('Error fetching documents:', err);
      setError('Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, [userId, selectedDocument, repository]);
  
  // Fetch documents for a specific project
  const fetchDocumentsByProject = useCallback(async () => {
    if (!userId || !selectedProjectId) {
      // If no project is selected, clear project documents
      setProjectDocuments([]);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // First check if the project still exists
      const repository = new DocumentRepository();
      const projects = await repository.getUserProjectsOnly(userId);
      const projectExists = projects.some(p => p.id === selectedProjectId);
      
      if (!projectExists) {
        // If project doesn't exist anymore, reset to showing all documents
        console.log('Project no longer exists, reverting to all documents');
        setSelectedProjectId(null);
        setProjectDocuments([]);
        
        // Instead of calling fetchDocuments directly, duplicate its functionality here
        const allDocs = await repository.getUserDocuments(userId);
        setDocuments(allDocs);
        setFilteredDocuments(allDocs);
        
        return;
      }
      
      // Fetch documents for the selected project
      let docs;
      try {
        // Get documents for the selected project
        docs = await repository.getDocumentsByProject(userId, selectedProjectId);
      } catch (error: any) {
        console.error('Error fetching project documents:', error);
        throw new Error(`Failed to load project documents: ${error.message || 'Unknown error'}`);
      }
      
      // Set project documents even if empty
      setProjectDocuments(docs);
      
      // Handle case where no documents are found
      if (docs.length === 0) {
        // If we were viewing a document that's not in this project, clear selection
        if (selectedDocument) {
          setSelectedDocument(null);
          setTitle('');
          setContent('');
        }
      } else if (selectedDocument && !docs.some(d => d.id === selectedDocument.id)) {
        // If current selection is not in this project, clear selection
        setSelectedDocument(null);
        setTitle('');
        setContent('');
      }
    } catch (err) {
      console.error('Error in fetchDocumentsByProject:', err);
      setError('Error loading documents');
    } finally {
      setLoading(false);
    }
  }, [userId, selectedProjectId, selectedDocument]);
  
  // Set up real-time subscription to documents
  useEffect(() => {
    if (!userId) return;
    
    // Subscribe to all changes on the entities table for this user
    const subscription = supabase
      .channel('documents-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'entities',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          // When any change happens, refresh the appropriate documents list
          if (selectedProjectId) {
            fetchDocumentsByProject();
          } else {
            fetchDocuments();
          }
        }
      )
      .subscribe();
    
    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [userId, selectedProjectId, fetchDocuments, fetchDocumentsByProject]);
  
  // Create new document
  const createNewDocument = useCallback(async () => {
    if (!userId) return;
    
    setSaveStatus('saving');
    
    try {
      // Create document with default metadata including content format
      const metadata: any = {
        contentFormat: ContentFormat.Markdown
      };
      
      // Add project ID to metadata if we're in a project
      if (selectedProjectId) {
        metadata.projectId = selectedProjectId;
      }
      
      const newDoc = await repository.createDocument(
        userId, 
        'Untitled Document', 
        '', 
        documentType,
        metadata
      );
      
      // Add to documents list
      if (selectedProjectId) {
        setProjectDocuments(prev => [newDoc, ...prev]);
      } else {
        setDocuments(prev => [newDoc, ...prev]);
      }
      
      setSelectedDocument(newDoc);
      setTitle(newDoc.title);
      setContent(newDoc.content);
      setContentFormat(ContentFormat.Markdown);
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
      console.error('Error creating new document:', err);
      setSaveStatus('error');
      setError('Failed to create new document');
      return null;
    }
  }, [userId, documentType, selectedProjectId, repository]);
  
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
      
      // Update documents list and filtered documents
      setDocuments(prev => 
        prev.map(doc => doc.id === updatedDoc.id ? updatedDoc : doc)
      );
      
      setFilteredDocuments(prev => 
        prev.map(doc => doc.id === updatedDoc.id ? updatedDoc : doc)
      );
      
      // If we're viewing a project, update project documents too
      if (selectedProjectId) {
        setProjectDocuments(prev => 
          prev.map(doc => doc.id === updatedDoc.id ? updatedDoc : doc)
        );
      }
      
      // Update selected document
      setSelectedDocument(updatedDoc);
      
      // Update save status
      setLastSaved(new Date());
      setSaveStatus('saved');
    } catch (error) {
      console.error('Error saving document:', error);
      setSaveStatus('error');
    }
  }, [selectedDocument, userId, title, content, selectedProjectId, repository]);
  
  // Setup autosave when content or title changes
  useEffect(() => {
    if (!selectedDocument) return;
    
    // Clear any existing timeout
    if (autosaveTimeoutRef.current) {
      window.clearTimeout(autosaveTimeoutRef.current);
      autosaveTimeoutRef.current = null;
    }
    
    if (title !== selectedDocument.title || content !== selectedDocument.content) {
      // Set a new timeout to autosave after 30 seconds of inactivity
      autosaveTimeoutRef.current = window.setTimeout(() => {
        if (saveStatus === 'unsaved') {
          saveDocument();
        }
      }, 30000); // 30 seconds
    }
    
    // Cleanup function
    return () => {
      if (autosaveTimeoutRef.current) {
        window.clearTimeout(autosaveTimeoutRef.current);
      }
    };
  }, [title, content, selectedDocument, saveStatus, saveDocument]);
  
  // Check if there are unsaved changes
  const hasUnsavedChanges = useCallback(() => {
    return Boolean(
      selectedDocument && 
      (title !== selectedDocument.title || content !== selectedDocument.content)
    );
  }, [selectedDocument, title, content]);
  
  // Select a document
  const selectDocument = useCallback((document: Document) => {
    // Check if it's the same document with the same version
    if (selectedDocument?.id === document.id && 
        selectedDocument?.versionNumber === document.versionNumber) {
      // If same document and same version, do nothing
      return;
    }
    
    // If same document but different version, update without checking for unsaved changes
    if (selectedDocument?.id === document.id && 
        selectedDocument?.versionNumber !== document.versionNumber) {
      console.log(`Refreshing document ${document.id} from version ${selectedDocument?.versionNumber} to ${document.versionNumber}`);
      
      // Switch to the new version
      setSelectedDocument(document);
      setTitle(document.title);
      setContent(document.content);
      setDocumentType(document.entityType);
      
      // Set content format from metadata if it exists, or default to Markdown
      const format = document.metadata?.contentFormat || ContentFormat.Markdown;
      setContentFormat(format);
      
      setPendingDocument(null);
      setSaveStatus('idle');
      setLastSaved(null);
      return;
    }
    
    // Different document, check if there are unsaved changes
    if (hasUnsavedChanges()) {
      setPendingDocument(document);
      setShowDiscardDialog(true);
      return;
    }
    
    // Switch to the document
    setSelectedDocument(document);
    setTitle(document.title);
    setContent(document.content);
    setDocumentType(document.entityType);
    
    // Set content format from metadata if it exists, or default to Markdown
    const format = document.metadata?.contentFormat || ContentFormat.Markdown;
    setContentFormat(format);
    
    setPendingDocument(null);
    setSaveStatus('idle');
    setLastSaved(null);
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
      const documentService = DocumentService.getInstance();
      await documentService.deleteDocument(documentToDelete.id, {
        userId: userId || undefined,
        cascadeRelated: true
      });
      
      // Update all document lists
      const newDocuments = documents.filter(doc => doc.id !== documentToDelete.id);
      setDocuments(newDocuments);
      setFilteredDocuments(prev => prev.filter(doc => doc.id !== documentToDelete.id));
      
      // Update project documents if applicable
      if (selectedProjectId) {
        setProjectDocuments(prev => prev.filter(doc => doc.id !== documentToDelete.id));
      }
      
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
  }, [documentToDelete, selectedDocument, documents, userId, selectedProjectId]);
  
  // Confirm delete document
  const confirmDeleteDocument = useCallback((document: Document) => {
    setDocumentToDelete(document);
    setShowDeleteDialog(true);
  }, []);
  
  // Duplicate document
  const duplicateDocument = useCallback(async (document: Document) => {
    try {
      const newDoc = await repository.duplicateDocument(document.id);
      
      // Update the appropriate document lists
      setDocuments(prev => [newDoc, ...prev]);
      
      // Also update filtered documents to show the new document
      setFilteredDocuments(prev => [newDoc, ...prev]);
      
      // If we're in a project and this document belongs to it, add to project documents
      if (selectedProjectId && newDoc.metadata?.projectId === selectedProjectId) {
        setProjectDocuments(prev => [newDoc, ...prev]);
      }
    } catch (err) {
      console.error('Error duplicating document:', err);
      setError('Failed to duplicate document');
    }
  }, [repository, selectedProjectId]);
  
  // Fetch document versions
  const fetchDocumentVersions = useCallback(async (documentId: string) => {
    if (!selectedDocument) return;
    
    try {
      const versions = await repository.getDocumentVersions(documentId);
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
  }, [repository, setDocuments, setSelectedDocument, setTitle, setContent, setLastSaved, setSaveStatus, setShowVersionModal, setError]);
  
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
  
  // Update document type
  const updateDocumentType = useCallback(async (newType: DocumentType) => {
    if (!selectedDocument || !userId) return;
    
    setSaveStatus('saving');
    
    try {
      const updatedDoc = await repository.updateDocumentType(
        selectedDocument.id,
        newType
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
      console.error('Error updating document type:', err);
      setSaveStatus('error');
      setError('Failed to update document type');
    }
  }, [selectedDocument, userId, repository]);
  
  // Add method to update content format
  const updateContentFormat = useCallback(async (format: ContentFormat) => {
    if (!selectedDocument || !userId || !selectedDocument.id) return;
    
    setSaveStatus('saving');
    
    try {
      // Get existing metadata or create empty object
      const metadata = selectedDocument.metadata || {};
      
      // Update with new format
      const updatedMetadata = {
        ...metadata,
        contentFormat: format
      };
      
      // Update metadata via repository
      const updatedDoc = await repository.updateDocumentMetadata(
        selectedDocument.id,
        updatedMetadata
      );
      
      // Update selected document
      setSelectedDocument(updatedDoc);
      setContentFormat(format);
      
      // Update in documents list
      setDocuments(prev => 
        prev.map(doc => doc.id === updatedDoc.id ? updatedDoc : doc)
      );
      
      setLastSaved(new Date());
      setSaveStatus('saved');
    } catch (error) {
      console.error('Error updating content format:', error);
      setSaveStatus('error');
    }
  }, [selectedDocument, userId, repository]);
  
  // Select a project
  const selectProject = useCallback(async (projectId: string | null) => {
    // Always clear selected document when switching projects,
    // even if switching to the same project (to force project-only view)
    setSelectedDocument(null);
    setTitle('');
    setContent('');
    setSaveStatus('idle');
    setLastSaved(null);
    
    // Only change the project ID if it's different
    if (selectedProjectId !== projectId) {
      // Set the new project ID
      setSelectedProjectId(projectId);
      
      // If clearing project, ensure we clear project-specific documents
      if (!projectId) {
        setProjectDocuments([]);
      }
    }
  }, [selectedProjectId]);
  
  // Create a new project
  const createNewProject = useCallback(async (title: string = 'New Project', content: string = '') => {
    if (!userId) return;
    
    setSaveStatus('saving');
    
    try {
      const newProject = await repository.createProject(userId, title);
      
      // Save the content if provided
      if (content.trim() && newProject) {
        await repository.saveDocument(newProject.id, title, content);
      }
      
      // Select the new project
      setSelectedProjectId(newProject.id);
      
      setLastSaved(new Date());
      setSaveStatus('saved');
      
      return newProject;
    } catch (err) {
      console.error('Error creating new project:', err);
      setSaveStatus('error');
      setError('Failed to create new project');
      return null;
    }
  }, [userId, repository]);
  
  // Set document project
  const setDocumentProject = useCallback(async (documentId: string, projectId: string | null) => {
    if (!userId) return;
    
    setSaveStatus('saving');
    
    try {
      const updatedDoc = await repository.setDocumentProject(documentId, projectId);
      
      // Update documents lists based on current view and new assignment
      if (selectedProjectId) {
        // We're currently viewing a specific project
        if (projectId === selectedProjectId) {
          // Document was assigned to the current project - add to project documents
          setProjectDocuments(prev => [updatedDoc, ...prev.filter(d => d.id !== documentId)]);
        } else {
          // Document was assigned to a different project - remove from current project view
          setProjectDocuments(prev => prev.filter(d => d.id !== documentId));
        }
      } else {
        // We're viewing all documents
        // Update the document in the all-documents list
        setDocuments(prev => prev.map(d => d.id === documentId ? updatedDoc : d));
      }
      
      // Update selected document if it's the one being modified
      if (selectedDocument?.id === documentId) {
        setSelectedDocument(updatedDoc);
      }
      
      // After document changes project, refresh the lists to make sure they're correct
      if (selectedProjectId) {
        fetchDocumentsByProject();
      } else {
        fetchDocuments();
      }
      
      setLastSaved(new Date());
      setSaveStatus('saved');
      return updatedDoc;
    } catch (err) {
      console.error('Error setting document project:', err);
      setSaveStatus('error');
      setError('Failed to update document project');
      return null;
    }
  }, [userId, selectedProjectId, selectedDocument, repository, fetchDocuments, fetchDocumentsByProject]);
  
  return {
    // State
    documents,
    filteredDocuments,
    selectedDocument,
    documentVersions,
    viewingVersionIndex,
    title,
    content,
    isPreviewMode,
    lastSaved,
    saveStatus,
    loading,
    error,
    searchQuery,
    sortDirection,
    showVersionModal,
    showDeleteDialog,
    showDiscardDialog,
    documentToDelete,
    documentType,
    contentFormat,
    selectedProjectId,
    projectDocuments,
    
    // State setters
    setTitle,
    setContent,
    setSearchQuery,
    setViewingVersionIndex,
    setShowVersionModal,
    setShowDeleteDialog,
    setShowDiscardDialog,
    setDocumentType,
    setContentFormat,
    setSelectedProjectId,
    setProjectDocuments,
    
    // Operations
    fetchDocuments,
    fetchDocumentsByProject,
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
    hasUnsavedChanges,
    updateDocumentType,
    updateContentFormat,
    selectProject,
    createNewProject,
    setDocumentProject
  };
} 