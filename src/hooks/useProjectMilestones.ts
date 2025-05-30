
import { useState, useEffect } from "react";
import { ProjectMilestone } from "@/types/project";

export const useProjectMilestones = () => {
  const [milestones, setMilestones] = useState<ProjectMilestone[]>([]);

  // Load milestones from localStorage on component mount
  useEffect(() => {
    const savedMilestones = localStorage.getItem("project-milestones");
    if (savedMilestones) {
      try {
        const parsedMilestones = JSON.parse(savedMilestones);
        setMilestones(parsedMilestones);
      } catch (error) {
        console.error("Error loading milestones from localStorage:", error);
      }
    }
  }, []);

  // Save milestones to localStorage whenever milestones change
  useEffect(() => {
    localStorage.setItem("project-milestones", JSON.stringify(milestones));
  }, [milestones]);

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
