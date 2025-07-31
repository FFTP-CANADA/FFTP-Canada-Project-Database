import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Project } from "@/types/project";
import DisbursementSchedule from "./DisbursementSchedule";
import { useProjectMilestones } from "@/hooks/useProjectMilestones";

interface ProjectDisbursementDialogProps {
  project: Project | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ProjectDisbursementDialog = ({ project, open, onOpenChange }: ProjectDisbursementDialogProps) => {
  const { milestones } = useProjectMilestones();

  if (!project) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-blue-900">
            Disbursement Schedule - {project.projectName}
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <DisbursementSchedule 
            projects={[project]} 
            milestones={milestones.filter(m => m.projectId === project.id)} 
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectDisbursementDialog;