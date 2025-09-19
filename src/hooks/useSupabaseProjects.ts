import { useState, useEffect, useCallback } from "react";
import { Project } from "@/types/project";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";
import { getCurrentESTDate } from "@/utils/dateUtils";

export const useSupabaseProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchProjects = useCallback(async () => {
    if (!user) {
      setProjects([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching projects:', error);
        toast({
          title: "Error",
          description: "Failed to load projects",
          variant: "destructive",
        });
      } else {
        // Transform Supabase data to match local Project type
        const transformedProjects: Project[] = (data || []).map(project => ({
          id: project.id,
          projectName: project.project_name,
          governanceNumber: project.governance_number || '',
          governanceType: undefined, // Will need to add this field to Supabase if needed
          totalCost: project.total_cost || 0,
          currency: (project.currency || 'CAD') as 'CAD' | 'USD',
          amountDisbursed: project.amount_disbursed || 0,
          status: (project.status || 'Planning') as Project['status'],
          activeStatus: (project.active_status || 'Active') as 'Active' | 'Closed',
          followUpNeeded: project.follow_up_needed || false,
          assignedAdmin: project.assigned_admin,
          // Set default values for fields not in Supabase yet
          country: 'Jamaica' as Project['country'],
          cityParish: '',
          partnerName: '',
          impactArea: 'Food Security' as Project['impactArea'],
          fundType: 'Designated' as Project['fundType'],
          isDesignated: false,
          reportedSpend: 0,
          startDate: new Date().toISOString(),
          endDate: new Date().toISOString(),
          program: '',
        }));
        setProjects(transformedProjects);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while loading projects",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const addProject = useCallback(async (project: Omit<Project, "id">): Promise<string> => {
    if (!user) {
      throw new Error("Must be logged in to create projects");
    }

    try {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          project_name: project.projectName,
          governance_number: project.governanceNumber,
          governance_type: project.governanceType,
          total_cost: project.totalCost,
          currency: project.currency,
          amount_disbursed: project.amountDisbursed || 0,
          status: project.status,
          active_status: project.activeStatus || 'Active',
          follow_up_needed: project.followUpNeeded || false,
          assigned_admin: user.id, // Assign creating user as admin
          created_by: user.id,
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error creating project:', error);
        throw new Error(error.message);
      }

      await fetchProjects(); // Refresh the list
      return data.id;
    } catch (error: any) {
      console.error('Error creating project:', error);
      throw error;
    }
  }, [user, fetchProjects]);

  const updateProject = useCallback(async (id: string, updates: Partial<Project>) => {
    if (!user) {
      throw new Error("Must be logged in to update projects");
    }

    try {
      const { error } = await supabase
        .from('projects')
        .update({
          project_name: updates.projectName,
          governance_number: updates.governanceNumber,
          governance_type: updates.governanceType,
          total_cost: updates.totalCost,
          currency: updates.currency,
          amount_disbursed: updates.amountDisbursed,
          status: updates.status,
          active_status: updates.activeStatus,
          follow_up_needed: updates.followUpNeeded,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) {
        console.error('Error updating project:', error);
        throw new Error(error.message);
      }

      await fetchProjects(); // Refresh the list
    } catch (error: any) {
      console.error('Error updating project:', error);
      throw error;
    }
  }, [user, fetchProjects]);

  const deleteProject = useCallback(async (id: string) => {
    if (!user) {
      throw new Error("Must be logged in to delete projects");
    }

    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting project:', error);
        throw new Error(error.message);
      }

      await fetchProjects(); // Refresh the list
    } catch (error: any) {
      console.error('Error deleting project:', error);
      throw error;
    }
  }, [user, fetchProjects]);

  const validateGovernanceNumber = useCallback((governanceNumber: string, governanceType: string, excludeId?: string): boolean => {
    if (!governanceNumber || !governanceType) return true;
    
    return !projects.some(project => 
      project.id !== excludeId &&
      project.governanceNumber === governanceNumber && 
      project.governanceType === governanceType
    );
  }, [projects]);

  return {
    projects,
    loading,
    addProject,
    updateProject,
    deleteProject,
    validateGovernanceNumber,
    refetch: fetchProjects,
  };
};