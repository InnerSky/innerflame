import React, { useState } from 'react';
import { Message } from '@innerflame/types';
import { Button } from '@/components/ui/button.js';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu.js';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog.js';
import { 
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet.js';
import { Edit, Trash, MoreVertical, RotateCcw, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast.ts';

interface MessageActionsProps {
  message: Message;
  onEdit: (messageId: string) => void;
  onDelete: (messageId: string) => void;
  showRestoreVersion?: boolean;
  onRestoreVersion?: (messageId: string) => void;
  isMobile?: boolean;
  canEdit?: boolean;
  position?: 'left' | 'right';
}

export const MessageActions: React.FC<MessageActionsProps> = ({ 
  message, 
  onEdit, 
  onDelete,
  showRestoreVersion = false,
  onRestoreVersion = () => {},
  isMobile = false,
  canEdit = true,
  position = 'right'
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showMobileActions, setShowMobileActions] = useState(false);
  const { toast } = useToast();
  
  const handleEdit = () => {
    onEdit(message.id);
  };
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      toast({
        title: "Copied to clipboard",
        description: "Text has been copied",
        variant: "default",
        duration: 1000
      });
      
      if (isMobile) {
        setShowMobileActions(false);
      }
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Could not copy the text",
        variant: "destructive",
        duration: 3000
      });
    }
  };
  
  const handleDelete = () => {
    if (isMobile) {
      setShowMobileActions(false);
    }
    setShowDeleteConfirm(true);
  };
  
  const handleRestoreVersion = () => {
    onRestoreVersion(message.id);
  };
  
  const confirmDelete = () => {
    onDelete(message.id);
    setShowDeleteConfirm(false);
  };
  
  const positionClasses = position === 'left' 
    ? "absolute -left-9 top-1 opacity-0 group-hover:opacity-100 transition-opacity" 
    : "absolute -right-9 top-1 opacity-0 group-hover:opacity-100 transition-opacity";
  
  if (!isMobile) {
    return (
      <>
        <div className={positionClasses}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Open message menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={position === 'left' ? "start" : "end"}>
              {canEdit && (
                <DropdownMenuItem onClick={handleEdit}>
                  <Edit className="mr-2 h-4 w-4" />
                  <span>Edit</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={handleCopy}>
                <Copy className="mr-2 h-4 w-4" />
                <span>Copy</span>
              </DropdownMenuItem>
              {showRestoreVersion && (
                <DropdownMenuItem onClick={handleRestoreVersion}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  <span>Restore Version</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem 
                onClick={handleDelete}
                className="text-destructive focus:text-destructive"
              >
                <Trash className="mr-2 h-4 w-4" />
                <span>Delete</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Message</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this message? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }
  
  const mobilePositionClasses = position === 'left'
    ? "absolute -left-7 top-1 touch-manipulation"
    : "absolute -right-7 top-1 touch-manipulation";
  
  return (
    <>
      <div className={mobilePositionClasses}>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 w-8 p-0 opacity-60 active:opacity-100"
          onClick={() => setShowMobileActions(true)}
        >
          <MoreVertical className="h-4 w-4" />
          <span className="sr-only">Message options</span>
        </Button>
      </div>
      
      <Sheet open={showMobileActions} onOpenChange={setShowMobileActions}>
        <SheetContent side="bottom" className="h-auto">
          <SheetHeader className="text-left mb-4">
            <SheetTitle>Message Options</SheetTitle>
          </SheetHeader>
          <div className="grid gap-4">
            {canEdit && (
              <Button 
                variant="outline" 
                className="flex justify-start items-center px-4 py-6 text-base"
                onClick={() => {
                  setShowMobileActions(false);
                  handleEdit();
                }}
              >
                <Edit className="mr-3 h-5 w-5" />
                <span>Edit Message</span>
              </Button>
            )}
            <Button 
              variant="outline" 
              className="flex justify-start items-center px-4 py-6 text-base"
              onClick={handleCopy}
            >
              <Copy className="mr-3 h-5 w-5" />
              <span>Copy Message</span>
            </Button>
            {showRestoreVersion && (
              <Button 
                variant="outline" 
                className="flex justify-start items-center px-4 py-6 text-base"
                onClick={() => {
                  setShowMobileActions(false);
                  handleRestoreVersion();
                }}
              >
                <RotateCcw className="mr-3 h-5 w-5" />
                <span>Restore Version</span>
              </Button>
            )}
            <Button 
              variant="destructive" 
              className="flex justify-start items-center px-4 py-6 text-base"
              onClick={handleDelete}
            >
              <Trash className="mr-3 h-5 w-5" />
              <span>Delete Message</span>
            </Button>
          </div>
        </SheetContent>
      </Sheet>
      
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Message</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this message? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}; 