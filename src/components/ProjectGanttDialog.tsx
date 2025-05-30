
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ProjectGanttChart from "./ProjectGanttChart";
import { useProjectData } from "@/hooks/useProjectData";
import { Project } from "@/types/project";

interface ProjectGanttDialogProps {
  project: Project | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ProjectGanttDialog = ({
  project,
  open,
  onOpenChange,
}: ProjectGanttDialogProps) => {
  const { getMilestonesForProject } = useProjectData();

  if (!project) return null;

  const milestones = getMilestonesForProject(project.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Project Timeline - {project.projectName}</DialogTitle>
        </DialogHeader>
        <ProjectGanttChart
          project={project}
          milestones={milestones}
        />
      </DialogContent>
    </Dialog>
  );
};

export default ProjectGanttDialog;
