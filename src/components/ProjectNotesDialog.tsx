
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ProjectNote } from "@/hooks/useProjectData";
import { useToast } from "@/hooks/use-toast";
import { getTodayString } from "@/utils/dateUtils";

interface ProjectNotesDialogProps {
  projectId: string;
  projectName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notes: ProjectNote[];
  onAddNote: (note: Omit<ProjectNote, "id">) => void;
}

const ProjectNotesDialog = ({
  projectId,
  projectName,
  open,
  onOpenChange,
  notes,
  onAddNote
}: ProjectNotesDialogProps) => {
  const [newNote, setNewNote] = useState("");
  const { toast } = useToast();

  const handleAddNote = () => {
    if (newNote.trim()) {
      onAddNote({
        projectId,
        content: newNote.trim(),
        dateOfNote: getTodayString()
      });
      setNewNote("");
      toast({
        title: "Note Added",
        description: "Your note has been added successfully.",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Notes for {projectName}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="newNote">Add New Note</Label>
            <Textarea
              id="newNote"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Enter your note here..."
              rows={3}
            />
            <Button 
              onClick={handleAddNote} 
              disabled={!newNote.trim()}
              className="mt-2"
            >
              Add Note
            </Button>
          </div>

          <div>
            <Label>Existing Notes</Label>
            <div className="max-h-96 overflow-y-auto space-y-3 mt-2">
              {notes.map((note) => (
                <div key={note.id} className="p-3 border rounded-lg bg-gray-50">
                  <div className="text-sm text-gray-500 mb-1">{note.dateOfNote}</div>
                  <div className="text-sm">{note.content}</div>
                </div>
              ))}
              {notes.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">No notes available</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectNotesDialog;
