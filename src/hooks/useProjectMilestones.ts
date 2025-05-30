
import { useState } from "react";
import { ProjectMilestone } from "@/types/project";

export const useProjectMilestones = () => {
  const [milestones, setMilestones] = useState<ProjectMilestone[]>([]);

  const addMilestone = (milestone: Omit<ProjectMilestone, "id">) => {
    const newMilestone: ProjectMilestone = {
      ...milestone,
      id: Date.now().toString(),
    };
    setMilestones(prev => [...prev, newMilestone]);
  };

  const updateMilestone = (id: string, updates: Partial<ProjectMilestone>) => {
    setMilestones(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  const deleteMilestone = (id: string) => {
    setMilestones(prev => prev.filter(m => m.id !== id));
  };

  const getMilestonesForProject = (projectId: string) => {
    return milestones.filter(milestone => milestone.projectId === projectId);
  };

  return {
    milestones,
    addMilestone,
    updateMilestone,
    deleteMilestone,
    getMilestonesForProject,
  };
};
