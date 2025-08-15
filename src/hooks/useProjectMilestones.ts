
import { useState, useEffect, useCallback } from "react";
import { ProjectMilestone } from "@/types/project";
import { LocalStorageManager } from "@/utils/localStorageManager";
import { calculateProjectDisbursedAmount } from "@/utils/disbursementCalculator";

let globalMilestones: ProjectMilestone[] = [];
let milestoneListeners: Array<(milestones: ProjectMilestone[]) => void> = [];

const notifyMilestoneListeners = (milestones: ProjectMilestone[]) => {
  globalMilestones = milestones;
  milestoneListeners.forEach(listener => listener(milestones));
};

const updateProjectDisbursedAmounts = async (milestones: ProjectMilestone[]) => {
  // Get all unique project IDs that have disbursement milestones
  const projectIds = [...new Set(milestones.map(m => m.projectId))];
  
  for (const projectId of projectIds) {
    const projectMilestones = milestones.filter(m => m.projectId === projectId);
    const calculatedAmount = calculateProjectDisbursedAmount(projectMilestones);
    
    // Get current projects and update the specific project's amountDisbursed
    const projects = LocalStorageManager.getItem('projects', []);
    const updatedProjects = projects.map(project => 
      project.id === projectId 
        ? { ...project, amountDisbursed: calculatedAmount }
        : project
    );
    
    await LocalStorageManager.setItem('projects', updatedProjects);
    
    // Notify project listeners about the updates by triggering a custom event
    window.dispatchEvent(new CustomEvent('projects-updated', { detail: updatedProjects }));
  }
};

const saveMilestones = async (milestones: ProjectMilestone[]) => {
  await LocalStorageManager.setItem('project-milestones', milestones);
  await updateProjectDisbursedAmounts(milestones);
  notifyMilestoneListeners(milestones);
};

export const useProjectMilestones = () => {
  const [milestones, setMilestones] = useState<ProjectMilestone[]>(() => {
    // CRITICAL FIX: Check for milestone data and validate against existing projects
    const rawMilestones = localStorage.getItem('project-milestones');
    const ffttpMilestones = localStorage.getItem('fftp_project-milestones');
    
    console.log("📊 RAW milestones:", rawMilestones ? JSON.parse(rawMilestones).length : 0);
    console.log("📊 FFTP milestones:", ffttpMilestones ? JSON.parse(ffttpMilestones).length : 0);
    
    // Check what projects exist first
    const rawProjects = localStorage.getItem('projects');
    const ffttpProjects = localStorage.getItem('fftp_projects');
    const existingProjects = rawProjects ? JSON.parse(rawProjects) : (ffttpProjects ? JSON.parse(ffttpProjects) : []);
    const existingProjectIds = existingProjects.map(p => p.id);
    
    console.log("🔍 MILESTONE DEBUG: Existing project IDs:", existingProjectIds);
    
    // Migrate milestones if needed, but filter out orphaned ones
    if (rawMilestones && !ffttpMilestones) {
      try {
        const parsedRaw = JSON.parse(rawMilestones);
        console.log("🔄 MIGRATING milestones from raw to prefixed storage");
        
        // Filter out milestones for projects that don't exist
        const validMilestones = parsedRaw.filter(m => {
          const isValid = existingProjectIds.includes(m.projectId);
          if (!isValid) {
            console.log(`❌ REMOVING orphaned milestone: "${m.title}" for non-existent project ${m.projectId}`);
          }
          return isValid;
        });
        
        console.log(`📊 Filtered milestones: ${parsedRaw.length} → ${validMilestones.length}`);
        localStorage.setItem('fftp_project-milestones', JSON.stringify(validMilestones));
        globalMilestones = validMilestones;
        return validMilestones;
      } catch (e) {
        console.error("❌ Failed to migrate milestones:", e);
      }
    }
    
    if (globalMilestones.length > 0) {
      console.log("🎯 Using cached milestones:", globalMilestones.length);
      return globalMilestones;
    }
    
    const saved = LocalStorageManager.getItem('project-milestones', []);
    console.log("📊 Loading milestones from storage:", saved.length);
    
    // Validate loaded milestones against existing projects
    const validSaved = saved.filter(m => {
      const isValid = existingProjectIds.includes(m.projectId);
      if (!isValid) {
        console.log(`❌ REMOVING orphaned milestone: "${m.title}" for non-existent project ${m.projectId}`);
      }
      return isValid;
    });
    
    if (validSaved.length !== saved.length) {
      console.log(`📊 Cleaned milestones: ${saved.length} → ${validSaved.length}`);
      // Save the cleaned data back
      LocalStorageManager.setItem('project-milestones', validSaved);
    }
    
    console.log("🎯 Final milestone project IDs:", validSaved.map(m => m.projectId));
    globalMilestones = validSaved;
    return validSaved;
  });

  useEffect(() => {
    const listener = (newMilestones: ProjectMilestone[]) => {
      setMilestones(newMilestones);
    };
    milestoneListeners.push(listener);
    
    return () => {
      milestoneListeners = milestoneListeners.filter(l => l !== listener);
    };
  }, []);

  const addMilestone = useCallback(async (milestone: Omit<ProjectMilestone, "id">) => {
    const newMilestone: ProjectMilestone = {
      ...milestone,
      id: Date.now().toString(),
    };
    
    const updatedMilestones = [...globalMilestones, newMilestone];
    await saveMilestones(updatedMilestones);
  }, []);

  const updateMilestone = useCallback(async (id: string, updates: Partial<ProjectMilestone>) => {
    const updatedMilestones = globalMilestones.map(m => m.id === id ? { ...m, ...updates } : m);
    await saveMilestones(updatedMilestones);
  }, []);

  const deleteMilestone = useCallback(async (id: string) => {
    const updatedMilestones = globalMilestones.filter(m => m.id !== id);
    await saveMilestones(updatedMilestones);
  }, []);

  const getMilestonesForProject = useCallback((projectId: string) => {
    return globalMilestones.filter(milestone => milestone.projectId === projectId);
  }, []);

  return {
    milestones,
    addMilestone,
    updateMilestone,
    deleteMilestone,
    getMilestonesForProject,
  };
};
