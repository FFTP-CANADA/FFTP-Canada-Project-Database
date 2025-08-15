
import { useState, useEffect, useCallback } from "react";
import { ProjectMilestone } from "@/types/project";
import { LocalStorageManager } from "@/utils/localStorageManager";
import { calculateProjectDisbursedAmount } from "@/utils/disbursementCalculator";
import { EmergencyMilestoneRecovery } from "@/utils/emergencyMilestoneRecovery";

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
    if (globalMilestones.length > 0) return globalMilestones;
    
    // Try normal load first
    const saved = LocalStorageManager.getItem('project-milestones', []);
    
    // If no milestones found, trigger emergency recovery
    if (saved.length === 0) {
      console.log('🚨 NO MILESTONES FOUND - TRIGGERING EMERGENCY RECOVERY');
      EmergencyMilestoneRecovery.logAllStorageKeys();
      
      // Trigger recovery (async, will update via event)
      EmergencyMilestoneRecovery.recoverAllMilestones().then(recovered => {
        if (recovered.length > 0) {
          console.log(`🎉 RECOVERED ${recovered.length} MILESTONES!`);
          // Force reload to pick up recovered data
          setTimeout(() => window.location.reload(), 1000);
        }
      }).catch(error => {
        console.error('❌ Emergency recovery failed:', error);
      });
    }
    
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
