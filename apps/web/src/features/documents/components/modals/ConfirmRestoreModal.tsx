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
import { AlertTriangle } from 'lucide-react';

interface ConfirmRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  versionId: string | null;
  versionNumber?: number;
}

export function ConfirmRestoreModal({
  isOpen,
  onClose,
  onConfirm,
  versionId,
  versionNumber
}: ConfirmRestoreModalProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2 text-amber-500">
            <AlertTriangle className="h-5 w-5" />
            <AlertDialogTitle>Confirm Version Restoration</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="pt-3">
            <p className="mb-3">
              You are about to restore document to version: {versionNumber || '—'}
            </p>
            <p className="font-medium text-destructive">
              This will permanently remove all subsequent messages and document versions.
            </p>
            <p className="mt-3 text-muted-foreground">
              This action cannot be undone. Are you sure you want to proceed?
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Yes, Restore This Version
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
} 