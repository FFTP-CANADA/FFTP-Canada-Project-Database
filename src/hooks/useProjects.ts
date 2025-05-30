
import { useState } from "react";
import { Project } from "@/types/project";
import { initialProjects } from "@/data/initialProjects";

export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>(initialProjects);

  const addProject = (project: Omit<Project, "id">) => {
    const newProject: Project = {
      ...project,
      id: Date.now().toString(),
    };
    setProjects(prev => [...prev, newProject]);
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  return {
    projects,
    addProject,
    updateProject,
  };
};
