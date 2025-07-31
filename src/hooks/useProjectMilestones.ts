
import { useState, useEffect } from "react";
import { ProjectMilestone } from "@/types/project";

export const useProjectMilestones = () => {
  const [milestones, setMilestones] = useState<ProjectMilestone[]>([]);

  // Load milestones from localStorage on component mount
  useEffect(() => {
    console.log("Loading milestones from localStorage...");
    const savedMilestones = localStorage.getItem("project-milestones");
    console.log("Raw saved milestones:", savedMilestones);
    
    if (savedMilestones) {
      try {
        const parsedMilestones = JSON.parse(savedMilestones);
        console.log("Parsed milestones:", parsedMilestones);
        setMilestones(parsedMilestones);
      } catch (error) {
        console.error("Error loading milestones from localStorage:", error);
      }
    } else {
      console.log("No saved milestones found in localStorage");
    }
  }, []);

  // Save milestones to localStorage whenever milestones change
  useEffect(() => {
    if (milestones.length > 0) {
      console.log("Saving milestones to localStorage:", milestones);
      localStorage.setItem("project-milestones", JSON.stringify(milestones));
    }
  }, [milestones]);

  const addMilestone = (milestone: Omit<ProjectMilestone, "id">) => {
    console.log("Adding milestone:", milestone);
    const newMilestone: ProjectMilestone = {
      ...milestone,
      id: Date.now().toString(),
    };
    console.log("New milestone with ID:", newMilestone);
    setMilestones(prev => {
      const updated = [...prev, newMilestone];
      console.log("Updated milestones array:", updated);
      return updated;
    });
  };

  const updateMilestone = (id: string, updates: Partial<ProjectMilestone>) => {
    console.log("🔄 useProjectMilestones.updateMilestone called");
    console.log("🔄 Milestone ID:", id);
    console.log("🔄 Updates:", updates);
    console.log("🔄 Current milestones before update:", milestones);
    
    setMilestones(prev => {
      const updated = prev.map(m => m.id === id ? { ...m, ...updates } : m);
      console.log("🔄 Updated milestones array after update:", updated);
      return updated;
    });
  };

  const deleteMilestone = (id: string) => {
    console.log("Deleting milestone:", id);
    setMilestones(prev => prev.filter(m => m.id !== id));
  };

  const getMilestonesForProject = (projectId: string) => {
    const projectMilestones = milestones.filter(milestone => milestone.projectId === projectId);
    console.log(`Milestones for project ${projectId}:`, projectMilestones);
    return projectMilestones;
  };

  return {
    milestones,
    addMilestone,
    updateMilestone,
    deleteMilestone,
    getMilestonesForProject,
  };
};
