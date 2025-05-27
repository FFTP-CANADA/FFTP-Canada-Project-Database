
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ProgramManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  programs: string[];
  onAddProgram: (program: string) => void;
  onDeleteProgram: (program: string) => void;
}

const ProgramManagementDialog = ({
  open,
  onOpenChange,
  programs,
  onAddProgram,
  onDeleteProgram
}: ProgramManagementDialogProps) => {
  const [newProgram, setNewProgram] = useState("");
  const { toast } = useToast();

  const handleAddProgram = () => {
    if (newProgram.trim() && !programs.includes(newProgram.trim())) {
      onAddProgram(newProgram.trim());
      setNewProgram("");
      toast({
        title: "Program Added",
        description: `"${newProgram.trim()}" has been added to the program list.`,
      });
    }
  };

  const handleDeleteProgram = (program: string) => {
    onDeleteProgram(program);
    toast({
      title: "Program Deleted",
      description: `"${program}" has been removed from the program list.`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Programs</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="newProgram">Add New Program</Label>
            <div className="flex space-x-2">
              <Input
                id="newProgram"
                value={newProgram}
                onChange={(e) => setNewProgram(e.target.value)}
                placeholder="Enter program name"
                onKeyPress={(e) => e.key === 'Enter' && handleAddProgram()}
              />
              <Button onClick={handleAddProgram} disabled={!newProgram.trim()}>
                Add
              </Button>
            </div>
          </div>

          <div>
            <Label>Existing Programs</Label>
            <div className="max-h-48 overflow-y-auto space-y-2 mt-2">
              {programs.map((program) => (
                <div key={program} className="flex items-center justify-between p-2 border rounded">
                  <span className="text-sm">{program}</span>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeleteProgram(program)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              {programs.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">No programs available</p>
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

export default ProgramManagementDialog;
