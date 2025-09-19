import { useAuth } from "./useAuth";
import { useUserRole } from "./useUserRole";
import { Project } from "@/types/project";

export const useProjectPermissionsLocal = () => {
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  
  const canEditProject = (project: Project) => {
    if (!user || !isAdmin) return false;
    
    // If no assigned admin, any admin can edit
    if (!project.assignedAdmin) return true;
    
    // Only the assigned admin can edit
    return project.assignedAdmin === user.id;
  };

  const canDeleteProject = (project: Project) => {
    return canEditProject(project); // Same logic as edit
  };

  const getAssignedAdminInfo = (project: Project) => {
    // For localStorage version, we can't easily fetch user email info
    // This would return null, but the UI will handle it gracefully
    return null;
  };

  const assignAdminToProject = (projectId: string, adminUserId: string | null) => {
    // This would need to be implemented by the parent component
    // that has access to the updateProject function
    console.log('Assign admin to project:', { projectId, adminUserId });
  };

  return {
    canEditProject,
    canDeleteProject,
    getAssignedAdminInfo,
    assignAdminToProject,
  };
};