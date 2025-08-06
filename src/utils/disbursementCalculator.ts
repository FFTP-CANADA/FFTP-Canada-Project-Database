import { ProjectMilestone } from "@/types/project";

export const isDisbursementMilestone = (milestoneType?: string): boolean => {
  if (!milestoneType) return false;
  return milestoneType.includes("Disbursement");
};

export const calculateProjectDisbursedAmount = (milestones: ProjectMilestone[]): number => {
  return milestones
    .filter(milestone => 
      milestone.status === "Completed" && 
      isDisbursementMilestone(milestone.milestoneType) &&
      milestone.disbursementAmount
    )
    .reduce((total, milestone) => total + (milestone.disbursementAmount || 0), 0);
};