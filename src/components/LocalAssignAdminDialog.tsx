import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Project } from "@/types/project";

interface LocalAssignAdminDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project | null;
  onProjectUpdated: (projectId: string, assignedAdmin: string | null) => void;
}

export const LocalAssignAdminDialog = ({ 
  open, 
  onOpenChange, 
  project, 
  onProjectUpdated 
}: LocalAssignAdminDialogProps) => {
  const [selectedAdmin, setSelectedAdmin] = useState<string>(project?.assignedAdmin || "");
  const [loading, setLoading] = useState(false);
  const [adminUsers, setAdminUsers] = useState<Array<{ userId: string; email: string; displayName: string }>>([]);
  const { toast } = useToast();

  // Fetch admin users when dialog opens
  useEffect(() => {
    const fetchAdmins = async () => {
      if (!open) return;

      try {
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('user_id, display_name')
          .eq('role', 'admin');

        if (error) {
          console.error('Error fetching admin profiles:', error);
          return;
        }

        // Fetch email addresses for each admin
        const adminData = [];
        for (const profile of profiles || []) {
          try {
            // Note: This requires admin privileges in Supabase
            const { data: authUser } = await supabase.auth.admin.getUserById(profile.user_id);
            if (authUser.user) {
              adminData.push({
                userId: profile.user_id,
                email: authUser.user.email || '',
                displayName: profile.display_name || authUser.user.email || ''
              });
            }
          } catch (error) {
            console.error('Error fetching user data:', error);
          }
        }

        setAdminUsers(adminData);
      } catch (error) {
        console.error('Error fetching admin users:', error);
      }
    };

    fetchAdmins();
  }, [open]);

  const handleAssignAdmin = async () => {
    if (!project) return;

    setLoading(true);
    try {
      // Update the project in localStorage through parent component
      onProjectUpdated(project.id, selectedAdmin || null);
      
      toast({
        title: "Success",
        description: "Admin assignment updated successfully.",
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error assigning admin:', error);
      toast({
        title: "Error",
        description: "Failed to assign admin to project.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const currentAssignedAdmin = adminUsers.find(admin => admin.userId === project?.assignedAdmin);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Assign Project Admin</DialogTitle>
          <DialogDescription>
            Choose which admin user can edit and manage this project: <strong>{project?.projectName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {currentAssignedAdmin && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <Label className="text-sm font-medium text-blue-900">Currently Assigned:</Label>
              <p className="text-blue-700">{currentAssignedAdmin.displayName} ({currentAssignedAdmin.email})</p>
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
                {adminUsers.map((admin) => (
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