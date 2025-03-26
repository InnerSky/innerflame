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
}

export function JSONDisplay({ jsonData, onDataChange, readOnly = false, disableAddCard = false, disableKeyEdit = false, disableHoverEffects = false }: JSONDisplayProps) {
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

  // Helper function to find a key case-insensitively
  const findKey = (obj: Record<string, string>, keyToFind: string): string | null => {
    const lowerKeyToFind = keyToFind.toLowerCase();
    for (const key of Object.keys(obj)) {
      if (key.toLowerCase() === lowerKeyToFind) {
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
  const gridKeys = keys.filter(key => {
    if (hasTitle && key.toLowerCase() === 'title'.toLowerCase()) return false;
    if (hasSubtitle && key.toLowerCase() === 'subtitle'.toLowerCase()) return false;
    if (hasNotes && key.toLowerCase() === 'notes'.toLowerCase()) return false;
    if (hasFootnotes && key.toLowerCase() === 'footnotes'.toLowerCase()) return false;
    return true;
  });

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
    
    // Check if the new key would conflict with an existing one
    if (findKey(jsonData, newKey)) {
      // You could show an error message here
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
    onDataChange(restData);
    
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
    
    // Check if key already exists
    if (findKey(jsonData, newCardKey)) {
      // You could show an error message here
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
              {jsonData && findKey(jsonData, newCardKey) && newCardKey.trim() !== '' && (
                <p className="text-xs text-red-500 mt-1">
                  This title already exists. Please choose another one.
                </p>
              )}
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
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setAddCardDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddNewCard}
              disabled={!newCardKey.trim() || (jsonData && !!findKey(jsonData, newCardKey) && newCardKey.trim() !== '') ? true : false}
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
        {/* Title - only if the "title" key exists (case insensitive) */}
        {hasTitle && titleKey && (
          <div className="mb-1 text-center animate-in fade-in slide-in-from-bottom-3 duration-500 relative group max-w-full">
            {editingSpecialField === titleKey ? (
              <div className="mb-3 max-w-full">
                <Input
                  value={specialFieldValue}
                  onChange={(e) => setSpecialFieldValue(e.target.value)}
                  className="text-2xl font-bold text-center max-w-full"
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
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight group-hover:pr-8 break-words truncate max-w-full">
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

        {/* Subtitle - only if the "subtitle" key exists (case insensitive) */}
        {hasSubtitle && subtitleKey && (
          <div className="mb-4 text-center animate-in fade-in slide-in-from-bottom-3 duration-500 relative group max-w-full">
            {editingSpecialField === subtitleKey ? (
              <div className="mb-3 max-w-full">
                <Input
                  value={specialFieldValue}
                  onChange={(e) => setSpecialFieldValue(e.target.value)}
                  className="text-lg font-medium text-center text-muted-foreground/80 max-w-full"
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
              <h3 className="text-lg md:text-xl text-muted-foreground/80 font-medium group-hover:pr-8 break-words truncate max-w-full">
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
        {hasTitle && !hasSubtitle && titleKey && (
          <div className="mb-4 text-center">
          <div className="mt-2 h-1 w-16 bg-primary/60 mx-auto rounded-full"></div>
        </div>
      )}

        {/* Canvas Grid - render all fields except title, subtitle, notes and footnotes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mb-4">
        {gridKeys.map((key, index) => (
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
                "bg-muted/30 dark:bg-muted/10 py-2 px-3 md:py-3 md:px-4 border-b group-hover:bg-muted/50 transition-colors duration-200 flex flex-row justify-between items-center",
                disableHoverEffects && "!group-hover:bg-muted/30 dark:!group-hover:bg-muted/10"
              )}>
                {editingKey === key && !disableKeyEdit ? (
                  <Input
                    value={editKeyValue}
                    onChange={(e) => setEditKeyValue(e.target.value)}
                    className="text-sm font-medium w-full"
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
              
            <CardContent className="p-3 md:p-4 bg-card/50">
                {editingKey === key ? (
                  <Textarea
                    ref={editTextareaRef}
                    value={editValue}
                    onChange={(e) => {
                      setEditValue(e.target.value);
                      adjustTextareaHeight(e.target as HTMLTextAreaElement);
                    }}
                    onKeyDown={(e) => handleKeyDown(e, () => handleSaveEdit(key, editKeyValue, editValue))}
                    className="w-full text-sm resize-none"
                    placeholder={`Add ${key} details...`}
                    autoFocus
                    style={{ height: 'auto', minHeight: '100px', overflow: 'hidden', maxWidth: '100%' }}
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
                <CardFooter className="flex justify-between space-x-2 p-2 bg-muted/10 border-t">
                  {!disableKeyEdit && (
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      onClick={() => showDeleteConfirmation(key)}
                      className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                  <div className={cn("flex space-x-2", disableKeyEdit ? "w-full justify-end" : "")}>
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
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  </div>
                </CardFooter>
              )}

              {findKey(jsonData, editKeyValue) && editKeyValue !== key && (
                <p className="text-xs text-red-500 absolute -bottom-5 left-0 right-0 text-center">
                  This title already exists
                </p>
              )}
          </Card>
        ))}

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