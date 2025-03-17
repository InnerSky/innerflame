import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Spinner } from '@/components/Spinner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { ThemeToggle } from '@/components/ThemeToggle';
import { MarkdownRenderer } from '@/components/markdown-renderer';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertCircle, 
  FilePlus, 
  Save, 
  Search, 
  Clock, 
  CheckCircle2, 
  Filter, 
  SortDesc, 
  SortAsc,
  Trash2,
  ChevronDown,
  ChevronUp,
  X,
  Edit,
  Menu,
  List,
  FileText,
  Copy,
  MoreHorizontal,
  Plus,
  Home,
  Eye,
  FileEdit,
  ChevronLeft,
  ChevronRight,
  History,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

// Define the Document type
interface Document {
  id: string;
  title: string;
  content: string | null;
  entity_type: string;
  created_at: string | null;
  updated_at: string | null;
  user_id: string;
  metadata?: any;
  current_version_id?: string;
  version_number?: number;
}

// Interface for entity version
interface EntityVersion {
  id: string;
  entity_id: string;
  entity_type: string;
  version_number: number;
  full_content: any; // Using any for Json type to simplify
  created_at: string | null;
  is_current: boolean | null;
  version_type: string;
  base_version_id: string | null;
  significance: string | null;
  user_label: string | null;
  changes: any | null;
  created_by_message_id: string | null;
}

// Status indicator for saving
type SaveStatus = 'idle' | 'unsaved' | 'saving' | 'saved' | 'error';

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
    
    // Add listener for changes
    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', updateMatches);
      return () => mediaQuery.removeEventListener('change', updateMatches);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(updateMatches);
      return () => mediaQuery.removeListener(updateMatches);
    }
  }, [query]);
  
  return matches;
};

