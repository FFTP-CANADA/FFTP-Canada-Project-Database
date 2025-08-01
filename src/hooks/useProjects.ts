
import { useState, useEffect } from "react";
import { Project } from "@/types/project";
import { initialProjects } from "@/data/initialProjects";
import { LocalStorageManager } from "@/utils/localStorageManager";

export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>(() => {
    return LocalStorageManager.getItem('projects', initialProjects);
  });

  useEffect(() => {
    LocalStorageManager.setItem('projects', projects);
  }, [projects]);

  const validateGovernanceNumber = (governanceNumber: string, governanceType: string, excludeId?: string): boolean => {
    if (!governanceNumber || !governanceType) return true; // Allow empty values
    
    return !projects.some(project => 
      project.id !== excludeId &&
      project.governanceNumber === governanceNumber && 
      project.governanceType === governanceType
    );
  };

  const addProject = (project: Omit<Project, "id">) => {
    // Validate governance number uniqueness
    if (project.governanceNumber && project.governanceType) {
      if (!validateGovernanceNumber(project.governanceNumber, project.governanceType)) {
        throw new Error(`A project with ${project.governanceType} number "${project.governanceNumber}" already exists`);
      }
    }

    const newProject: Project = {
      ...project,
      id: Date.now().toString(),
    };
    setProjects(prev => [...prev, newProject]);
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    // Validate governance number uniqueness on update
    if (updates.governanceNumber && updates.governanceType) {
      if (!validateGovernanceNumber(updates.governanceNumber, updates.governanceType, id)) {
        throw new Error(`A project with ${updates.governanceType} number "${updates.governanceNumber}" already exists`);
      }
    }
    
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deleteProject = (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
  };

  return {
    projects,
    addProject,
    updateProject,
    deleteProject,
    validateGovernanceNumber,
  };
};
