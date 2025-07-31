import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ProgramInfoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const programDetails = [
  {
    impactArea: "Food Security",
    programName: "Sustainable Nutrition & Food Access",
    projects: "School feeding, container shipments, gardens, poultry initiatives",
    description: "Focuses on reliable, community-based solutions to hunger"
  },
  {
    impactArea: "Health",
    programName: "Community Health & WASH Systems",
    projects: "Medical shipments, clinics, mental health pilots, clean water systems",
    description: "Integrates medical aid, preventive care, and sanitation infrastructure"
  },
  {
    impactArea: "Education",
    programName: "Access to Quality Education",
    projects: "School builds, early childhood support, literacy programs, scholarships",
    description: "Emphasizes foundational learning and long-term educational access"
  },
  {
    impactArea: "Housing & Community Development",
    programName: "Infrastructure for Resilient Communities",
    projects: "Home construction, latrines, community centers, school infrastructure",
    description: "Supports physical and social structures that foster stability"
  },
  {
    impactArea: "Livelihoods & Economic Empowerment",
    programName: "Economic Inclusion & Livelihoods",
    projects: "Vocational training, women's income programs, agri-enterprise",
    description: "Drives self-sufficiency through income generation and skills development"
  },
  {
    impactArea: "Emergency Relief",
    programName: "Humanitarian Response & Recovery",
    projects: "Disaster kits, water tablets, emergency housing, post-crisis recovery",
    description: "Provides urgent assistance while supporting long-term recovery"
  }
];

const ProgramInfoDialog = ({ open, onOpenChange }: ProgramInfoDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Program Information Reference</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 md:grid-cols-2">
          {programDetails.map((program, index) => (
            <Card key={index} className="h-fit">
              <CardHeader className="pb-3">
                <div className="space-y-2">
                  <Badge variant="secondary" className="w-fit">
                    Impact Area: {program.impactArea}
                  </Badge>
                  <CardTitle className="text-lg leading-tight">
                    {program.programName}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Projects:</h4>
                  <p className="text-sm">{program.projects}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Focus:</h4>
                  <p className="text-sm italic">{program.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProgramInfoDialog;