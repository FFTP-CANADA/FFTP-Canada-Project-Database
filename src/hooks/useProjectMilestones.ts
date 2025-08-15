
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
    // IMMEDIATE EMERGENCY RECOVERY - RUN NOW
    console.log('🚨 STARTING IMMEDIATE MILESTONE RECOVERY');
    EmergencyMilestoneRecovery.logAllStorageKeys();
    
    // Run recovery synchronously if possible
    EmergencyMilestoneRecovery.recoverAllMilestones().then(recovered => {
      if (recovered.length > 0) {
        console.log(`🎉 EMERGENCY RECOVERY SUCCESS: ${recovered.length} MILESTONES RESTORED`);
        globalMilestones = recovered;
        // Update all listeners immediately
        notifyMilestoneListeners(recovered);
      } else {
        console.log('❌ NO MILESTONES RECOVERED FROM ANY SOURCE');
      }
    });
    
    // Also try to load from current storage
    const saved = LocalStorageManager.getItem('project-milestones', []);
    globalMilestones = saved.length > 0 ? saved : [];
    
    return globalMilestones;
  });

  useEffect(() => {
    const listener = (newMilestones: ProjectMilestone[]) => {
      setMilestones(newMilestones);
    };
    milestoneListeners.push(listener);
    
    // Listen for recovery events
    const handleRecovery = (event: CustomEvent) => {
      const { milestones: recoveredMilestones } = event.detail;
      console.log('🎉 RECOVERY EVENT RECEIVED:', recoveredMilestones.length);
      setMilestones(recoveredMilestones);
      globalMilestones = recoveredMilestones;
    };
    
    window.addEventListener('milestones-restored', handleRecovery as EventListener);
    
    return () => {
      milestoneListeners = milestoneListeners.filter(l => l !== listener);
      window.removeEventListener('milestones-restored', handleRecovery as EventListener);
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
