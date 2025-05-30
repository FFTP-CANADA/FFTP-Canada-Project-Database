
export interface Project {
  id: string;
  projectName: string;
  country?: "Jamaica" | "Guyana" | "Haiti" | "Honduras" | "Canada";
  partnerName?: string;
  impactArea: "Food Security" | "Education" | "Housing & Community" | "Health" | "Economic Empowerment";
  fundType: "Designated" | "Undesignated";
  isDesignated: boolean;
  currency: "CAD" | "USD";
  totalCost?: number;
  amountDisbursed: number;
  reportedSpend: number;
  startDate: string;
  endDate?: string;
  status: "On-Track" | "Delayed" | "Pending Start" | "Completed" | "Cancelled" | "Needs Attention";
  followUpNeeded: boolean;
  program?: string;
}

export type FFTPMilestoneType = 
  | "MOU Signed"
  | "First Disbursement Sent"
  | "Receipts Received & Verified (First Tranche)"
  | "Second Disbursement Sent"
  | "Receipts Received & Verified (Second Tranche)"
  | "Third Disbursement Sent"
  | "Receipts Received & Verified (Third Tranche)"
  | "Final Disbursement Sent"
  | "Final Report Pending (Due within 6 months)"
  | "Final Report Submitted to Partnerships & Donor Engagement Officer";

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
