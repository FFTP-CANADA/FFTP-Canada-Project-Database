import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";
import { useUserRole } from "./useUserRole";
import { supabase } from "@/integrations/supabase/client";

export const useProjectPermissions = () => {
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const [adminProfiles, setAdminProfiles] = useState<Record<string, { email: string; display_name: string }>>({});

  // Fetch admin profiles for display
  useEffect(() => {
    const fetchAdminProfiles = async () => {
      if (!isAdmin) return;

      try {
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('user_id, display_name')
          .eq('role', 'admin');

        if (error) {
          console.error('Error fetching admin profiles:', error);
          return;
        }

        // Get email addresses from auth.users for each admin
        const adminData: Record<string, { email: string; display_name: string }> = {};
        
        for (const profile of profiles || []) {
          const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(profile.user_id);
          if (!authError && authUser.user) {
            adminData[profile.user_id] = {
              email: authUser.user.email || '',
              display_name: profile.display_name || authUser.user.email || ''
            };
          }
        }

        setAdminProfiles(adminData);
      } catch (error) {
        console.error('Error fetching admin profiles:', error);
      }
    };

    fetchAdminProfiles();
  }, [isAdmin]);

  const canEditProject = (project: any) => {
    if (!user || !isAdmin) return false;
    
    // If no assigned admin, any admin can edit
    if (!project.assigned_admin) return true;
    
    // Only the assigned admin can edit
    return project.assigned_admin === user.id;
  };

  const canDeleteProject = (project: any) => {
    return canEditProject(project); // Same logic as edit
  };

  const getAssignedAdminInfo = (project: any) => {
    if (!project.assigned_admin) return null;
    return adminProfiles[project.assigned_admin] || null;
  };

  const getAvailableAdmins = () => {
    return Object.entries(adminProfiles).map(([userId, info]) => ({
      userId,
      email: info.email,
      displayName: info.display_name
    }));
  };

  return {
    canEditProject,
    canDeleteProject,
    getAssignedAdminInfo,
    getAvailableAdmins,
    adminProfiles,
  };
};