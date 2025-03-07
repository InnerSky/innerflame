import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateProject: (title: string, content: string) => Promise<void>;
  mode?: 'create' | 'edit';
  initialTitle?: string;
  initialContent?: string;
}

export function CreateProjectDialog({
  open,
  onOpenChange,
  onCreateProject,
  mode = 'create',
  initialTitle = "New Project",
  initialContent = "",
}: CreateProjectDialogProps) {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Update form when initialTitle/initialContent change (for editing)
  useEffect(() => {
    if (open) {
      setTitle(initialTitle);
      setContent(initialContent);
    }
  }, [open, initialTitle, initialContent]);

  const handleSubmit = async () => {
    if (!title.trim()) return;
    
    setIsSubmitting(true);
    try {
      await onCreateProject(title, content);
      // Reset form for create mode, editing mode will update via props
      if (mode === 'create') {
        setTitle("New Project");
        setContent("");
      }
      onOpenChange(false);
    } catch (error) {
      console.error(`Error ${mode === 'create' ? 'creating' : 'updating'} project:`, error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Determine dialog title and button text based on mode
  const dialogTitle = mode === 'create' ? 'Create New Project' : 'Edit Project';
  const buttonText = mode === 'create' ? 'Create Project' : 'Save Changes';
  const loadingText = mode === 'create' ? 'Creating...' : 'Saving...';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="project-name" className="text-right">
              Name
            </Label>
            <Input
              id="project-name"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="col-span-3"
              autoFocus
            />
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="project-notes" className="text-right">
              Notes
            </Label>
            <Textarea
              id="project-notes"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="col-span-3"
              rows={5}
              placeholder="Optional project description or notes..."
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || !title.trim()}
          >
            {isSubmitting ? loadingText : buttonText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 