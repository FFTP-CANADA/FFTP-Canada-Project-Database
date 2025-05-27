
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Project } from "@/hooks/useProjectData";
import { useToast } from "@/hooks/use-toast";

interface AddProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddProject: (project: Omit<Project, "id">) => void;
}

const AddProjectDialog = ({ open, onOpenChange, onAddProject }: AddProjectDialogProps) => {
  const [formData, setFormData] = useState({
    projectName: "",
    country: "",
    partnerName: "",
    impactArea: "",
    fundType: "",
    isDesignated: false,
    currency: "",
    totalCost: "",
    amountDisbursed: "",
    reportedSpend: "",
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
    status: "",
    followUpNeeded: false,
  });

  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.projectName || !formData.country || !formData.impactArea || !formData.status || !formData.startDate || !formData.endDate) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const project: Omit<Project, "id"> = {
      projectName: formData.projectName,
      country: formData.country as Project["country"],
      partnerName: formData.partnerName || `Food For The Poor - ${formData.country}`,
      impactArea: formData.impactArea as Project["impactArea"],
      fundType: formData.fundType as Project["fundType"],
      isDesignated: formData.isDesignated,
      currency: formData.currency as Project["currency"],
      totalCost: parseFloat(formData.totalCost) || 0,
      amountDisbursed: parseFloat(formData.amountDisbursed) || 0,
      reportedSpend: parseFloat(formData.reportedSpend) || 0,
      startDate: format(formData.startDate, "yyyy-MM-dd"),
      endDate: format(formData.endDate, "yyyy-MM-dd"),
      status: formData.status as Project["status"],
      followUpNeeded: formData.followUpNeeded,
    };

    onAddProject(project);
    
    // Reset form
    setFormData({
      projectName: "",
      country: "",
      partnerName: "",
      impactArea: "",
      fundType: "",
      isDesignated: false,
      currency: "",
      totalCost: "",
      amountDisbursed: "",
      reportedSpend: "",
      startDate: undefined,
      endDate: undefined,
      status: "",
      followUpNeeded: false,
    });
    
    onOpenChange(false);
    
    toast({
      title: "Success",
      description: "Project has been added successfully",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-blue-900">Add New Project</DialogTitle>
          <DialogDescription className="text-blue-600">
            Create a new charitable project to track across your programs.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="projectName" className="text-blue-900">Project Name *</Label>
              <Input
                id="projectName"
                value={formData.projectName}
                onChange={(e) => setFormData(prev => ({ ...prev, projectName: e.target.value }))}
                className="border-blue-200 focus:border-blue-400"
                placeholder="Enter project name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country" className="text-blue-900">Country *</Label>
              <Select 
                value={formData.country} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, country: value }))}
              >
                <SelectTrigger className="border-blue-200 focus:border-blue-400">
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Jamaica">Jamaica</SelectItem>
                  <SelectItem value="Guyana">Guyana</SelectItem>
                  <SelectItem value="Haiti">Haiti</SelectItem>
                  <SelectItem value="Honduras">Honduras</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="partnerName" className="text-blue-900">Partner Name</Label>
              <Input
                id="partnerName"
                value={formData.partnerName}
                onChange={(e) => setFormData(prev => ({ ...prev, partnerName: e.target.value }))}
                className="border-blue-200 focus:border-blue-400"
                placeholder="Auto-filled based on country"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="impactArea" className="text-blue-900">Impact Area *</Label>
              <Select 
                value={formData.impactArea} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, impactArea: value }))}
              >
                <SelectTrigger className="border-blue-200 focus:border-blue-400">
                  <SelectValue placeholder="Select impact area" />
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

            <div className="space-y-2">
              <Label htmlFor="fundType" className="text-blue-900">Fund Type</Label>
              <Select 
                value={formData.fundType} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, fundType: value }))}
              >
                <SelectTrigger className="border-blue-200 focus:border-blue-400">
                  <SelectValue placeholder="Select fund type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Designated">Designated</SelectItem>
                  <SelectItem value="Undesignated">Undesignated</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency" className="text-blue-900">Currency</Label>
              <Select 
                value={formData.currency} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}
              >
                <SelectTrigger className="border-blue-200 focus:border-blue-400">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CAD">CAD</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalCost" className="text-blue-900">Total Cost</Label>
              <Input
                id="totalCost"
                type="number"
                value={formData.totalCost}
                onChange={(e) => setFormData(prev => ({ ...prev, totalCost: e.target.value }))}
                className="border-blue-200 focus:border-blue-400"
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amountDisbursed" className="text-blue-900">Amount Disbursed</Label>
              <Input
                id="amountDisbursed"
                type="number"
                value={formData.amountDisbursed}
                onChange={(e) => setFormData(prev => ({ ...prev, amountDisbursed: e.target.value }))}
                className="border-blue-200 focus:border-blue-400"
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reportedSpend" className="text-blue-900">Reported Spend</Label>
              <Input
                id="reportedSpend"
                type="number"
                value={formData.reportedSpend}
                onChange={(e) => setFormData(prev => ({ ...prev, reportedSpend: e.target.value }))}
                className="border-blue-200 focus:border-blue-400"
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-blue-900">Start Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal border-blue-200 focus:border-blue-400",
                      !formData.startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.startDate ? format(formData.startDate, "PPP") : "Pick start date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.startDate}
                    onSelect={(date) => setFormData(prev => ({ ...prev, startDate: date }))}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label className="text-blue-900">End Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal border-blue-200 focus:border-blue-400",
                      !formData.endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.endDate ? format(formData.endDate, "PPP") : "Pick end date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.endDate}
                    onSelect={(date) => setFormData(prev => ({ ...prev, endDate: date }))}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status" className="text-blue-900">Status *</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger className="border-blue-200 focus:border-blue-400">
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

          <div className="flex items-center space-x-2">
            <Checkbox
              id="followUpNeeded"
              checked={formData.followUpNeeded}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, followUpNeeded: checked as boolean }))}
              className="border-blue-300"
            />
            <Label htmlFor="followUpNeeded" className="text-blue-900">Follow-up needed</Label>
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="border-blue-300 text-blue-600 hover:bg-blue-50"
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Add Project
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddProjectDialog;
