
export type GovernanceType = "AGENCY AGREEMENT" | "LOD";

export interface Project {
  id: string;
  projectName: string;
  country?: "Jamaica" | "Guyana" | "Haiti" | "Honduras" | "Canada";
  cityParish?: string;
  partnerName?: string;
  impactArea: "Food Security" | "Education" | "Housing & Community" | "Health" | "Economic Empowerment" | "Greatest Needs";
  fundType: "Designated" | "Undesignated";
  isDesignated: boolean;
  currency: "CAD" | "USD";
  totalCost?: number;
  amountDisbursed: number;
  reportedSpend: number;
  startDate: string;
  endDate?: string;
  status: "On-Track" | "Delayed" | "Pending Start" | "Completed" | "Cancelled" | "Needs Attention";
  activeStatus: "Active" | "Closed";
  followUpNeeded: boolean;
  program?: string;
  governanceType?: GovernanceType;
  governanceNumber?: string;
  assignedAdmin?: string; // User ID of the admin who can edit this project
}

export type FFTPMilestoneType = 
  | "Governance Document Signed"
  | "First Disbursement Sent"
  | "Interim Report & Receipts Submitted (following Installment #1)"
  | "Second Disbursement Sent"
  | "Receipts Received & Verified (Second Tranche)"
  | "Third Disbursement Sent"
  | "Receipts Received & Verified (Third Tranche)"
  | "Final Disbursement Sent"
  | "Final Report and Receipts Submitted"
  | "Interim Report Submitted to Donor Engagement Personnel"
  | "Post Narrative Report Submitted to Donor Engagement Personnel"
  | "Final Report Submitted to Donor Engagement Personnel"
  | "Donor Received Interim Report"
  | "Donor Received Final Report"
  | "Donor Received Narrative Report";

export interface ProjectMilestone {
  id: string;
  projectId: string;
  title: string;
  milestoneType?: FFTPMilestoneType;
  description?: string;
  startDate: string;
  dueDate: string;
  completedDate?: string;
  status: "Not Started" | "In Progress" | "Completed" | "Overdue";
  priority: "Low" | "Medium" | "High";
  disbursementAmount?: number; // For disbursement-type milestones
}

export interface ProjectNote {
  id: string;
  projectId: string;
  content: string;
  dateOfNote: string;
}

export interface ProjectAttachment {
  id: string;
  projectId: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  uploadDate: string;
  fileType: string;
}

export interface ProjectPhoto {
  id: string;
  projectId: string;
  photoUrl: string;
  caption?: string;
  uploadDate: string;
}
