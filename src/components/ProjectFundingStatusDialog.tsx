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
  const { getMilestonesForProject } = useProjectData();

  if (!project) return null;

  const milestones = getMilestonesForProject(project.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Funding Status - {project.projectName}</DialogTitle>
        </DialogHeader>
        <ProjectFundingStatus
          project={project}
          milestones={milestones}
          onUpdateProject={onUpdateProject}
        />
      </DialogContent>
    </Dialog>
  );
};

export default ProjectFundingStatusDialog;