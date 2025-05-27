
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Project, PROGRAM_OPTIONS } from "@/hooks/useProjectData";

interface ProjectEditDialogProps {
  project: Project | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateProject: (id: string, updates: Partial<Project>) => void;
  availablePrograms: string[];
}

const ProjectEditDialog = ({ 
  project, 
  open, 
  onOpenChange, 
  onUpdateProject,
  availablePrograms 
}: ProjectEditDialogProps) => {
  const [formData, setFormData] = useState<Partial<Project>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (project) {
      onUpdateProject(project.id, formData);
      onOpenChange(false);
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
                defaultValue={project.projectName}
                onChange={(e) => setFormData(prev => ({ ...prev, projectName: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="partnerName">Partner Name (Optional)</Label>
              <Input
                id="partnerName"
                defaultValue={project.partnerName || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, partnerName: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="country">Country (Optional)</Label>
              <Select
                defaultValue={project.country || ""}
                onValueChange={(value) => setFormData(prev => ({ ...prev, country: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No country</SelectItem>
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
                defaultValue={project.program || ""}
                onValueChange={(value) => setFormData(prev => ({ ...prev, program: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select program" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No program</SelectItem>
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
                defaultValue={project.impactArea}
                onValueChange={(value) => setFormData(prev => ({ ...prev, impactArea: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Food Security">Food Security</SelectItem>
                  <SelectItem value="Education">Education</SelectItem>
                  <SelectItem value="Housing & Community">Housing & Community</SelectItem>
                  <SelectItem value="Health">Health</SelectItem>
                  <SelectItem value="Economic Empowerment">Economic Empowerment</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                defaultValue={project.status}
                onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
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

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="currency">Currency</Label>
              <Select
                defaultValue={project.currency}
                onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
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
                defaultValue={project.totalCost || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, totalCost: e.target.value ? Number(e.target.value) : undefined }))}
              />
            </div>

            <div>
              <Label htmlFor="amountDisbursed">Amount Disbursed</Label>
              <Input
                id="amountDisbursed"
                type="number"
                defaultValue={project.amountDisbursed}
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
                defaultValue={project.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="endDate">End Date (Optional)</Label>
              <Input
                id="endDate"
                type="date"
                defaultValue={project.endDate || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                defaultChecked={project.followUpNeeded}
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
