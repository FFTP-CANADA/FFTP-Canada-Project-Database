import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface ProjectDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectName: string;
  onConfirmDelete: () => void;
}

export const ProjectDeleteDialog = ({
  open,
  onOpenChange,
  projectName,
  onConfirmDelete,
}: ProjectDeleteDialogProps) => {
  const [confirmationText, setConfirmationText] = useState("");
  const { toast } = useToast();

  const handleDelete = () => {
    if (confirmationText !== projectName) {
      toast({
        title: "Error",
        description: "Project name does not match. Please type the exact project name to confirm deletion.",
        variant: "destructive",
      });
      return;
    }
    
    onConfirmDelete();
    setConfirmationText("");
    onOpenChange(false);
    
    toast({
      title: "Project Deleted",
      description: `"${projectName}" has been permanently deleted.`,
    });
  };

  const handleCancel = () => {
    setConfirmationText("");
    onOpenChange(false);
  };

  const isDeleteEnabled = confirmationText === projectName;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Project</AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <p>
              Are you sure you want to delete the project <strong>"{projectName}"</strong>?
            </p>
            <p>
              This action cannot be undone. This will permanently delete the project and all associated data including notes, milestones, attachments, and photos.
            </p>
            <div className="space-y-2">
              <Label htmlFor="confirmation">
                To confirm, type the project name: <strong>{projectName}</strong>
              </Label>
              <Input
                id="confirmation"
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                placeholder="Type project name here..."
                className="w-full"
              />
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={!isDeleteEnabled}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete Project
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};