import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface UserProfile {
  id: string;
  user_id: string;
  display_name: string | null;
  role: 'admin' | 'viewer';
  created_at: string;
  email?: string;
}

export const useUserManagement = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching users:', error);
        toast({
          title: "Error",
          description: "Failed to fetch users.",
          variant: "destructive",
        });
        return;
      }

      // Fetch email addresses for each user
      const usersWithEmails = [];
      for (const profile of profiles || []) {
        try {
          const { data: authUser } = await supabase.auth.admin.getUserById(profile.user_id);
          usersWithEmails.push({
            ...profile,
            email: authUser.user?.email || 'Unknown'
          });
        } catch (error) {
          console.error('Error fetching user email:', error);
          usersWithEmails.push({
            ...profile,
            email: 'Unknown'
          });
        }
      }

      setUsers(usersWithEmails);
    } catch (error) {
      console.error('Error in fetchUsers:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while fetching users.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: 'admin' | 'viewer') => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('user_id', userId);

      if (error) {
        console.error('Error updating user role:', error);
        toast({
          title: "Error",
          description: "Failed to update user role.",
          variant: "destructive",
        });
        return false;
      }

      // Update local state
      setUsers(prev => prev.map(user => 
        user.user_id === userId ? { ...user, role: newRole } : user
      ));

      toast({
        title: "Success",
        description: `User role updated to ${newRole}.`,
      });

      return true;
    } catch (error) {
      console.error('Error in updateUserRole:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while updating user role.",
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return {
    users,
    loading,
    updateUserRole,
    refreshUsers: fetchUsers,
  };
};