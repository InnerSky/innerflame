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
  Home
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
import { motion, AnimatePresence } from 'framer-motion';

// Define the Document type
interface Document {
  id: string;
  title: string;
  content: string | null;
  entity_type: string;
  created_at: string;
  updated_at: string;
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
  const saveTimeoutRef = useRef<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isMobile = useMediaQuery('(max-width: 768px)');
  
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

      try {
        const { data, error } = await supabase
          .from('entities')
          .select('*')
          .eq('user_id', user.id)
          .eq('entity_type', 'user_document')
          .order('updated_at', { ascending: false });

        if (error) throw error;

        setDocuments(data || []);
        setFilteredDocuments(data || []);
        if (data && data.length > 0) {
          setSelectedDocument(data[0]);
          setTitle(data[0].title);
          setContent(data[0].content || '');
        }
      } catch (err) {
        console.error('Error fetching documents:', err);
        setError('Failed to load documents');
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
        const dateA = new Date(a.updated_at).getTime();
        const dateB = new Date(b.updated_at).getTime();
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
      const newDocument = {
        user_id: user.id,
        title: 'Untitled Document',
        content: '',
        entity_type: 'user_document',
      };

      const { data, error } = await supabase
        .from('entities')
        .insert(newDocument)
        .select()
        .single();

      if (error) throw error;

      setDocuments([data, ...documents]);
      setFilteredDocuments([data, ...filteredDocuments]);
      setSelectedDocument(data);
      setTitle(data.title);
      setContent(data.content || '');
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

  const saveDocument = async () => {
    if (!selectedDocument || !user) return Promise.resolve();

    setSaveStatus('saving');
    try {
      const updates = {
        title,
        content,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('entities')
        .update(updates)
        .eq('id', selectedDocument.id);

      if (error) throw error;

      // Update the document in the local state
      const updatedDocument = { ...selectedDocument, ...updates };
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
      const { error } = await supabase
        .from('entities')
        .delete()
        .eq('id', documentToDelete.id);
        
      if (error) throw error;
      
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
      event.stopPropagation(); // Prevent selecting the document when clicking
    }
    
    if (!user) return;
    
    try {
      const duplicatedDocument = {
        user_id: user.id,
        title: `${document.title} (Copy)`,
        content: document.content,
        entity_type: 'user_document',
      };

      const { data, error } = await supabase
        .from('entities')
        .insert(duplicatedDocument)
        .select()
        .single();

      if (error) throw error;

      setDocuments([data, ...documents]);
      setFilteredDocuments([data, ...filteredDocuments]);
      
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
    <div className="overflow-x-auto">
      <motion.div 
        className={`container mx-auto ${isMobile ? 'py-0' : 'py-8'} px-4 md:px-6 md:min-w-[1024px]`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className={`flex justify-between items-center ${isMobile ? 'py-1 mb-1' : 'mb-6'}`}>
          <div className="flex items-center">
            {isMobile && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={toggleDrawer}
                id="drawer-toggle-button"
                className="mr-3 -ml-2"
                aria-label="Toggle document list"
              >
                <List className="h-5 w-5" />
              </Button>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              onClick={goToHome} 
              variant="ghost" 
              size="icon"
              className="h-9 w-9 rounded-full"
              aria-label="Go to Home"
            >
              <Home className="h-[1.2rem] w-[1.2rem]" />
            </Button>
            <ThemeToggle />
            <Button 
              onClick={createNewDocument} 
              disabled={saveStatus === 'saving'}
              variant="subtle"
              className="h-9 px-4 transition-colors"
              aria-label="Create new document"
            >
              <Plus className="h-[1.2rem] w-[1.2rem] mr-2" />
              New Document
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6 relative">
          {/* Mobile Drawer Background Overlay */}
          <AnimatePresence>
            {isMobile && drawerOpen && (
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
          
          {/* Document List Sidebar */}
          <AnimatePresence>
            <motion.div 
              id="document-list-drawer"
              className={`col-span-12 md:col-span-3 ${isMobile ? 'fixed left-0 top-0 bottom-0 z-20 w-[80%] max-w-[320px]' : ''}`}
              initial={isMobile ? { x: -320 } : { x: 0 }}
              animate={isMobile ? (drawerOpen ? { x: 0 } : { x: -320 }) : { x: 0 }}
              exit={isMobile ? { x: -320 } : { x: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              style={{ 
                display: isMobile && !drawerOpen ? 'none' : 'block',
                height: isMobile ? '100%' : 'auto'
              }}
            >
              <Card className={`${isMobile ? 'h-full rounded-none' : 'h-[calc(100vh-8rem)]'} flex flex-col`}>
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
                      {isMobile && (
                        <Button variant="ghost" size="sm" onClick={() => setDrawerOpen(false)} className="ml-1">
                          <X className="h-4 w-4" />
                        </Button>
                      )}
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
                    <AnimatePresence>
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
                            <motion.div 
                              key={doc.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              <div
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
                                      {new Date(doc.updated_at).toLocaleDateString()}
                                    </span>
                                    <Badge 
                                      variant="outline" 
                                      className="text-xs opacity-60"
                                    >
                                      {doc.content ? 
                                        `${doc.content.split(/\s+/).filter(Boolean).length} words` : 
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
                                      className="opacity-0 group-hover:opacity-100 transition-opacity absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 dropdown-trigger z-20"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        // Prevent the drawer from closing when opening the dropdown
                                        e.nativeEvent.stopImmediatePropagation();
                                      }}
                                    >
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent 
                                    align="end" 
                                    className="dropdown-content z-50"
                                    sideOffset={5}
                                    onClick={(e) => {
                                      // Prevent document selection when clicking menu items
                                      e.stopPropagation();
                                    }}
                                  >
                                    <DropdownMenuItem 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        // Prevent the drawer from closing when clicking menu items
                                        e.nativeEvent.stopImmediatePropagation();
                                        duplicateDocument(doc, e);
                                      }}
                                    >
                                      <Copy className="mr-2 h-4 w-4" />
                                      Duplicate
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem 
                                      className="text-red-500 focus:text-red-500" 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        // Prevent the drawer from closing when clicking menu items
                                        e.nativeEvent.stopImmediatePropagation();
                                        confirmDeleteDocument(doc, e);
                                      }}
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                              <Separator className="my-1" />
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </AnimatePresence>
                  </ScrollArea>
                  
                  <div className="mt-2 text-xs text-muted-foreground">
                    {filteredDocuments.length} {filteredDocuments.length === 1 ? 'document' : 'documents'}
                    {searchQuery && documents.length !== filteredDocuments.length && (
                      <> (filtered from {documents.length})</>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>

          {/* Document Editor */}
          <div className={`${isMobile ? 'col-span-12' : 'col-span-12 md:col-span-9'}`}>
            {isMobile ? (
              <div className="flex flex-col h-[calc(100vh-65px)]">
                {selectedDocument ? (
                  <div className="flex flex-col h-full">
                    <div className="mb-2">
                      <Input
                        className="text-xl font-semibold mb-2"
                        placeholder="Document Title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                      />
                    </div>
                    <Textarea
                      ref={textareaRef}
                      className="flex-grow min-h-[200px] font-mono resize-none transition-all focus:shadow-md"
                      placeholder="Document content..."
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                    />
                    <div className="mt-2 text-xs text-muted-foreground flex justify-between items-center h-8">
                      <span>
                        {content ? content.split(/\s+/).filter(Boolean).length : 0} words, 
                        {content ? content.length : 0} characters
                      </span>
                      <div className="flex items-center space-x-2">
                        {renderSaveStatus()}
                        {(saveStatus === 'unsaved' || saveStatus === 'error' || saveStatus === 'saving') && (
                          <Button 
                            size="sm" 
                            onClick={saveDocument} 
                            disabled={saveStatus === 'saving'}
                            className="transition-transform active:scale-95 ml-2"
                          >
                            {saveStatus === 'saving' ? (
                              <>
                                <Spinner size="sm" className="mr-2" />
                                Saving...
                              </>
                            ) : (
                              <>
                                <Save className="mr-2 h-4 w-4" />
                                Save
                              </>
                            )}
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
                      <FilePlus className="mr-2 h-[1.2rem] w-[1.2rem]" />
                      Create New Document
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <Card className="h-[calc(100vh-8rem)] flex flex-col">
                <CardContent className="p-4 flex flex-col h-full">
                  {selectedDocument ? (
                    <div className="flex flex-col h-full">
                      <div className="mb-2">
                        <Input
                          className="text-xl font-semibold mb-2"
                          placeholder="Document Title"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                        />
                      </div>
                      <Textarea
                        ref={textareaRef}
                        className="flex-grow min-h-[200px] font-mono resize-none transition-all focus:shadow-md"
                        placeholder="Document content..."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                      />
                      <div className="mt-2 text-xs text-muted-foreground flex justify-between items-center h-8">
                        <span>
                          {content ? content.split(/\s+/).filter(Boolean).length : 0} words, 
                          {content ? content.length : 0} characters
                        </span>
                        <div className="flex items-center space-x-2">
                          {renderSaveStatus()}
                          {(saveStatus === 'unsaved' || saveStatus === 'error' || saveStatus === 'saving') && (
                            <Button 
                              size="sm" 
                              onClick={saveDocument} 
                              disabled={saveStatus === 'saving'}
                              className="transition-transform active:scale-95 ml-2"
                            >
                              {saveStatus === 'saving' ? (
                                <>
                                  <Spinner size="sm" className="mr-2" />
                                  Saving...
                                </>
                              ) : (
                                <>
                                  <Save className="mr-2 h-4 w-4" />
                                  Save
                                </>
                              )}
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
                        <FilePlus className="mr-2 h-[1.2rem] w-[1.2rem]" />
                        Create New Document
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
        
        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent className="delete-dialog" onInteractOutside={(e) => {
            // Prevent interaction outside from closing the drawer
            e.preventDefault();
          }}>
            <DialogHeader>
              <DialogTitle>Delete Document</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{documentToDelete?.title}"? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex justify-between">
              <DialogClose asChild onClick={(e) => {
                // Prevent the drawer from closing when canceling
                e.stopPropagation();
                if (e.nativeEvent) {
                  e.nativeEvent.stopImmediatePropagation();
                }
              }}>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button variant="destructive" onClick={(e) => {
                // Prevent the drawer from closing when confirming
                e.stopPropagation();
                if (e.nativeEvent) {
                  e.nativeEvent.stopImmediatePropagation();
                }
                deleteDocument();
              }}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Discard Changes Confirmation Dialog */}
        <Dialog open={showDiscardDialog} onOpenChange={setShowDiscardDialog}>
          <DialogContent className="discard-dialog" onInteractOutside={(e) => {
            // Prevent interaction outside from closing the drawer
            e.preventDefault();
          }}>
            <DialogHeader>
              <DialogTitle>Unsaved Changes</DialogTitle>
              <DialogDescription>
                You have unsaved changes in "{selectedDocument?.title}". Do you want to discard these changes and switch documents?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex justify-between">
              <DialogClose asChild onClick={(e) => {
                // Prevent the drawer from closing when canceling
                e.stopPropagation();
                if (e.nativeEvent) {
                  e.nativeEvent.stopImmediatePropagation();
                }
                setShowDiscardDialog(false);
                setPendingDocument(null);
              }}>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button 
                variant="default" 
                onClick={(e) => {
                  // Prevent the drawer from closing
                  e.stopPropagation();
                  if (e.nativeEvent) {
                    e.nativeEvent.stopImmediatePropagation();
                  }
                  // Save current document before switching
                  saveDocument().then(() => {
                    handleDiscardChanges();
                  });
                }}
              >
                Save & Switch
              </Button>
              <Button 
                variant="destructive" 
                onClick={(e) => {
                  // Prevent the drawer from closing
                  e.stopPropagation();
                  if (e.nativeEvent) {
                    e.nativeEvent.stopImmediatePropagation();
                  }
                  handleDiscardChanges();
                }}
              >
                Discard Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>
    </div>
  );
};

export default UserDocuments; 