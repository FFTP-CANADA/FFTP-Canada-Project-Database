
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
    console.log("🚀 INITIALIZING PROJECTS HOOK");
    
    // Check what's in localStorage with both keys
    const rawProjects = localStorage.getItem('projects');
    const ffttpProjects = localStorage.getItem('fftp_projects');
    
    console.log("📊 RAW projects in localStorage:", rawProjects ? JSON.parse(rawProjects).length : 0);
    console.log("📊 FFTP projects in localStorage:", ffttpProjects ? JSON.parse(ffttpProjects).length : 0);
    
    // FIRST: Try raw localStorage if it has data
    if (rawProjects) {
      try {
        const parsedRaw = JSON.parse(rawProjects);
        console.log("🔄 Using raw localStorage (primary):", parsedRaw.length);
        globalProjects = parsedRaw;
        // Migrate to LocalStorageManager format
        LocalStorageManager.setItem('projects', parsedRaw);
        return parsedRaw;
      } catch (e) {
        console.error("❌ Failed to parse raw projects:", e);
      }
    }
    
    // Fallback: load from LocalStorageManager
    const saved = LocalStorageManager.getItem('projects', []);
    console.log("✅ Loading projects via LocalStorageManager:", saved.length);
    
    if (saved.length > 0) {
      console.log("📋 Project names:", saved.map(p => p.projectName));
      globalProjects = saved;
      return saved;
    }
    
    return [];
  });

  useEffect(() => {
    const listener = (newProjects: Project[]) => {
      setProjects(newProjects);
    };
    listeners.push(listener);
    
    // Listen for milestone-triggered project updates
    const handleProjectsUpdated = (event: CustomEvent) => {
      const updatedProjects = event.detail;
      globalProjects = updatedProjects;
      setProjects(updatedProjects);
      listeners.forEach(l => l(updatedProjects));
    };
    
    window.addEventListener('projects-updated', handleProjectsUpdated as EventListener);
    
    return () => {
      listeners = listeners.filter(l => l !== listener);
      window.removeEventListener('projects-updated', handleProjectsUpdated as EventListener);
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
