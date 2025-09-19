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

        // Get admin profiles via secure Edge Function
        try {
          const { data: result, error: functionError } = await supabase.functions.invoke('admin-operations', {
            body: { operation: 'getAdminProfiles', data: {} }
          });

          if (functionError) {
            console.error('Error calling admin function:', functionError);
            return;
          }

          setAdminProfiles(result.adminProfiles || {});
        } catch (error) {
          console.error('Error fetching admin profiles via function:', error);
        }
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