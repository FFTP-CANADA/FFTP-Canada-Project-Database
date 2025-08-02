
import { useState, useEffect, useCallback } from "react";
import { Project } from "@/types/project";
import { LocalStorageManager } from "@/utils/localStorageManager";

let globalProjects: Project[] = [];
let listeners: Array<(projects: Project[]) => void> = [];

const notifyListeners = (projects: Project[]) => {
  globalProjects = projects;
  listeners.forEach(listener => listener(projects));
};

const saveProjects = async (projects: Project[]) => {
  await LocalStorageManager.setItem('projects', projects);
  notifyListeners(projects);
};

export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>(() => {
    if (globalProjects.length > 0) return globalProjects;
    const saved = LocalStorageManager.getItem('projects', []);
    globalProjects = saved;
    return saved;
  });

  useEffect(() => {
    const listener = (newProjects: Project[]) => {
      setProjects(newProjects);
    };
    listeners.push(listener);
    
    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  }, []);

  const validateGovernanceNumber = useCallback((governanceNumber: string, governanceType: string, excludeId?: string): boolean => {
    if (!governanceNumber || !governanceType) return true;
    
    return !globalProjects.some(project => 
      project.id !== excludeId &&
      project.governanceNumber === governanceNumber && 
      project.governanceType === governanceType
    );
  }, []);

  const addProject = useCallback(async (project: Omit<Project, "id">): Promise<string> => {
    if (project.governanceNumber && project.governanceType) {
      if (!validateGovernanceNumber(project.governanceNumber, project.governanceType)) {
        throw new Error(`A project with ${project.governanceType} number "${project.governanceNumber}" already exists`);
      }
    }

    const newProject: Project = {
      ...project,
      id: Date.now().toString(),
    };
    
    const updatedProjects = [...globalProjects, newProject];
    await saveProjects(updatedProjects);
    
    return newProject.id;
  }, [validateGovernanceNumber]);

  const updateProject = useCallback(async (id: string, updates: Partial<Project>) => {
    if (updates.governanceNumber && updates.governanceType) {
      if (!validateGovernanceNumber(updates.governanceNumber, updates.governanceType, id)) {
        throw new Error(`A project with ${updates.governanceType} number "${updates.governanceNumber}" already exists`);
      }
    }
    
    const updatedProjects = globalProjects.map(p => p.id === id ? { ...p, ...updates } : p);
    await saveProjects(updatedProjects);
  }, [validateGovernanceNumber]);

  const deleteProject = useCallback(async (id: string) => {
    const updatedProjects = globalProjects.filter(p => p.id !== id);
    await saveProjects(updatedProjects);
  }, []);

  return {
    projects,
    addProject,
    updateProject,
    deleteProject,
    validateGovernanceNumber,
  };
};
