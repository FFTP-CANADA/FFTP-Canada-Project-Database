
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
    // RESTORE ALL MILESTONES - DO NOT DELETE ANYTHING
    const rawMilestones = localStorage.getItem('project-milestones');
    const ffttpMilestones = localStorage.getItem('fftp_project-milestones');
    
    console.log("📊 RAW milestones:", rawMilestones ? JSON.parse(rawMilestones).length : 0);
    console.log("📊 FFTP milestones:", ffttpMilestones ? JSON.parse(ffttpMilestones).length : 0);
    
    // ALWAYS preserve all milestone data - migrate without filtering
    if (rawMilestones) {
      try {
        const parsedRaw = JSON.parse(rawMilestones);
        console.log("🔄 RESTORING all milestones from raw storage");
        
        // Save ALL milestones to prefixed storage - DO NOT FILTER
        localStorage.setItem('fftp_project-milestones', rawMilestones);
        globalMilestones = parsedRaw;
        console.log("✅ ALL milestones restored:", parsedRaw.length);
        return parsedRaw;
      } catch (e) {
        console.error("❌ Failed to restore milestones:", e);
      }
    }
    
    if (globalMilestones.length > 0) {
      console.log("🎯 Using cached milestones:", globalMilestones.length);
      return globalMilestones;
    }
    
    const saved = LocalStorageManager.getItem('project-milestones', []);
    console.log("📊 Loading milestones from storage:", saved.length);
    console.log("🎯 All milestone project IDs:", saved.map(m => m.projectId));
    
    globalMilestones = saved;
    return saved;
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
