import { LocalStorageManager } from "@/utils/localStorageManager";
import { ImpactDemographics } from "@/types/impactDemographics";

export class ImpactDemographicsManager {
  /**
   * Create impact demographics entry for a new project
   */
  static createForProject(
    projectId: string,
    projectName: string,
    governanceNumber?: string
  ): void {
    // Get existing impact data
    const existingData = LocalStorageManager.getItem<ImpactDemographics[]>('impactDemographics', []);
    
    // Check if this project already has impact data
    const existingEntry = existingData.find(item => item.projectId === projectId);
    if (existingEntry) {
      console.log(`Impact demographics already exists for project ${projectId}`);
      return;
    }

    // Create new impact demographics entry
    const newEntry: ImpactDemographics = {
      id: `impact-${projectId}`,
      projectId,
      projectName,
      governanceNumber: governanceNumber || "N/A",
      region: "Urban",
      directParticipants: 0,
      indirectParticipants: 0,
      notes: "",
    };

    // Add to existing data and save
    const updatedData = [...existingData, newEntry];
    LocalStorageManager.setItem('impactDemographics', updatedData);
    
    // Dispatch custom event to notify all components
    window.dispatchEvent(new CustomEvent('impact-demographics-updated', {
      detail: { data: updatedData, newEntry }
    }));
    
    console.log(`✅ Created impact demographics for project: ${projectName}`);
  }

  /**
   * Bulk sync impact demographics for multiple projects
   */
  static syncWithProjects(projects: any[]): void {
    console.log(`🔄 Syncing impact demographics with ${projects.length} projects`);
    const existingData = LocalStorageManager.getItem<ImpactDemographics[]>('impactDemographics', []);
    console.log(`📊 Found ${existingData.length} existing impact demographic entries`);
    
    const existingProjectIds = existingData.map(item => item.projectId);
    const newEntries: ImpactDemographics[] = [];

    projects.forEach(project => {
      if (!existingProjectIds.includes(project.id)) {
        console.log(`➕ Creating impact demographics for project: ${project.projectName}`);
        newEntries.push({
          id: `impact-${project.id}`,
          projectId: project.id,
          projectName: project.projectName,
          governanceNumber: project.governanceNumber || "N/A",
          region: "Urban",
          directParticipants: 0,
          indirectParticipants: 0,
          notes: "",
        });
      } else {
        console.log(`✓ Impact demographics already exists for project: ${project.projectName}`);
      }
    });

    if (newEntries.length > 0) {
      const updatedData = [...existingData, ...newEntries];
      LocalStorageManager.setItem('impactDemographics', updatedData);
      
      // Dispatch custom event
      window.dispatchEvent(new CustomEvent('impact-demographics-updated', {
        detail: { data: updatedData, newEntries }
      }));
      
      console.log(`✅ Synced ${newEntries.length} new impact demographics entries`);
    } else {
      console.log(`✅ All projects already have impact demographics - no sync needed`);
    }
  }
}