const UserDocuments = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [pendingDocument, setPendingDocument] = useState<Document | null>(null);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const saveTimeoutRef = useRef<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  // Version control state
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [documentVersions, setDocumentVersions] = useState<EntityVersion[]>([]);
  const [viewingVersionIndex, setViewingVersionIndex] = useState(0);

  // Close drawer when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (e: Event) => {
      if (isMobile && drawerOpen) {
        const drawer = document.getElementById('document-list-drawer');
        const drawerToggle = document.getElementById('drawer-toggle-button');
        const target = e.target as Node;
        
        // Check if the click is on a dropdown menu or dialog or their children
        const isExcludedClick = (node: Node | null): boolean => {
          if (!node) return false;
          if (node.nodeName === 'BODY') return false;
          
          // Check if the node or its parent has dropdown or dialog related classes
          const element = node as HTMLElement;
          if (
            element.classList?.contains('dropdown-trigger') || 
            element.classList?.contains('dropdown-content') ||
            element.closest('[data-radix-popper-content-wrapper]') ||
            element.closest('[role="dialog"]') ||
            element.getAttribute('data-state') === 'open' ||
            element.classList?.contains('delete-dialog')
          ) {
            return true;
          }
          
          return isExcludedClick(node.parentNode);
        };
        
        // Don't close drawer if clicking on dropdown or dialog elements
        if (isExcludedClick(target)) {
          return;
        }
        
        if (drawer && !drawer.contains(target) && 
            drawerToggle && !drawerToggle.contains(target)) {
          setDrawerOpen(false);
        }
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isMobile, drawerOpen]);

  // Check authentication
  useEffect(() => {
    if (!user) {
      navigate('/');
    }
  }, [user, navigate]);

  // Load user documents
  useEffect(() => {
    const fetchDocuments = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        // First, fetch all entities of type user_document
        const { data: entitiesData, error: entitiesError } = await supabase
          .from('entities')
          .select('*')
          .eq('user_id', user.id)
          .eq('entity_type', 'user_document')
          .order('updated_at', { ascending: false });
          
        if (entitiesError) throw entitiesError;
        
        if (!entitiesData || entitiesData.length === 0) {
          setDocuments([]);
          setFilteredDocuments([]);
          setLoading(false);
          return;
        }

        // Get the latest version for each entity
        const entityIds = entitiesData.map(entity => entity.id);
        
        const { data: versionsData, error: versionsError } = await supabase
          .from('entity_versions')
          .select('*')
          .in('entity_id', entityIds)
          .eq('is_current', true);
          
        if (versionsError) throw versionsError;
        
        // Create a map of entity_id -> current version
        const versionMap = new Map();
        versionsData?.forEach(version => {
          versionMap.set(version.entity_id, version);
        });
        
        // Combine entity data with their latest versions
        const documentsWithVersions = entitiesData.map(entity => {
          const version = versionMap.get(entity.id);
          
          // Use our helper function to extract content
          const versionContent = version ? extractContent(version.full_content) : 
            { title: entity.title, content: null };
            
          return {
            ...entity,
            // Use version content if available, otherwise fallback to entity
            content: versionContent.content,
            current_version_id: version?.id,
            version_number: version?.version_number,
          };
        });
        
        setDocuments(documentsWithVersions);
        setFilteredDocuments(documentsWithVersions);
        
        if (documentsWithVersions.length > 0) {
          const firstDoc = documentsWithVersions[0];
          setSelectedDocument(firstDoc);
          setTitle(firstDoc.title);
          setContent(firstDoc.content || '');
        }
      } catch (err) {
        console.error('Error fetching documents:', err);
        toast.error('Error', {
          description: 'Failed to load documents',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [user]);

  // Search and filtering effect
  useEffect(() => {
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      const filtered = documents.filter(doc => 
        doc.title.toLowerCase().includes(lowerQuery) || 
        (doc.content && doc.content.toLowerCase().includes(lowerQuery))
      );
      setFilteredDocuments(filtered);
    } else {
      setFilteredDocuments([...documents]);
    }
    
    // Apply sorting
    setFilteredDocuments(prev => {
      return [...prev].sort((a, b) => {
        const dateA = new Date(a.updated_at || '').getTime();
        const dateB = new Date(b.updated_at || '').getTime();
        return sortDirection === 'desc' ? dateB - dateA : dateA - dateB;
      });
    });
  }, [searchQuery, documents, sortDirection]);

  // Auto-save functionality
  useEffect(() => {
    if (selectedDocument && (title !== selectedDocument.title || content !== (selectedDocument.content || ''))) {
      // Show unsaved changes indicator
      setSaveStatus('unsaved');
      
      // Clear any existing timeout
      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current);
      }

      // Set a new timeout to save after 30 seconds of inactivity
      saveTimeoutRef.current = window.setTimeout(() => {
        saveDocument();
      }, 30000); // 30 seconds
    }

    return () => {
      // Clean up timeout on component unmount
      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [title, content, selectedDocument]);

  // Reset save status after 3 seconds
  useEffect(() => {
    if (saveStatus === 'saved' || saveStatus === 'error') {
      const timer = setTimeout(() => {
        setSaveStatus('idle');
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [saveStatus]);
  
  // Close drawer when selecting a document on mobile
  useEffect(() => {
    if (isMobile && drawerOpen && selectedDocument) {
      setDrawerOpen(false);
    }
  }, [selectedDocument, isMobile]);

  // Helper function to check if there are unsaved changes
  const hasUnsavedChanges = (): boolean => {
    return Boolean(selectedDocument && 
      (title !== selectedDocument.title || content !== (selectedDocument.content || '')));
  };

  const createNewDocument = async () => {
    if (!user) return;

    setSaveStatus('saving');
    try {
      // Step 1: Create the entity entry
      const newEntity = {
        user_id: user.id,
        title: 'Untitled Document', // We still store title in the entity for quick access
        content: null, // No longer store content here
        entity_type: 'user_document',
      };

      const { data: entityData, error: entityError } = await supabase
        .from('entities')
        .insert(newEntity)
        .select()
        .single();

      if (entityError) throw entityError;

      // Step 2: Create the initial version (version 1)
      const initialVersion = {
        entity_id: entityData.id,
        entity_type: 'user_document',
        version_number: 1,
        full_content: {
          title: 'Untitled Document',
          content: '',
        },
        version_type: 'initial',
        is_current: true,
      };

      const { data: versionData, error: versionError } = await supabase
        .from('entity_versions')
        .insert(initialVersion)
        .select()
        .single();

      if (versionError) throw versionError;

      // Combine entity and version data for our Document interface
      const newDocument: Document = {
        ...entityData,
        content: '',  // Directly use empty string rather than trying to extract from versionData
        current_version_id: versionData.id,
        version_number: versionData.version_number,
      };

      setDocuments([newDocument, ...documents]);
      setFilteredDocuments([newDocument, ...filteredDocuments]);
      setSelectedDocument(newDocument);
      setTitle(newDocument.title);
      setContent(newDocument.content || '');
      setLastSaved(new Date());
      setSaveStatus('saved');
      toast.success('Document created', {
        description: 'New document created successfully',
      });
      
      // Focus the title input for immediate editing
      setTimeout(() => {
        const titleInput = document.querySelector('input[placeholder="Document Title"]') as HTMLInputElement;
        if (titleInput) {
          titleInput.focus();
          titleInput.select();
        }
      }, 100);
      
    } catch (err) {
      console.error('Error creating document:', err);
      setSaveStatus('error');
      toast.error('Error', {
        description: 'Failed to create document',
      });
    }
  };

  // Helper function to safely extract content from full_content
  const extractContent = (fullContent: any): { title: string, content: string | null } => {
    if (!fullContent) return { title: '', content: null };
    
    // If it's a string (serialized JSON), parse it
    if (typeof fullContent === 'string') {
      try {
        return JSON.parse(fullContent);
      } catch (e) {
        console.error('Error parsing full_content:', e);
        return { title: '', content: null };
      }
    }
    
    // If it's already an object, return it
    if (typeof fullContent === 'object') {
      return {
        title: fullContent.title || '',
        content: fullContent.content || null
      };
    }
    
    return { title: '', content: null };
  };

  const saveDocument = async () => {
    if (!selectedDocument || !user) return Promise.resolve();

    setSaveStatus('saving');
    try {
      const currentTime = new Date().toISOString();
      
      // Step 1: Update the basic entity info
      const entityUpdates = {
        title, // Still update title in the entity for quick access
        updated_at: currentTime,
      };

      const { error: entityError } = await supabase
        .from('entities')
        .update(entityUpdates)
        .eq('id', selectedDocument.id);

      if (entityError) throw entityError;

      // Step 2: Create a new version
      const newVersionNumber = (selectedDocument.version_number || 1) + 1;
      
      const newVersion = {
        entity_id: selectedDocument.id,
        entity_type: selectedDocument.entity_type,
        version_number: newVersionNumber,
        full_content: {
          title,
          content,
        },
        version_type: 'update',
        is_current: true,
        base_version_id: selectedDocument.current_version_id,
        created_at: currentTime,
      };

      // Step 2.1: Mark previous version as not current
      if (selectedDocument.current_version_id) {
        const { error: updateError } = await supabase
          .from('entity_versions')
          .update({ is_current: false })
          .eq('id', selectedDocument.current_version_id);
          
        if (updateError) throw updateError;
      }

      // Step 2.2: Create the new version
      const { data: versionData, error: versionError } = await supabase
        .from('entity_versions')
        .insert(newVersion)
        .select()
        .single();

      if (versionError) throw versionError;

      // Update local document state
      const updatedDocument = { 
        ...selectedDocument, 
        title,
        content,
        updated_at: currentTime,
        current_version_id: versionData.id,
        version_number: newVersionNumber
      };
      
      setSelectedDocument(updatedDocument);
      
      // Update documents in both lists
      const updateDocInList = (list: Document[]) => {
        return list.map((doc) => (doc.id === selectedDocument.id ? updatedDocument : doc));
      };
      
      setDocuments(updateDocInList(documents));
      setFilteredDocuments(updateDocInList(filteredDocuments));
      
      setLastSaved(new Date());
      setSaveStatus('saved');
      toast.success('Document saved', {
        description: 'Your document has been saved successfully',
      });
      
      return Promise.resolve();
    } catch (err) {
      console.error('Error saving document:', err);
      setSaveStatus('error');
      toast.error('Error', {
        description: 'Failed to save document',
      });
      
      return Promise.reject(err);
    }
  };

  const selectDocument = (document: Document) => {
    // If it's the same document, do nothing (no reloading necessary)
    if (selectedDocument?.id === document.id) {
      return;
    }
    
    // Check if there are unsaved changes in the current document
    if (hasUnsavedChanges()) {
      // Store the document we want to switch to
      setPendingDocument(document);
      // Show the confirmation dialog
      setShowDiscardDialog(true);
      return;
    }

    // Otherwise switch to the new document
    switchToDocument(document);
  };

  // Function to switch to a document after any confirmation
  const switchToDocument = (document: Document) => {
    setSelectedDocument(document);
    setTitle(document.title);
    setContent(document.content || '');
    setPendingDocument(null);
    setSaveStatus('idle'); // Reset save status when switching documents
  };
  
  // Function to handle discarding changes and switching document
  const handleDiscardChanges = () => {
    if (pendingDocument) {
      switchToDocument(pendingDocument);
    }
    setShowDiscardDialog(false);
  };
  
  const confirmDeleteDocument = (document: Document, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation(); // Prevent selecting the document when clicking delete
      if (event.nativeEvent) {
        event.nativeEvent.stopImmediatePropagation(); // Prevent drawer from closing
      }
    }
    setDocumentToDelete(document);
    setShowDeleteDialog(true);
  };
  
  const deleteDocument = async () => {
    if (!documentToDelete) return;
    
    try {
      // Delete all versions first
      const { error: versionsError } = await supabase
        .from('entity_versions')
        .delete()
        .eq('entity_id', documentToDelete.id);
        
      if (versionsError) throw versionsError;
      
      // Then delete the entity
      const { error: entityError } = await supabase
        .from('entities')
        .delete()
        .eq('id', documentToDelete.id);
        
      if (entityError) throw entityError;
      
      // Remove from lists
      const newDocuments = documents.filter(doc => doc.id !== documentToDelete.id);
      const newFilteredDocuments = filteredDocuments.filter(doc => doc.id !== documentToDelete.id);
      
      setDocuments(newDocuments);
      setFilteredDocuments(newFilteredDocuments);
      
      // If we deleted the selected document, select another one
      if (selectedDocument?.id === documentToDelete.id) {
        if (newDocuments.length > 0) {
          setSelectedDocument(newDocuments[0]);
          setTitle(newDocuments[0].title);
          setContent(newDocuments[0].content || '');
          
          // Only close the drawer on mobile if we're switching documents 
          // and the deleted document was previously selected
          if (isMobile) {
            // Keep the drawer open
          }
        } else {
          setSelectedDocument(null);
          setTitle('');
          setContent('');
        }
      }
      
      toast.success('Document deleted', {
        description: 'The document has been deleted successfully',
      });
      
    } catch (err) {
      console.error('Error deleting document:', err);
      toast.error('Error', {
        description: 'Failed to delete document',
      });
    } finally {
      setShowDeleteDialog(false);
      setDocumentToDelete(null);
    }
  };
  
  const clearSearch = () => {
    setSearchQuery('');
  };
  
  const toggleSort = () => {
    setSortDirection(prev => prev === 'desc' ? 'asc' : 'desc');
  };
  
  const toggleDrawer = () => {
    setDrawerOpen(prev => !prev);
  };
  
  const duplicateDocument = async (document: Document, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
      if (event.nativeEvent) {
        event.nativeEvent.stopImmediatePropagation();
      }
    }
    
    if (!user) return;
    
    try {
      // Step 1: Create a duplicate entity
      const newEntity = {
        user_id: user.id,
        title: `${document.title} (Copy)`,
        content: null, // No longer store content here
        entity_type: document.entity_type,
      };
      
      const { data: entityData, error: entityError } = await supabase
        .from('entities')
        .insert(newEntity)
        .select()
        .single();
        
      if (entityError) throw entityError;
      
      // Step 2: Create the initial version of the duplicate
      const initialVersion = {
        entity_id: entityData.id,
        entity_type: document.entity_type,
        version_number: 1,
        full_content: {
          title: `${document.title} (Copy)`,
          content: document.content,
        },
        version_type: 'initial',
        is_current: true,
      };
      
      const { data: versionData, error: versionError } = await supabase
        .from('entity_versions')
        .insert(initialVersion)
        .select()
        .single();
        
      if (versionError) throw versionError;
      
      // Create the new document object
      const newDocument: Document = {
        ...entityData,
        content: document.content,
        current_version_id: versionData.id,
        version_number: 1,
      };
      
      setDocuments([newDocument, ...documents]);
      setFilteredDocuments([newDocument, ...filteredDocuments]);
      
      toast.success('Document duplicated', {
        description: 'Document has been duplicated successfully',
      });
      
    } catch (err) {
      console.error('Error duplicating document:', err);
      toast.error('Error', {
        description: 'Failed to duplicate document',
      });
    }
  };
  
  const renderSaveStatus = () => {
    switch (saveStatus) {
      case 'unsaved':
        return null;
      case 'saving':
        return (
          <div className="flex items-center text-xs text-amber-500">
            <Clock className="mr-1 h-3 w-3" />
            Saving...
          </div>
        );
      case 'saved':
        return (
          <div className="flex items-center text-xs text-green-500">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Saved
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center text-xs text-red-500">
            <AlertCircle className="mr-1 h-3 w-3" />
            Error saving
          </div>
        );
      default:
        return lastSaved ? (
          <div className="flex items-center text-xs text-muted-foreground">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Up to date
          </div>
        ) : null;
    }
  };

  // Navigate to the home page
  const goToHome = () => {
    navigate('/');
  };

  // Toggle markdown preview mode
  const togglePreviewMode = () => {
    setIsPreviewMode(!isPreviewMode);
  };

  // Helper function to count words in mixed language text
  const countWords = (text: string | null): number => {
    if (!text) return 0;
    
    // First, extract all CJK (Chinese, Japanese, Korean) characters
    // This regex matches CJK Unified Ideographs (Chinese characters)
    const cjkPattern = /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff\u3300-\u33ff\ufe30-\ufe4f\uf900-\ufaff\uff00-\uffef\u2e80-\u2eff\u3000-\u303f\u31c0-\u31ef\u3200-\u32ff]/g;
    
    // Extract CJK characters and count them individually
    const cjkMatches = text.match(cjkPattern) || [];
    const cjkCount = cjkMatches.length;
    
    // Remove CJK characters and count remaining words (western text)
    const westernText = text.replace(cjkPattern, '');
    const westernWords = westernText.split(/\s+/).filter(Boolean).length;
    
    // Total word count is CJK characters plus western words
    return cjkCount + westernWords;
  };

  // Function to fetch all versions of a document
  const fetchDocumentVersions = async () => {
    if (!selectedDocument) return;
    
    try {
      const { data, error } = await supabase
        .from('entity_versions')
        .select('*')
        .eq('entity_id', selectedDocument.id)
        .order('version_number', { ascending: false });
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        setDocumentVersions(data);
        // Set viewing index to the current version (should be index 0 if sorted desc)
        setViewingVersionIndex(0);
      } else {
        setDocumentVersions([]);
      }
      
      setShowVersionModal(true);
    } catch (err) {
      console.error('Error fetching document versions:', err);
      toast.error('Error', {
        description: 'Failed to load document versions',
      });
    }
  };

  // Function to activate a historical version
  const activateVersion = async (version: EntityVersion) => {
    if (!selectedDocument || !user) return;
    
    setSaveStatus('saving');
    try {
      const currentTime = new Date().toISOString();
      
      // Extract content from the selected version
      const versionContent = extractContent(version.full_content);
      
      // Create a new version based on the historical content
      const newVersionNumber = (selectedDocument.version_number || 1) + 1;
      
      const newVersion = {
        entity_id: selectedDocument.id,
        entity_type: selectedDocument.entity_type,
        version_number: newVersionNumber,
        full_content: {
          title: versionContent.title || title,
          content: versionContent.content,
        },
        version_type: 'restore',
        is_current: true,
        base_version_id: version.id, // Reference the version we're restoring from
        created_at: currentTime,
      };

      // Mark all versions as not current
      const { error: updateError } = await supabase
        .from('entity_versions')
        .update({ is_current: false })
        .eq('entity_id', selectedDocument.id);
        
      if (updateError) throw updateError;

      // Create the new version
      const { data: versionData, error: versionError } = await supabase
        .from('entity_versions')
        .insert(newVersion)
        .select()
        .single();

      if (versionError) throw versionError;

      // Update entity with new title and timestamp
      const { error: entityError } = await supabase
        .from('entities')
        .update({
          title: versionContent.title || title,
          updated_at: currentTime,
        })
        .eq('id', selectedDocument.id);

      if (entityError) throw entityError;

      // Update local document state
      const updatedDocument = { 
        ...selectedDocument, 
        title: versionContent.title || title,
        content: versionContent.content,
        updated_at: currentTime,
        current_version_id: versionData.id,
        version_number: newVersionNumber
      };
      
      setSelectedDocument(updatedDocument);
      setTitle(updatedDocument.title);
      setContent(updatedDocument.content || '');
      
      // Update documents in both lists
      const updateDocInList = (list: Document[]) => {
        return list.map((doc) => (doc.id === selectedDocument.id ? updatedDocument : doc));
      };
      
      setDocuments(updateDocInList(documents));
      setFilteredDocuments(updateDocInList(filteredDocuments));
      
      setLastSaved(new Date());
      setSaveStatus('saved');
      setShowVersionModal(false);
      
      toast.success('Version restored', {
        description: `Document restored to content from version ${version.version_number}`,
      });
      
    } catch (err) {
      console.error('Error restoring version:', err);
      setSaveStatus('error');
      toast.error('Error', {
        description: 'Failed to restore version',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
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
    <div className="flex flex-col h-screen">
      {/* Top navigation */}
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
          <Button 
            variant="ghost" 
            className="mr-2" 
            onClick={goToHome}
          >
            <Home className="h-5 w-5" />
            <span className="sr-only">Home</span>
          </Button>
          <div className="mr-4 hidden md:flex">
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
          
          <div className="flex-1"></div>
          <ThemeToggle />
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
                <CardContent className="p-4 flex flex-col h-full">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Documents</h2>
                    <div className="flex items-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Filter className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={toggleSort}>
                            {sortDirection === 'desc' ? (
                              <><SortDesc className="mr-2 h-4 w-4" /> Newest First</>
                            ) : (
                              <><SortAsc className="mr-2 h-4 w-4" /> Oldest First</>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setSearchQuery('')}>
                            Clear Filters
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <Button variant="ghost" size="sm" onClick={() => setDrawerOpen(false)} className="ml-1">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="relative mb-4">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search documents..."
                      className="pl-8 pr-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                      <button 
                        className="absolute right-2 top-2.5"
                        onClick={clearSearch}
                      >
                        <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                      </button>
                    )}
                  </div>
                  
                  <ScrollArea className="flex-grow">
                    {filteredDocuments.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        {searchQuery ? (
                          <p>No documents match your search</p>
                        ) : (
                          <p>No documents found</p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {filteredDocuments.map((doc) => (
                          <div
                            key={doc.id}
                            className={`flex items-center rounded group relative ${
                              selectedDocument?.id === doc.id ? 'bg-muted' : 'hover:bg-accent hover:text-accent-foreground'
                            }`}
                          >
                            <button
                              className="w-full text-left p-2 rounded min-h-[3rem]"
                              onClick={() => {
                                selectDocument(doc);
                                if (isMobile) setDrawerOpen(false);
                              }}
                            >
                              <div className="font-medium truncate">{doc.title}</div>
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-muted-foreground">
                                  {new Date(doc.updated_at || '').toLocaleDateString()}
                                </span>
                                <Badge 
                                  variant="outline" 
                                  className="text-xs opacity-60"
                                >
                                  {doc.content ? 
                                    `${countWords(doc.content)} words` : 
                                    'Empty'
                                  }
                                </Badge>
                              </div>
                            </button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button 
                                  variant="secondary"
                                  size="icon"
                                  className="opacity-0 group-hover:opacity-100 transition-opacity absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    duplicateDocument(doc, e);
                                  }}
                                >
                                  <Copy className="mr-2 h-4 w-4" />
                                  Duplicate
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="text-red-500 focus:text-red-500" 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    confirmDeleteDocument(doc, e);
                                  }}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                  
                  <div className="mt-4 text-xs text-muted-foreground">
                    {filteredDocuments.length} {filteredDocuments.length === 1 ? 'document' : 'documents'}
                    {searchQuery && documents.length !== filteredDocuments.length && (
                      <> (filtered from {documents.length})</>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>
          
          {/* Main Content */}
          <div className="flex-grow px-4 pt-4 flex flex-col">
            {selectedDocument ? (
              <div className="flex flex-col h-full">
                <div className="mb-2 flex items-center gap-2">
                  <div className="flex-grow">
                    <Input
                      className="text-xl font-semibold"
                      placeholder="Document Title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={togglePreviewMode}
                    className="flex items-center gap-1 h-9 rounded-md"
                    aria-label={isPreviewMode ? "Switch to edit mode" : "Switch to preview mode"}
                  >
                    {isPreviewMode ? (
                      <>
                        <FileEdit className="h-4 w-4" />
                        <span>Edit</span>
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4" />
                        <span>Preview</span>
                      </>
                    )}
                  </Button>
                </div>
                
                {isPreviewMode ? (
                  <div className="flex-grow overflow-auto bg-card p-4 rounded-md border">
                    <MarkdownRenderer content={content} />
                  </div>
                ) : (
                  <Textarea
                    ref={textareaRef}
                    className="flex-grow min-h-[200px] font-mono resize-none transition-all focus:shadow-md"
                    placeholder="Document content..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                  />
                )}
                <div className="mt-2 text-xs text-muted-foreground flex justify-between items-center h-8">
                  <span>
                    {content ? countWords(content) : 0} words, 
                    {content ? content.length : 0} characters
                  </span>
                  <div className="flex items-center space-x-2">
                    {selectedDocument?.version_number && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-xs"
                        onClick={fetchDocumentVersions}
                      >
                        <History className="mr-1 h-3.5 w-3.5" />
                        <span>v{selectedDocument.version_number}</span>
                      </Button>
                    )}
                    {renderSaveStatus()}
                    {(saveStatus === 'unsaved' || saveStatus === 'error' || saveStatus === 'saving') && (
                      <Button 
                        size="sm" 
                        onClick={saveDocument}
                        disabled={saveStatus === 'saving' || !hasUnsavedChanges()}
                      >
                        <Save className="mr-2 h-4 w-4" />
                        Save
                      </Button>
                    )}
                  </div>
                </div>
              </div>
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
            <div className="h-full p-4 flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Documents</h2>
                <div className="flex items-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Filter className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={toggleSort}>
                        {sortDirection === 'desc' ? (
                          <><SortDesc className="mr-2 h-4 w-4" /> Newest First</>
                        ) : (
                          <><SortAsc className="mr-2 h-4 w-4" /> Oldest First</>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSearchQuery('')}>
                        Clear Filters
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              
              <div className="relative mb-4">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search documents..."
                  className="pl-8 pr-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button 
                    className="absolute right-2 top-2.5"
                    onClick={clearSearch}
                  >
                    <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                  </button>
                )}
              </div>
              
              <ScrollArea className="flex-grow">
                {filteredDocuments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchQuery ? (
                      <p>No documents match your search</p>
                    ) : (
                      <p>No documents found</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filteredDocuments.map((doc) => (
                      <div
                        key={doc.id}
                        className={`flex items-center rounded group relative ${
                          selectedDocument?.id === doc.id ? 'bg-muted' : 'hover:bg-accent hover:text-accent-foreground'
                        }`}
                      >
                        <button
                          className="w-full text-left p-2 rounded min-h-[3rem]"
                          onClick={() => selectDocument(doc)}
                        >
                          <div className="font-medium truncate">{doc.title}</div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-muted-foreground">
                              {new Date(doc.updated_at || '').toLocaleDateString()}
                            </span>
                            <Badge 
                              variant="outline" 
                              className="text-xs opacity-60"
                            >
                              {doc.content ? 
                                `${countWords(doc.content)} words` : 
                                'Empty'
                              }
                            </Badge>
                          </div>
                        </button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="secondary"
                              size="icon"
                              className="opacity-0 group-hover:opacity-100 transition-opacity absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.stopPropagation();
                                duplicateDocument(doc, e);
                              }}
                            >
                              <Copy className="mr-2 h-4 w-4" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-red-500 focus:text-red-500" 
                              onClick={(e) => {
                                e.stopPropagation();
                                confirmDeleteDocument(doc, e);
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
              
              <div className="mt-4 text-xs text-muted-foreground">
                {filteredDocuments.length} {filteredDocuments.length === 1 ? 'document' : 'documents'}
                {searchQuery && documents.length !== filteredDocuments.length && (
                  <> (filtered from {documents.length})</>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex-grow px-4 md:px-8 py-6 flex flex-col">
            {selectedDocument ? (
              <div className="flex flex-col h-full">
                <div className="mb-2 flex items-center gap-2">
                  <div className="flex-grow">
                    <Input
                      className="text-xl font-semibold"
                      placeholder="Document Title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={togglePreviewMode}
                    className="flex items-center gap-1 h-9 rounded-md"
                    aria-label={isPreviewMode ? "Switch to edit mode" : "Switch to preview mode"}
                  >
                    {isPreviewMode ? (
                      <>
                        <FileEdit className="h-4 w-4" />
                        <span>Edit</span>
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4" />
                        <span>Preview</span>
                      </>
                    )}
                  </Button>
                </div>
                
                {isPreviewMode ? (
                  <div className="flex-grow overflow-auto bg-card p-4 rounded-md border">
                    <MarkdownRenderer content={content} />
                  </div>
                ) : (
                  <Textarea
                    ref={textareaRef}
                    className="flex-grow min-h-[200px] font-mono resize-none transition-all focus:shadow-md"
                    placeholder="Document content..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                  />
                )}
                <div className="mt-2 text-xs text-muted-foreground flex justify-between items-center h-8">
                  <span>
                    {content ? countWords(content) : 0} words, 
                    {content ? content.length : 0} characters
                  </span>
                  <div className="flex items-center space-x-2">
                    {selectedDocument?.version_number && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-xs"
                        onClick={fetchDocumentVersions}
                      >
                        <History className="mr-1 h-3.5 w-3.5" />
                        <span>v{selectedDocument.version_number}</span>
                      </Button>
                    )}
                    {renderSaveStatus()}
                    {(saveStatus === 'unsaved' || saveStatus === 'error' || saveStatus === 'saving') && (
                      <Button 
                        size="sm" 
                        onClick={saveDocument}
                        disabled={saveStatus === 'saving' || !hasUnsavedChanges()}
                      >
                        <Save className="mr-2 h-4 w-4" />
                        Save
                      </Button>
                    )}
                  </div>
                </div>
              </div>
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
      
      {/* Version History Modal - Accessible from both mobile and desktop */}
      {showVersionModal && documentVersions.length > 0 && (
        <Dialog open={showVersionModal} onOpenChange={setShowVersionModal}>
          <DialogContent className="sm:max-w-[700px] max-h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Version History</DialogTitle>
              <DialogDescription>
                Browse through previous versions of this document
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setViewingVersionIndex(Math.min(viewingVersionIndex + 1, documentVersions.length - 1))}
                  disabled={viewingVersionIndex >= documentVersions.length - 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setViewingVersionIndex(Math.max(viewingVersionIndex - 1, 0))}
                  disabled={viewingVersionIndex <= 0}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                
                <span className="text-sm">
                  Version {documentVersions[viewingVersionIndex]?.version_number || '?'} of {documentVersions.length}
                </span>
              </div>
              
              <Badge variant={(documentVersions[viewingVersionIndex]?.is_current === true) ? "default" : "outline"}>
                {(documentVersions[viewingVersionIndex]?.is_current === true) ? "Current Version" : "Historical Version"}
              </Badge>
            </div>
            
            <div className="flex-grow overflow-auto border rounded-md p-4 bg-card">
              {documentVersions[viewingVersionIndex] && (
                <>
                  <h3 className="text-xl font-semibold mb-4">
                    {extractContent(documentVersions[viewingVersionIndex].full_content).title}
                  </h3>
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    {extractContent(documentVersions[viewingVersionIndex].full_content).content ? (
                      <MarkdownRenderer content={extractContent(documentVersions[viewingVersionIndex].full_content).content || ''} />
                    ) : (
                      <p className="text-muted-foreground italic">No content</p>
                    )}
                  </div>
                </>
              )}
            </div>
            
            <DialogFooter className="mt-4">
              <Button
                variant="outline"
                onClick={() => setShowVersionModal(false)}
              >
                Cancel
              </Button>
              
              {documentVersions[viewingVersionIndex] && (documentVersions[viewingVersionIndex].is_current !== true) && (
                <Button
                  onClick={() => activateVersion(documentVersions[viewingVersionIndex])}
                >
                  Make Active
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Document</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{documentToDelete?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={deleteDocument}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Discard Changes Confirmation Dialog */}
      <Dialog open={showDiscardDialog} onOpenChange={setShowDiscardDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unsaved Changes</DialogTitle>
            <DialogDescription>
              You have unsaved changes in "{selectedDocument?.title}". Do you want to discard these changes and switch documents?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setShowDiscardDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="default" 
              onClick={() => {
                saveDocument().then(() => {
                  handleDiscardChanges();
                });
              }}
            >
              Save & Switch
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDiscardChanges}
            >
              Discard Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserDocuments; 