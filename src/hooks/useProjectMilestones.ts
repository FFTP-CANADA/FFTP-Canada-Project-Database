
import { useState, useEffect, useCallback } from "react";
import { ProjectMilestone } from "@/types/project";
import { LocalStorageManager } from "@/utils/localStorageManager";

let globalMilestones: ProjectMilestone[] = [];
let milestoneListeners: Array<(milestones: ProjectMilestone[]) => void> = [];

const notifyMilestoneListeners = (milestones: ProjectMilestone[]) => {
  globalMilestones = milestones;
  milestoneListeners.forEach(listener => listener(milestones));
};

const saveMilestones = async (milestones: ProjectMilestone[]) => {
  await LocalStorageManager.setItem('project-milestones', milestones);
  notifyMilestoneListeners(milestones);
};

export const useProjectMilestones = () => {
  const [milestones, setMilestones] = useState<ProjectMilestone[]>(() => {
    if (globalMilestones.length > 0) return globalMilestones;
    const saved = LocalStorageManager.getItem('project-milestones', []);
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
