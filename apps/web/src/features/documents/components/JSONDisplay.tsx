import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Pencil, X, Check, Plus, Trash2 } from 'lucide-react';
import { MarkdownRenderer } from '@/components/markdown-renderer';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';

interface JSONDisplayProps {
  jsonData: Record<string, string> | null;
  onDataChange?: (updatedData: Record<string, string>) => void;
  readOnly?: boolean;
  disableAddCard?: boolean;
  disableKeyEdit?: boolean;
  disableHoverEffects?: boolean;
  editableKeys?: string[];
  hideHeaderFields?: boolean;
}

export function JSONDisplay({ jsonData, onDataChange, readOnly = false, disableAddCard = false, disableKeyEdit = false, disableHoverEffects = false, editableKeys, hideHeaderFields = false }: JSONDisplayProps) {
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [editKeyValue, setEditKeyValue] = useState<string>('');
  const [editingSpecialField, setEditingSpecialField] = useState<string | null>(null);
  const [specialFieldValue, setSpecialFieldValue] = useState<string>('');
  const [addCardDialogOpen, setAddCardDialogOpen] = useState(false);
  const [newCardKey, setNewCardKey] = useState('');
  const [newCardValue, setNewCardValue] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [keyToDelete, setKeyToDelete] = useState<string | null>(null);
  
  // Add refs for all textareas
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);
  const specialFieldTextareaRef = useRef<HTMLTextAreaElement>(null);
  const newCardValueRef = useRef<HTMLTextAreaElement>(null);

  // Helper function to adjust textarea height
  const adjustTextareaHeight = (textarea: HTMLTextAreaElement | null) => {
    if (!textarea) return;
    
    // Reset height to ensure we get the right scrollHeight
    textarea.style.height = 'auto';
    
    // Set the height to match content
    textarea.style.height = `${textarea.scrollHeight}px`;
  };

  // Adjust height when editing starts
  useEffect(() => {
    if (editingKey && editTextareaRef.current) {
      adjustTextareaHeight(editTextareaRef.current);
    }
  }, [editingKey]);

  // Adjust height when special field editing starts
  useEffect(() => {
    if (editingSpecialField && specialFieldTextareaRef.current) {
      adjustTextareaHeight(specialFieldTextareaRef.current);
    }
  }, [editingSpecialField]);

  // Adjust height when new card dialog opens
  useEffect(() => {
    if (addCardDialogOpen && newCardValueRef.current) {
      adjustTextareaHeight(newCardValueRef.current);
    }
  }, [addCardDialogOpen]);

  // Show add card dialog
  const showAddCardDialog = () => {
    setNewCardKey('');
    setNewCardValue('');
    setAddCardDialogOpen(true);
  };

  // Helper function to find a key case-insensitively and format-insensitively
  const findKey = (obj: Record<string, string>, keyToFind: string): string | null => {
    if (!keyToFind || !keyToFind.trim()) return null;
    
    // Convert search key to lowercase and create normalized versions
    const lowerKeyToFind = keyToFind.toLowerCase();
    const withUnderscores = lowerKeyToFind.replace(/\s+/g, '_');
    const withSpaces = lowerKeyToFind.replace(/_+/g, ' ');
    
    for (const key of Object.keys(obj)) {
      const lowerKey = key.toLowerCase();
      const keyWithUnderscores = lowerKey.replace(/\s+/g, '_');
      const keyWithSpaces = lowerKey.replace(/_+/g, ' ');
      
      // Check all possible format combinations
      if (
        lowerKey === lowerKeyToFind ||
        lowerKey === withUnderscores || 
        lowerKey === withSpaces ||
        keyWithUnderscores === lowerKeyToFind ||
        keyWithSpaces === lowerKeyToFind
      ) {
        return key;
      }
    }
    return null;
  };

  // Helper function to get value with case-insensitive key
  const getValue = (obj: Record<string, string>, keyToFind: string): string | undefined => {
    const actualKey = findKey(obj, keyToFind);
    return actualKey ? obj[actualKey] : undefined;
  };

  // Get all the keys from the JSON data
  const keys = Object.keys(jsonData || {});
  
  // If editableKeys is provided, filter down to only those keys
  const displayKeys = editableKeys || keys;
  
  // Check if there's a title, subtitle, notes and footnotes (case-insensitive)
  const titleKey = jsonData ? findKey(jsonData, 'title') : null;
  const subtitleKey = jsonData ? findKey(jsonData, 'subtitle') : null;
  const notesKey = jsonData ? findKey(jsonData, 'notes') : null;
  const footnotesKey = jsonData ? findKey(jsonData, 'footnotes') : null;
  
  const hasTitle = !!titleKey;
  const hasSubtitle = !!subtitleKey;
  const hasNotes = !!notesKey;
  const hasFootnotes = !!footnotesKey;
  
  // Filter keys to display in the grid (exclude title, subtitle, notes and footnotes if they exist)
  const gridKeys = displayKeys.filter(key => {
    if (hasTitle && key.toLowerCase() === 'title'.toLowerCase()) return false;
    if (hasSubtitle && key.toLowerCase() === 'subtitle'.toLowerCase()) return false;
    if (hasNotes && key.toLowerCase() === 'notes'.toLowerCase()) return false;
    if (hasFootnotes && key.toLowerCase() === 'footnotes'.toLowerCase()) return false;
    return true;
  });

  // Updated duplicate key finder that checks the current key being edited
  const findDuplicateKey = (obj: Record<string, string>, keyToFind: string, currentKey: string): string | null => {
    if (!keyToFind.trim() || keyToFind.trim() === currentKey.trim()) {
      return null; // Empty keys or unchanged keys are not duplicates
    }
    
    // Use the more comprehensive findKey function
    const foundKey = findKey(obj, keyToFind);
    
    // If a key was found and it's not the current key being edited, it's a duplicate
    if (foundKey && foundKey !== currentKey) {
      return foundKey;
    }
    
    return null;
  };

  // Handle saving edits
  const handleSaveEdit = (oldKey: string, newKey: string, value: string) => {
    if (!onDataChange || !jsonData) return;
    
    // If key editing is disabled or the key hasn't changed, just update the value
    if (disableKeyEdit || oldKey === newKey) {
      const updatedData = { ...jsonData };
      updatedData[oldKey] = value;
      onDataChange(updatedData);
      setEditingKey(null);
      return;
    }
    
    // Check if the new key would conflict with an existing one using comprehensive checking
    if (findKey(jsonData, newKey) && findKey(jsonData, newKey) !== oldKey) {
      // Duplicate exists and it's not just the current key
      return;
    }
    
    // Create a new object without the old key
    const { [oldKey]: removedKey, ...restData } = jsonData;
    
    // Add the new key-value pair
    const updatedData = {
      ...restData,
      [newKey]: value
    };
    
    onDataChange(updatedData);
    setEditingKey(null);
  };

  // Handle special field edits (title, subtitle, notes, footnotes)
  const handleSaveSpecialField = (fieldKey: string | null, value: string) => {
    if (!onDataChange || !jsonData || !fieldKey) return;
    
    const updatedData = { ...jsonData };
    updatedData[fieldKey] = value;
    onDataChange(updatedData);
    setEditingSpecialField(null);
  };

  // Handle deleting a card
  const handleDeleteCard = (key: string) => {
    if (!onDataChange || !jsonData) return;
    
    // Create a new object without the deleted key
    const { [key]: removedKey, ...restData } = jsonData;
    
    // Add a special marker to identify this update is from JSONDisplay
    // This helps LeanCanvasDisplay know to process deletions even when few keys remain
    const updatedData = {
      ...restData,
      __source: 'JSONDisplay'
    };
    
    onDataChange(updatedData);
    
    // Close the dialog and reset state
    setDeleteDialogOpen(false);
    setKeyToDelete(null);
    setEditingKey(null);
  };

  // Show delete confirmation dialog
  const showDeleteConfirmation = (key: string) => {
    setKeyToDelete(key);
    setDeleteDialogOpen(true);
  };

  // Start editing a card
  const startEditing = (key: string, initialValue: string) => {
    if (disableKeyEdit) {
      // When key editing is disabled, only allow value editing
      setEditingKey(key);
      setEditValue(initialValue);
      setEditKeyValue(key); // Keep the original key
    } else {
      // When key editing is enabled, allow both key and value editing
      setEditingKey(key);
      setEditValue(initialValue);
      setEditKeyValue(key);
    }
  };

  // Start editing a special field
  const startEditingSpecialField = (key: string | null, initialValue: string) => {
    if (!key) return;
    setEditingSpecialField(key);
    setSpecialFieldValue(initialValue);
  };

  // Handle keyboard shortcuts for saving
  const handleKeyDown = (e: React.KeyboardEvent, saveAction: () => void) => {
    // Check for Ctrl+Enter or Shift+Enter
    if ((e.ctrlKey || e.shiftKey) && e.key === 'Enter') {
      e.preventDefault(); // Prevent default behavior like new line
      saveAction();
    }
  };

  // Handle adding a new card
  const handleAddNewCard = () => {
    if (!onDataChange || !jsonData || !newCardKey.trim()) return;
    
    // Check if key already exists using the comprehensive findKey approach
    // This checks the ENTIRE jsonData object, not just the displayed keys
    if (findKey(jsonData, newCardKey)) {
      // A duplicate exists
      return;
    }
    
    const updatedData = { ...jsonData };
    updatedData[newCardKey] = newCardValue;
    onDataChange(updatedData);
    
    // Reset and close dialog
    setNewCardKey('');
    setNewCardValue('');
    setAddCardDialogOpen(false);
  };

  // Define the dialogs that should be rendered regardless of content
  const renderDialogs = () => (
    <>
      {/* Add New Card Dialog */}
      <Dialog open={addCardDialogOpen} onOpenChange={setAddCardDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Card</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <label htmlFor="cardKey" className="text-sm font-medium block mb-1.5">
                Card Title
              </label>
              <Input
                id="cardKey"
                value={newCardKey}
                onChange={(e) => setNewCardKey(e.target.value)}
                placeholder="Enter card title..."
                autoFocus
              />
            </div>
            <div>
              <label htmlFor="cardValue" className="text-sm font-medium block mb-1.5">
                Card Content
              </label>
              <Textarea
                id="cardValue"
                ref={newCardValueRef}
                value={newCardValue}
                onChange={(e) => {
                  setNewCardValue(e.target.value);
                  adjustTextareaHeight(e.target as HTMLTextAreaElement);
                }}
                placeholder="Enter card content..."
                className="min-h-[100px] resize-none"
                style={{ overflow: 'hidden' }}
              />
              <p className="text-xs text-muted-foreground mt-1">
                You can use Markdown for formatting.
              </p>
            </div>
          </div>
          <DialogFooter className="flex flex-row items-center justify-between w-full">
            {/* Error message on the left */}
            {newCardKey.trim() !== '' && jsonData && findKey(jsonData, newCardKey) && (
              <p className="text-xs text-red-500 mr-auto">
                This title already exists
              </p>
            )}
            {/* Action buttons */}
            <Button 
              variant="outline" 
              onClick={() => setAddCardDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddNewCard}
              disabled={!newCardKey.trim() || Boolean(jsonData && findKey(jsonData, newCardKey))}
            >
              Add Card
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Card Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Card</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this card? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => keyToDelete && handleDeleteCard(keyToDelete)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );

  // Empty state rendering
  if (!jsonData || Object.keys(jsonData).length === 0) {
    return (
      <>
      <div className="flex items-center justify-center h-full text-muted-foreground">
          {!readOnly && !disableAddCard && (
            <Card 
              className="overflow-hidden border border-dashed border-primary/30 shadow-sm hover:shadow-md hover:border-primary/60 transition-all duration-200 cursor-pointer flex flex-col items-center justify-center min-h-[200px] animate-in fade-in w-full"
              onClick={showAddCardDialog}
            >
              <div className="flex flex-col items-center justify-center p-6 text-center">
                <div className="rounded-full bg-primary/10 p-3 mb-3">
                  <Plus className="h-6 w-6 text-primary" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">Add new card</p>
              </div>
            </Card>
          )}
      </div>
        {renderDialogs()}
      </>
    );
  }

  // Main content rendering for non-empty state
  return (
    <>
    <div className="w-full max-w-full">
        {/* Title - only if the "title" key exists (case insensitive) and not hidden */}
        {!hideHeaderFields && hasTitle && titleKey && (
          <div className="mb-1 text-center animate-in fade-in slide-in-from-bottom-3 duration-500 relative group max-w-full">
            {editingSpecialField === titleKey ? (
              <div className="mb-3 max-w-full p-0">
                <Input
                  value={specialFieldValue}
                  onChange={(e) => setSpecialFieldValue(e.target.value)}
                  className={cn(
                    "text-2xl md:text-3xl font-bold text-center max-w-full",
                    "border-0 focus:ring-0 shadow-none rounded-none", // Remove input borders
                    "bg-primary/5", // Light primary background for edit indication
                    "py-2 px-0 m-0" // Remove horizontal padding but keep vertical padding
                  )}
                  autoFocus
                  onKeyDown={(e) => handleKeyDown(e, () => handleSaveSpecialField(titleKey, specialFieldValue))}
                />
                <div className="flex justify-center mt-2 space-x-2">
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    onClick={() => setEditingSpecialField(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="icon" 
                    onClick={() => handleSaveSpecialField(titleKey, specialFieldValue)}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight break-words truncate max-w-full pr-8 relative">
                {jsonData[titleKey]?.trim() || <span className="text-muted-foreground italic">Add title...</span>}
                {!readOnly && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 absolute right-0 top-1/2 -translate-y-1/2 p-1 h-8 w-8"
                    onClick={() => startEditingSpecialField(titleKey, jsonData[titleKey] || '')}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
              </h2>
            )}
          </div>
        )}

        {/* Subtitle - only if the "subtitle" key exists (case insensitive) and not hidden */}
        {!hideHeaderFields && hasSubtitle && subtitleKey && (
          <div className="mb-4 text-center animate-in fade-in slide-in-from-bottom-3 duration-500 relative group max-w-full">
            {editingSpecialField === subtitleKey ? (
              <div className="mb-3 max-w-full p-0">
                <Input
                  value={specialFieldValue}
                  onChange={(e) => setSpecialFieldValue(e.target.value)}
                  className={cn(
                    "text-lg md:text-xl font-medium text-center text-muted-foreground/80 max-w-full",
                    "border-0 focus:ring-0 shadow-none rounded-none", // Remove input borders
                    "bg-primary/5", // Light primary background for edit indication
                    "py-2 px-0 m-0" // Remove horizontal padding but keep vertical padding
                  )}
                  autoFocus
                  onKeyDown={(e) => handleKeyDown(e, () => handleSaveSpecialField(subtitleKey, specialFieldValue))}
                />
                <div className="flex justify-center mt-2 space-x-2">
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    onClick={() => setEditingSpecialField(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="icon" 
                    onClick={() => handleSaveSpecialField(subtitleKey, specialFieldValue)}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <h3 className="text-lg md:text-xl text-muted-foreground/80 font-medium break-words truncate max-w-full pr-8 relative">
                {jsonData[subtitleKey]?.trim() || <span className="text-muted-foreground/50 italic">Add subtitle...</span>}
                {!readOnly && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 absolute right-0 top-1/2 -translate-y-1/2 p-1 h-8 w-8"
                    onClick={() => startEditingSpecialField(subtitleKey, jsonData[subtitleKey] || '')}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
              </h3>
            )}
            <div className="mt-3 h-1 w-16 bg-primary/60 mx-auto rounded-full"></div>
          </div>
        )}

        {/* If only title exists (no subtitle), show divider after title */}
        {!hideHeaderFields && hasTitle && !hasSubtitle && titleKey && (
          <div className="mb-4 text-center">
            <div className="mt-2 h-1 w-16 bg-primary/60 mx-auto rounded-full"></div>
          </div>
        )}

        {/* Canvas Grid - render all fields except title, subtitle, notes and footnotes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mb-4">
        {gridKeys.map((key, index) => {
          return (
            <Card 
              key={key} 
              className={cn(
                "overflow-hidden border shadow-sm hover:shadow-md transition-all duration-200",
                "group animate-in fade-in slide-in-from-bottom-2",
                "dark:bg-card/95 dark:backdrop-blur-sm",
                editingKey === key ? "ring-2 ring-primary" : "",
                disableHoverEffects && "!shadow-none hover:!shadow-none hover:!border-transparent"
              )}
              style={{ 
                animationDelay: `${index * 50}ms`,
                animationFillMode: 'backwards'
              }}
            >
                <CardHeader className={cn(
                  "bg-muted/30 dark:bg-muted/10 border-b group-hover:bg-muted/50 transition-colors duration-200 flex flex-row justify-between items-center",
                  editingKey === key && !disableKeyEdit ? "p-0" : "py-2 px-3 md:py-3 md:px-4",
                  disableHoverEffects && "!group-hover:bg-muted/30 dark:!group-hover:bg-muted/10"
                )}>
                  {editingKey === key && !disableKeyEdit ? (
                    <Input
                      value={editKeyValue}
                      onChange={(e) => setEditKeyValue(e.target.value)}
                      className={cn(
                        "text-sm font-medium w-full",
                        "border-0 focus:ring-0 shadow-none rounded-none", // Remove input borders
                        "bg-primary/5", // Light primary background for edit indication
                        "py-3 px-3 md:py-4 md:px-4 m-0" // Increased vertical padding
                      )}
                      style={{
                        paddingTop: '2rem',    // 10px internal top padding
                        paddingBottom: '2rem', // 10px internal bottom padding
                        lineHeight: '1.5',
                        minHeight: '2.5rem'        // Ensure minimum height
                      }}
                      placeholder="Card title..."
                    />
                  ) : (
                    <>
                      <CardTitle className={cn(
                        "text-sm font-medium capitalize text-foreground/90 group-hover:text-foreground transition-colors truncate max-w-[80%]",
                        disableHoverEffects && "!group-hover:text-foreground/90"
                      )}>
                    {key}
                  </CardTitle>
                      {!readOnly && editingKey !== key && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className={cn(
                            "opacity-0 group-hover:opacity-100 p-1 h-7 w-7 flex-shrink-0",
                          )}
                          onClick={() => startEditing(key, jsonData[key] || '')}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                      )}
                    </>
                  )}
              </CardHeader>
                
              <CardContent className={cn(
                "bg-card/50",
                editingKey === key ? "p-0" : "p-3 md:p-4" // Remove padding in edit mode
              )}>
                  {editingKey === key ? (
                    <Textarea
                      ref={editTextareaRef}
                      value={editValue}
                      onChange={(e) => {
                        setEditValue(e.target.value);
                        adjustTextareaHeight(e.target as HTMLTextAreaElement);
                      }}
                      onKeyDown={(e) => handleKeyDown(e, () => handleSaveEdit(key, editKeyValue, editValue))}
                      className={cn(
                        "w-full text-sm resize-none",
                        "border-0 focus:ring-0 shadow-none rounded-none", // Remove textarea borders
                        "bg-primary/5", // Light primary background for edit indication
                        "p-3 md:p-4", // Match the padding of display mode
                        "leading-relaxed" // Add increased line spacing
                      )}
                      placeholder={`Add ${key} details...`}
                      autoFocus
                      style={{ 
                        height: 'auto',
                        minHeight: '100px',
                        overflow: 'hidden',
                        maxWidth: '100%',
                        lineHeight: '1.6', // Increased from 1.5 for more space between lines
                      }}
                    />
                  ) : (
                    jsonData[key]?.trim() ? (
                      <div className="text-sm">
                        <MarkdownRenderer content={jsonData[key]} />
                      </div>
                    ) : (
                      <p className="text-muted-foreground italic text-sm">Awaiting content...</p>
                    )
                  )}
              </CardContent>
                
                {editingKey === key && (
                  <CardFooter className="flex flex-row items-center justify-between p-2 bg-muted/10 border-t">
                    <div className="flex items-center">
                      {!disableKeyEdit && (
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          onClick={() => showDeleteConfirmation(key)}
                          className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive transition-colors mr-2"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                      {/* Error message to the left of buttons */}
                      {findDuplicateKey(jsonData, editKeyValue, key) && (
                        <p className="text-xs text-red-500 mr-2">
                          This title already exists
                        </p>
                      )}
                    </div>
                    <div className={cn("flex space-x-2")}>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        onClick={() => setEditingKey(null)}
                        className="h-8 w-8"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="icon" 
                        onClick={() => handleSaveEdit(key, editKeyValue, editValue)}
                        className="h-8 w-8"
                        disabled={!!findDuplicateKey(jsonData, editKeyValue, key)}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardFooter>
                )}
            </Card>
          );
        })}

          {/* Add Card Button - only display if not in read-only mode and not disabled */}
          {!readOnly && !disableAddCard && (
            <Card 
              className="overflow-hidden border border-dashed border-primary/30 shadow-sm hover:shadow-md hover:border-primary/60 transition-all duration-200 cursor-pointer flex flex-col items-center justify-center min-h-[200px] animate-in fade-in"
              onClick={showAddCardDialog}
            >
              <div className="flex flex-col items-center justify-center p-6 text-center">
                <div className="rounded-full bg-primary/10 p-3 mb-3">
                  <Plus className="h-6 w-6 text-primary" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">Add new card</p>
      </div>
            </Card>
          )}
        </div>
        
        {/* Notes - only if the "notes" key exists (case insensitive) */}
        {hasNotes && notesKey && (
          <div className="text-sm bg-muted/20 p-4 rounded-md border border-muted mt-4 mb-4 animate-in fade-in slide-in-from-bottom-1 duration-700 relative group overflow-hidden">
            <h3 className="font-medium mb-1 flex items-center justify-between">
              Notes
              {!readOnly && editingSpecialField !== notesKey && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="opacity-0 group-hover:opacity-100 p-1 h-7 w-7 absolute right-3 top-3"
                  onClick={() => startEditingSpecialField(notesKey, jsonData[notesKey] || '')}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
              )}
            </h3>
            
            {editingSpecialField === notesKey ? (
              <div>
                <Textarea
                  ref={specialFieldTextareaRef}
                  value={specialFieldValue}
                  onChange={(e) => {
                    setSpecialFieldValue(e.target.value);
                    adjustTextareaHeight(e.target as HTMLTextAreaElement);
                  }}
                  onKeyDown={(e) => handleKeyDown(e, () => handleSaveSpecialField(notesKey, specialFieldValue))}
                  className="w-full text-sm resize-none"
                  placeholder="Add thoughts here..."
                  autoFocus
                  style={{ height: 'auto', minHeight: '100px', overflow: 'hidden', maxWidth: '100%' }}
                />
                <div className="flex justify-end mt-2 space-x-2">
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    onClick={() => setEditingSpecialField(null)}
                    className="h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="icon" 
                    onClick={() => handleSaveSpecialField(notesKey, specialFieldValue)}
                    className="h-8 w-8"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              jsonData[notesKey]?.trim() ? (
                <MarkdownRenderer content={jsonData[notesKey]} className="text-sm" />
              ) : (
                <p className="text-muted-foreground italic">Your notes here...</p>
              )
            )}
          </div>
        )}
        
        {/* Footnotes - only if the "footnotes" key exists (case insensitive) */}
        {hasFootnotes && footnotesKey && (
          <div className="text-sm text-muted-foreground mt-4 pt-3 border-t animate-in fade-in slide-in-from-bottom-1 duration-700 relative group overflow-hidden">
            {editingSpecialField === footnotesKey ? (
              <div>
                <Textarea
                  ref={specialFieldTextareaRef}
                  value={specialFieldValue}
                  onChange={(e) => {
                    setSpecialFieldValue(e.target.value);
                    adjustTextareaHeight(e.target as HTMLTextAreaElement);
                  }}
                  onKeyDown={(e) => handleKeyDown(e, () => handleSaveSpecialField(footnotesKey, specialFieldValue))}
                  className="w-full text-sm resize-none"
                  placeholder="Add references here..."
                  autoFocus
                  style={{ height: 'auto', minHeight: '80px', overflow: 'hidden', maxWidth: '100%' }}
                />
                <div className="flex justify-end mt-2 space-x-2">
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    onClick={() => setEditingSpecialField(null)}
                    className="h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="icon" 
                    onClick={() => handleSaveSpecialField(footnotesKey, specialFieldValue)}
                    className="h-8 w-8"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {jsonData[footnotesKey]?.trim() ? (
                  <div className="italic">
                    <MarkdownRenderer content={jsonData[footnotesKey]} className="text-sm" />
                  </div>
                ) : (
                  <p className="italic opacity-70">Your footnotes here...</p>
                )}
                {!readOnly && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="opacity-0 group-hover:opacity-100 p-1 h-7 w-7 absolute right-0 top-3"
                    onClick={() => startEditingSpecialField(footnotesKey, jsonData[footnotesKey] || '')}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                )}
              </>
            )}
        </div>
      )}
    </div>
      {renderDialogs()}
    </>
  );
} 