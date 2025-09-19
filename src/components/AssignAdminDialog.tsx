import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useProjectPermissions } from "@/hooks/useProjectPermissions";

interface AssignAdminDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: any;
  onProjectUpdated: () => void;
}

export const AssignAdminDialog = ({ open, onOpenChange, project, onProjectUpdated }: AssignAdminDialogProps) => {
  const [selectedAdmin, setSelectedAdmin] = useState<string>(project?.assigned_admin || "");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { getAvailableAdmins, getAssignedAdminInfo } = useProjectPermissions();

  const availableAdmins = getAvailableAdmins();
  const currentAssignedAdmin = getAssignedAdminInfo(project);

  const handleAssignAdmin = async () => {
    if (!project) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('projects')
        .update({ 
          assigned_admin: selectedAdmin || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', project.id);

      if (error) {
        console.error('Error assigning admin:', error);
        toast({
          title: "Error",
          description: "Failed to assign admin to project.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Admin assigned successfully.",
        });
        onProjectUpdated();
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Error assigning admin:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Assign Project Admin</DialogTitle>
          <DialogDescription>
            Choose which admin user can edit and manage this project: <strong>{project?.project_name}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {currentAssignedAdmin && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <Label className="text-sm font-medium text-blue-900">Currently Assigned:</Label>
              <p className="text-blue-700">{currentAssignedAdmin.display_name} ({currentAssignedAdmin.email})</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="admin-select">Select Admin</Label>
            <Select
              value={selectedAdmin}
              onValueChange={setSelectedAdmin}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose an admin or leave unassigned" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No specific admin (any admin can edit)</SelectItem>
                {availableAdmins.map((admin) => (
                  <SelectItem key={admin.userId} value={admin.userId}>
                    {admin.displayName} ({admin.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssignAdmin}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? "Assigning..." : "Assign Admin"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};