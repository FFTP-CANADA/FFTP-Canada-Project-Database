import { LocalStorageManager } from "./localStorageManager";
import { Project } from "@/types/project";

// Cleanup function to remove duplicate Port Kaituma projects
export const cleanupPortKaitumaProjects = async () => {
  const existingProjects = LocalStorageManager.getItem<Project[]>('projects', []);
  
  // Find all Port Kaituma projects
  const portKaitumaProjects = existingProjects.filter(p => 
    p.projectName.includes('Port Kaituma') || 
    p.projectName.includes('Kaituma')
  );
  
  if (portKaitumaProjects.length > 1) {
    console.log(`🧹 Found ${portKaitumaProjects.length} Port Kaituma projects, cleaning up...`);
    
    // Keep only the one with the highest ID (most recent timestamp)
    const latestProject = portKaitumaProjects.sort((a, b) => 
      parseInt(b.id) - parseInt(a.id)
    )[0];
    
    // Remove all Port Kaituma projects except the latest
    const cleanedProjects = existingProjects.filter(p => 
      !(p.projectName.includes('Port Kaituma') || p.projectName.includes('Kaituma')) ||
      p.id === latestProject.id
    );
    
    await LocalStorageManager.setItem('projects', cleanedProjects);
    console.log(`✅ Kept only the latest Port Kaituma project (ID: ${latestProject.id})`);
    console.log(`🗑️ Removed ${portKaitumaProjects.length - 1} duplicate(s)`);
    
    return latestProject.id;
  } else {
    console.log('✅ No duplicate Port Kaituma projects found');
    return portKaitumaProjects[0]?.id;
  }
};

export const restorePortKaituma = async () => {
  console.log("Port Kaituma restore function called but disabled to prevent conflicts");
  // Function kept for backwards compatibility but no longer auto-executes
};

// Auto-cleanup on import
cleanupPortKaitumaProjects();