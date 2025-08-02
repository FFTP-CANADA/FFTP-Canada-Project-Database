
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Project, PROGRAM_OPTIONS } from "@/hooks/useProjectData";
import { useToast } from "@/hooks/use-toast";

interface ProjectEditDialogProps {
  project: Project | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateProject: (id: string, updates: Partial<Project>) => void;
  availablePrograms: string[];
  validateGovernanceNumber?: (governanceNumber: string, governanceType: string, excludeId?: string) => boolean;
}

const ProjectEditDialog = ({ 
  project, 
  open, 
  onOpenChange, 
  onUpdateProject,
  availablePrograms,
  validateGovernanceNumber
}: ProjectEditDialogProps) => {
  const [formData, setFormData] = useState<Partial<Project>>({});
  const { toast } = useToast();

  // Initialize form data when project changes
  useEffect(() => {
    if (project) {
      setFormData({
        projectName: project.projectName,
        partnerName: project.partnerName,
        country: project.country,
        program: project.program,
        impactArea: project.impactArea,
        status: project.status,
        currency: project.currency,
        totalCost: project.totalCost,
        amountDisbursed: project.amountDisbursed,
        startDate: project.startDate,
        endDate: project.endDate,
        followUpNeeded: project.followUpNeeded,
        governanceType: project.governanceType,
        governanceNumber: project.governanceNumber
      });
    }
  }, [project]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (project) {
      // Validate governance number if provided
      if (formData.governanceType && formData.governanceNumber && validateGovernanceNumber) {
        if (!validateGovernanceNumber(formData.governanceNumber, formData.governanceType, project.id)) {
          toast({
            title: "Validation Error",
            description: `A project with ${formData.governanceType} number "${formData.governanceNumber}" already exists`,
            variant: "destructive",
          });
          return;
        }
      }

      // Convert "none" values back to undefined for optional fields
      const updates = Object.fromEntries(
        Object.entries(formData).filter(([_, value]) => value !== undefined).map(([key, value]) => [
          key, 
          (key === 'country' || key === 'program') && value === 'none' ? undefined : value
        ])
      );
      
      try {
        onUpdateProject(project.id, updates);
        onOpenChange(false);
        
        toast({
          title: "Project Updated",
          description: `${project.projectName} has been updated successfully.`,
        });
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to update project",
          variant: "destructive",
        });
      }
    }
  };

  if (!project) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Project: {project.projectName}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="projectName">Project Name</Label>
              <Input
                id="projectName"
                value={formData.projectName || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, projectName: e.target.value }))}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="partnerName">Partner Name (Optional)</Label>
              <Input
                id="partnerName"
                value={formData.partnerName || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, partnerName: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="country">Country (Optional)</Label>
              <Select
                value={formData.country || "none"}
                onValueChange={(value) => setFormData(prev => ({ ...prev, country: value === "none" ? undefined : value as any }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No country</SelectItem>
                  <SelectItem value="Canada">Canada</SelectItem>
                  <SelectItem value="Jamaica">Jamaica</SelectItem>
                  <SelectItem value="Guyana">Guyana</SelectItem>
                  <SelectItem value="Haiti">Haiti</SelectItem>
                  <SelectItem value="Honduras">Honduras</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="program">Program (Optional)</Label>
              <Select
                value={formData.program || "none"}
                onValueChange={(value) => setFormData(prev => ({ ...prev, program: value === "none" ? undefined : value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select program" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No program</SelectItem>
                  {availablePrograms.map(program => (
                    <SelectItem key={program} value={program}>{program}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="impactArea">Impact Area</Label>
              <Select
                value={formData.impactArea || "Food Security"}
                onValueChange={(value) => setFormData(prev => ({ ...prev, impactArea: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select impact area" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Food Security">Food Security</SelectItem>
                  <SelectItem value="Education">Education</SelectItem>
                  <SelectItem value="Housing & Community">Housing & Community</SelectItem>
                  <SelectItem value="Health">Health</SelectItem>
                  <SelectItem value="Economic Empowerment">Economic Empowerment</SelectItem>
                  <SelectItem value="Greatest Needs">Greatest Needs</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status || "On-Track"}
                onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="On-Track">On-Track</SelectItem>
                  <SelectItem value="Delayed">Delayed</SelectItem>
                  <SelectItem value="Pending Start">Pending Start</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                  <SelectItem value="Needs Attention">Needs Attention</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="governanceType">Governance Type</Label>
              <Select
                value={formData.governanceType || "none"}
                onValueChange={(value) => setFormData(prev => ({ ...prev, governanceType: value === "none" ? undefined : value as any }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select governance type" />
                </SelectTrigger>
                <SelectContent className="bg-white z-50">
                  <SelectItem value="none">No governance</SelectItem>
                  <SelectItem value="MOU">MOU</SelectItem>
                  <SelectItem value="AGENCY AGREEMENT">AGENCY AGREEMENT</SelectItem>
                  <SelectItem value="LOD">LOD</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="governanceNumber">Governance Number</Label>
              <Input
                id="governanceNumber"
                value={formData.governanceNumber || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, governanceNumber: e.target.value }))}
                disabled={!formData.governanceType}
                placeholder="Enter governance number"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="currency">Currency</Label>
              <Select
                value={formData.currency || "CAD"}
                onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CAD">CAD</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="totalCost">Total Cost (Optional)</Label>
              <Input
                id="totalCost"
                type="number"
                value={formData.totalCost || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, totalCost: e.target.value ? Number(e.target.value) : undefined }))}
              />
            </div>

            <div>
              <Label htmlFor="amountDisbursed">Amount Disbursed</Label>
              <Input
                id="amountDisbursed"
                type="number"
                value={formData.amountDisbursed || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, amountDisbursed: Number(e.target.value) }))}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="endDate">End Date (Optional)</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.followUpNeeded || false}
                onChange={(e) => setFormData(prev => ({ ...prev, followUpNeeded: e.target.checked }))}
              />
              <span>Follow-up needed</span>
            </label>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectEditDialog;
