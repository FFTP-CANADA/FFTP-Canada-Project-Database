import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ProjectFundingStatus from "./ProjectFundingStatus";
import { useProjectData } from "@/hooks/useProjectData";
import { Project } from "@/types/project";

interface ProjectFundingStatusDialogProps {
  project: Project | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateProject?: (id: string, updates: Partial<Project>) => void;
}

const ProjectFundingStatusDialog = ({
  project,
  open,
  onOpenChange,
  onUpdateProject,
}: ProjectFundingStatusDialogProps) => {
  const { getMilestonesForProject, projects } = useProjectData();

  if (!project) return null;

  // Always use the most current project data from global state to reflect real-time updates
  const currentProject = projects.find(p => p.id === project.id) || project;
  const milestones = getMilestonesForProject(project.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-[90vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Funding Status - {currentProject.projectName}</DialogTitle>
        </DialogHeader>
        <ProjectFundingStatus
          project={currentProject}
          milestones={milestones}
          onUpdateProject={onUpdateProject}
        />
      </DialogContent>
    </Dialog>
  );
};

export default ProjectFundingStatusDialog;