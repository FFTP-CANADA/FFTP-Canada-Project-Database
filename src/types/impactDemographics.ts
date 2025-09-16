export interface ImpactDemographics {
  id: string;
  projectId: string;
  projectName: string;
  governanceNumber: string;
  region: "Urban" | "Rural";
  directParticipants: number;
  indirectParticipants: number;
}