export interface UndesignatedFund {
  id: string;
  impactArea: "Food Security" | "Education" | "Housing & Community" | "Health" | "Economic Empowerment" | "Greatest Needs";
  balance: number;
  currency: "CAD" | "USD";
  lastUpdated: string;
  notes?: string;
}

export interface FundReallocationToPledge {
  id: string;
  fromUndesignatedFundId: string;
  toProjectId: string;
  amount: number;
  currency: "CAD" | "USD";
  reallocationDate: string;
  reason?: string;
  approvedBy?: string;
  status: "Pending" | "Approved" | "Completed" | "Cancelled";
}