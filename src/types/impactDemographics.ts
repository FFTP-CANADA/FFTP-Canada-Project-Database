export interface ImpactDemographics {
  id: string;
  projectId: string;
  projectName: string;
  agencyAgreementNumber: string;
  region: "Regional" | "Urban";
  directParticipants: number;
  indirectParticipants: number;
  createdDate: string;
  updatedDate: string;
}

export type ImpactDemographicsInput = Omit<ImpactDemographics, "id" | "createdDate" | "updatedDate">;