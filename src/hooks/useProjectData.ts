
import { useSupabaseProjects as useProjects } from "./useSupabaseProjects";
import { BackupManager } from "@/utils/backupManager";
import { useProjectNotes } from "./useProjectNotes";
import { useProjectAttachments } from "./useProjectAttachments";
import { useProjectPhotos } from "./useProjectPhotos";
import { useProjectMilestones } from "./useProjectMilestones";
import { usePrograms } from "./usePrograms";
import { migrateDisbursedAmounts } from "@/utils/migrateDisbursedAmounts";

export const useProjectData = () => {
  const projectsHook = useProjects();
  const notesHook = useProjectNotes();
  const attachmentsHook = useProjectAttachments();
  const photosHook = useProjectPhotos();
  const milestonesHook = useProjectMilestones();
  const programsHook = usePrograms();

  return {
    ...projectsHook,
    ...notesHook,
    ...attachmentsHook,
    ...photosHook,
    ...milestonesHook,
    ...programsHook,
  };
};

// Initialize auto-backup system and migration
BackupManager.initializeAutoBackup();

// Run one-time migration for disbursed amounts
migrateDisbursedAmounts();

// Re-export types for backwards compatibility
export type { Project, ProjectMilestone, ProjectNote, ProjectAttachment, ProjectPhoto } from "@/types/project";
export { PROGRAM_OPTIONS } from "@/constants/programs";
