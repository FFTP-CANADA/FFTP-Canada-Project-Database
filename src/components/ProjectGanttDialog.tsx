
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
  const { getMilestonesForProject, projects } = useProjectData();

  if (!project) return null;

  // Always use the most current project data from global state to reflect real-time updates
  const currentProject = projects.find(p => p.id === project.id) || project;
  const milestones = getMilestonesForProject(project.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Project Timeline - {currentProject.projectName}</DialogTitle>
        </DialogHeader>
        <ProjectGanttChart
          project={currentProject}
          milestones={milestones}
        />
      </DialogContent>
    </Dialog>
  );
};

export default ProjectGanttDialog;
