
import { useProjects } from "./useProjects";
import "../utils/restoreProjects"; // Auto-restore Port Kaituma project
import { useProjectNotes } from "./useProjectNotes";
import { useProjectAttachments } from "./useProjectAttachments";
import { useProjectPhotos } from "./useProjectPhotos";
import { useProjectMilestones } from "./useProjectMilestones";
import { usePrograms } from "./usePrograms";

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

// Re-export types for backwards compatibility
export type { Project, ProjectMilestone, ProjectNote, ProjectAttachment, ProjectPhoto } from "@/types/project";
export { PROGRAM_OPTIONS } from "@/constants/programs";
