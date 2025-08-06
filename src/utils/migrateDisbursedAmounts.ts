import { LocalStorageManager } from "./localStorageManager";
import { calculateProjectDisbursedAmount } from "./disbursementCalculator";
import { Project, ProjectMilestone } from "@/types/project";

export const migrateDisbursedAmounts = async (): Promise<void> => {
  try {
    // Check if migration has already been run
    const migrationKey = 'disbursed-amounts-migrated';
    const hasMigrated = LocalStorageManager.getItem(migrationKey, false);
    
    if (hasMigrated) {
      console.log('✅ Disbursed amounts migration already completed');
      return;
    }

    console.log('🔄 Starting disbursed amounts migration...');

    // Get all projects and milestones
    const projects: Project[] = LocalStorageManager.getItem('projects', []);
    const milestones: ProjectMilestone[] = LocalStorageManager.getItem('project-milestones', []);

    if (projects.length === 0) {
      console.log('✅ No projects to migrate');
      await LocalStorageManager.setItem(migrationKey, true);
      return;
    }

    // Update each project's disbursed amount
    const updatedProjects = projects.map(project => {
      const projectMilestones = milestones.filter(m => m.projectId === project.id);
      const calculatedAmount = calculateProjectDisbursedAmount(projectMilestones);
      
      console.log(`📊 Project "${project.projectName}": Old amount: ${project.amountDisbursed}, New amount: ${calculatedAmount}`);
      
      return {
        ...project,
        amountDisbursed: calculatedAmount
      };
    });

    // Save updated projects
    await LocalStorageManager.setItem('projects', updatedProjects);
    await LocalStorageManager.setItem(migrationKey, true);

    console.log(`✅ Successfully migrated disbursed amounts for ${projects.length} projects`);
    
    // Trigger project update event to refresh UI
    window.dispatchEvent(new CustomEvent('projects-updated', { detail: updatedProjects }));
    
  } catch (error) {
    console.error('❌ Error during disbursed amounts migration:', error);
  }
};