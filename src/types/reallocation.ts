export interface FundReallocation {
  id: string;
  fromProjectId: string;
  fromProjectName: string;
  toProjectId: string;
  toProjectName: string;
  amount: number;
  currency: "CAD" | "USD";
  reallocationDate: string;
  reason?: string;
  approvedBy?: string;
  status: "Pending" | "Approved" | "Completed" | "Cancelled";
}

export interface ReallocationSummary {
  projectId: string;
  projectName: string;
  totalAllocatedOut: number;
  totalAllocatedIn: number;
  netReallocation: number;
  currency: "CAD" | "USD";
}