import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface ConfirmRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  versionId: string | null;
  versionNumber?: number;
  isLoading?: boolean;
}

export function ConfirmRestoreModal({
  isOpen,
  onClose,
  onConfirm,
  versionId,
  versionNumber,
  isLoading = false
}: ConfirmRestoreModalProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2 text-amber-500">
            <AlertTriangle className="h-5 w-5" />
            <AlertDialogTitle>Confirm Version Restoration</AlertDialogTitle>
          </div>
          <AlertDialogDescription asChild>
            <div className="pt-3 space-y-3">
              <div>
                You are about to restore document to version: {versionNumber || '—'}
              </div>
              <div className="font-medium text-destructive">
                This will permanently remove all subsequent messages and document versions.
              </div>
              <div className="text-muted-foreground">
                This action cannot be undone. Are you sure you want to proceed?
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose} disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Restoring...
              </>
            ) : (
              'Yes, Restore This Version'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
} 