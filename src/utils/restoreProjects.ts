import { LocalStorageManager } from "./localStorageManager";
import { Project } from "@/types/project";

export const restorePortKaituma = async () => {
  const portKaitumaProject: Project = {
    id: "5",
    projectName: "Port Kaituma Adult Literacy and Numeracy",
    country: "Guyana",
    partnerName: "Food For The Poor - Guyana",
    impactArea: "Education",
    fundType: "Designated",
    isDesignated: true,
    currency: "CAD",
    totalCost: 75000,
    amountDisbursed: 75000,
    reportedSpend: 75000,
    startDate: "2024-01-01",
    endDate: "2024-12-31",
    status: "Completed",
    followUpNeeded: false,
    program: "Education Initiative",
  };

  const existingProjects = LocalStorageManager.getItem<Project[]>('projects', []);
  const projectExists = existingProjects.some(p => p.id === "5" || p.projectName === "Port Kaituma Adult Literacy and Numeracy");
  
  if (!projectExists) {
    const updatedProjects = [...existingProjects, portKaitumaProject];
    await LocalStorageManager.setItem('projects', updatedProjects);
    console.log("✅ Restored Port Kaituma project");
    window.location.reload(); // Force refresh to update all components
  } else {
    console.log("Port Kaituma project already exists");
  }
};

// Auto-restore on import
restorePortKaituma();