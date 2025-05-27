import { useState } from "react";

export interface Project {
  id: string;
  projectName: string;
  country?: "Jamaica" | "Guyana" | "Haiti" | "Honduras" | "Canada";
  partnerName?: string;
  impactArea: "Food Security" | "Education" | "Housing & Community" | "Health" | "Economic Empowerment";
  fundType: "Designated" | "Undesignated";
  isDesignated: boolean;
  currency: "CAD" | "USD";
  totalCost?: number;
  amountDisbursed: number;
  reportedSpend: number;
  startDate: string;
  endDate?: string;
  status: "On-Track" | "Delayed" | "Pending Start" | "Completed" | "Cancelled" | "Needs Attention";
  followUpNeeded: boolean;
  program?: string;
}

export interface ProjectNote {
  id: string;
  projectId: string;
  content: string;
  dateOfNote: string;
}

export interface ProjectAttachment {
  id: string;
  projectId: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  uploadDate: string;
  fileType: string;
}

export interface ProjectPhoto {
  id: string;
  projectId: string;
  photoUrl: string;
  caption?: string;
  uploadDate: string;
}

export const PROGRAM_OPTIONS = [
  "Emergency Response",
  "Community Development",
  "Education Initiative",
  "Healthcare Support",
  "Housing Development",
  "Food Security Program",
  "Economic Empowerment",
  "Infrastructure Development"
];

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
    program: "Food Security Program",
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
    program: "Education Initiative",
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
    program: "Healthcare Support",
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
    program: "Housing Development",
  },
];

export const useProjectData = () => {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [notes, setNotes] = useState<ProjectNote[]>([]);
  const [attachments, setAttachments] = useState<ProjectAttachment[]>([]);
  const [photos, setPhotos] = useState<ProjectPhoto[]>([]);
  const [customPrograms, setCustomPrograms] = useState<string[]>([]);

  const allPrograms = [...PROGRAM_OPTIONS, ...customPrograms];

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

  const addAttachment = (attachment: Omit<ProjectAttachment, "id">) => {
    const newAttachment: ProjectAttachment = {
      ...attachment,
      id: Date.now().toString(),
    };
    setAttachments(prev => [...prev, newAttachment]);
  };

  const getAttachmentsForProject = (projectId: string) => {
    return attachments.filter(attachment => attachment.projectId === projectId);
  };

  const addPhoto = (photo: Omit<ProjectPhoto, "id">) => {
    const newPhoto: ProjectPhoto = {
      ...photo,
      id: Date.now().toString(),
    };
    setPhotos(prev => [...prev, newPhoto]);
  };

  const getPhotosForProject = (projectId: string) => {
    return photos.filter(photo => photo.projectId === projectId);
  };

  const addProgram = (program: string) => {
    if (!allPrograms.includes(program)) {
      setCustomPrograms(prev => [...prev, program]);
    }
  };

  const deleteProgram = (program: string) => {
    // Only allow deletion of custom programs, not default ones
    if (customPrograms.includes(program)) {
      setCustomPrograms(prev => prev.filter(p => p !== program));
      // Remove program from projects that use it
      setProjects(prev => prev.map(p => 
        p.program === program ? { ...p, program: undefined } : p
      ));
    }
  };

  return {
    projects,
    notes,
    attachments,
    photos,
    allPrograms,
    addProject,
    updateProject,
    addNote,
    getNotesForProject,
    addAttachment,
    getAttachmentsForProject,
    addPhoto,
    getPhotosForProject,
    addProgram,
    deleteProgram,
  };
};
