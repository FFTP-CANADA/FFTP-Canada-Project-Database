
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import FFTPMilestoneManager from "./FFTPMilestoneManager";
import { useProjectData } from "@/hooks/useProjectData";

interface ProjectMilestonesDialogProps {
  projectId: string;
  projectName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ProjectMilestonesDialog = ({
  projectId,
  projectName,
  open,
  onOpenChange,
}: ProjectMilestonesDialogProps) => {
  const { 
    getMilestonesForProject, 
    addMilestone, 
    updateMilestone, 
    deleteMilestone 
  } = useProjectData();

  const milestones = getMilestonesForProject(projectId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>FFTP-Canada Monitoring Milestones - {projectName}</DialogTitle>
        </DialogHeader>
        <FFTPMilestoneManager
          projectId={projectId}
          milestones={milestones}
          onAddMilestone={addMilestone}
          onUpdateMilestone={updateMilestone}
          onDeleteMilestone={deleteMilestone}
        />
      </DialogContent>
    </Dialog>
  );
};

export default ProjectMilestonesDialog;
