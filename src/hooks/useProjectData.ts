
import { useState } from "react";

export interface Project {
  id: string;
  projectName: string;
  country: "Jamaica" | "Guyana" | "Haiti" | "Honduras";
  partnerName: string;
  impactArea: "Food Security" | "Education" | "Housing & Community" | "Health" | "Economic Empowerment";
  fundType: "Designated" | "Undesignated";
  isDesignated: boolean;
  currency: "CAD" | "USD";
  totalCost: number;
  amountDisbursed: number;
  reportedSpend: number;
  startDate: string;
  endDate: string;
  status: "On-Track" | "Delayed" | "Pending Start" | "Completed" | "Cancelled" | "Needs Attention";
  followUpNeeded: boolean;
}

export interface ProjectNote {
  id: string;
  projectId: string;
  content: string;
  dateOfNote: string;
}

const initialProjects: Project[] = [
  {
    id: "1",
    projectName: "Community Kitchen Program",
    country: "Jamaica",
    partnerName: "Food For The Poor - Jamaica",
    impactArea: "Food Security",
    fundType: "Designated",
    isDesignated: true,
    currency: "CAD",
    totalCost: 85000,
    amountDisbursed: 60000,
    reportedSpend: 55000,
    startDate: "2024-01-15",
    endDate: "2024-12-15",
    status: "On-Track",
    followUpNeeded: false,
  },
  {
    id: "2",
    projectName: "School Building Initiative",
    country: "Haiti",
    partnerName: "Food For The Poor - Haiti",
    impactArea: "Education",
    fundType: "Designated",
    isDesignated: true,
    currency: "USD",
    totalCost: 120000,
    amountDisbursed: 75000,
    reportedSpend: 70000,
    startDate: "2024-02-01",
    endDate: "2025-01-31",
    status: "Delayed",
    followUpNeeded: true,
  },
  {
    id: "3",
    projectName: "Healthcare Clinic Support",
    country: "Guyana",
    partnerName: "Food For The Poor - Guyana",
    impactArea: "Health",
    fundType: "Undesignated",
    isDesignated: false,
    currency: "CAD",
    totalCost: 95000,
    amountDisbursed: 40000,
    reportedSpend: 38000,
    startDate: "2024-03-01",
    endDate: "2024-11-30",
    status: "On-Track",
    followUpNeeded: false,
  },
  {
    id: "4",
    projectName: "Housing Development Project",
    country: "Honduras",
    partnerName: "Food For The Poor - Honduras",
    impactArea: "Housing & Community",
    fundType: "Designated",
    isDesignated: true,
    currency: "USD",
    totalCost: 200000,
    amountDisbursed: 150000,
    reportedSpend: 145000,
    startDate: "2023-10-01",
    endDate: "2024-09-30",
    status: "Completed",
    followUpNeeded: false,
  },
];

export const useProjectData = () => {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [notes, setNotes] = useState<ProjectNote[]>([]);

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

  const addNote = (note: Omit<ProjectNote, "id">) => {
    const newNote: ProjectNote = {
      ...note,
      id: Date.now().toString(),
    };
    setNotes(prev => [...prev, newNote]);
  };

  const getNotesForProject = (projectId: string) => {
    return notes.filter(note => note.projectId === projectId);
  };

  return {
    projects,
    notes,
    addProject,
    updateProject,
    addNote,
    getNotesForProject,
  };
};
