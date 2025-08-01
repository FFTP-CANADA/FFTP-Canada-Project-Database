import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Upload, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Project, PROGRAM_OPTIONS } from "@/hooks/useProjectData";
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
    program: "",
    governanceType: "",
    governanceNumber: "",
  });

  const [attachments, setAttachments] = useState<File[]>([]);
  const [photos, setPhotos] = useState<File[]>([]);

  const { toast } = useToast();

  const handleFileUpload = (files: FileList | null, type: 'attachments' | 'photos') => {
    if (!files) return;
    
    const fileArray = Array.from(files);
    if (type === 'attachments') {
      setAttachments(prev => [...prev, ...fileArray]);
    } else {
      setPhotos(prev => [...prev, ...fileArray]);
    }
  };

  const removeFile = (index: number, type: 'attachments' | 'photos') => {
    if (type === 'attachments') {
      setAttachments(prev => prev.filter((_, i) => i !== index));
    } else {
      setPhotos(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.projectName || !formData.impactArea || !formData.status || !formData.startDate || !formData.governanceType || !formData.governanceNumber) {
      toast({
        title: "Error",
        description: "Please fill in all required fields (Project Name, Impact Area, Status, Start Date, Governance Type, Governance Number)",
        variant: "destructive",
      });
      return;
    }

    // Validate governance number uniqueness if both type and number are provided
    if (formData.governanceType && formData.governanceNumber) {
      // We need access to the useProjects hook validation here
      // For now, we'll let the hook handle the validation and catch the error
    }

    const project: Omit<Project, "id"> = {
      projectName: formData.projectName,
      country: formData.country ? formData.country as Project["country"] : undefined,
      partnerName: formData.partnerName || undefined,
      impactArea: formData.impactArea as Project["impactArea"],
      fundType: formData.fundType as Project["fundType"],
      isDesignated: formData.isDesignated,
      currency: formData.currency as Project["currency"],
      totalCost: formData.totalCost ? parseFloat(formData.totalCost) : undefined,
      amountDisbursed: parseFloat(formData.amountDisbursed) || 0,
      reportedSpend: parseFloat(formData.reportedSpend) || 0,
      startDate: format(formData.startDate, "yyyy-MM-dd"),
      endDate: formData.endDate ? format(formData.endDate, "yyyy-MM-dd") : undefined,
      status: formData.status as Project["status"],
      followUpNeeded: formData.followUpNeeded,
      program: formData.program || undefined,
      governanceType: formData.governanceType as Project["governanceType"],
      governanceNumber: formData.governanceNumber || undefined,
    };

    try {
      onAddProject(project);
      
      // Reset form only if successful
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
        program: "",
        governanceType: "",
        governanceNumber: "",
      });
      setAttachments([]);
      setPhotos([]);
      
      onOpenChange(false);
      
      toast({
        title: "Success",
        description: "Project has been added successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add project",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-blue-900">Add New Project</DialogTitle>
          <DialogDescription className="text-blue-600">
            Create a new charitable project to track across your programs. Fields marked with * are required.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
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
              <Label htmlFor="governanceType" className="text-blue-900">Governance Type *</Label>
              <Select 
                value={formData.governanceType} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, governanceType: value }))}
              >
                <SelectTrigger className="border-blue-200 focus:border-blue-400">
                  <SelectValue placeholder="Select governance type" />
                </SelectTrigger>
                <SelectContent className="bg-white z-50">
                  <SelectItem value="MOU">MOU</SelectItem>
                  <SelectItem value="AGENCY AGREEMENT">AGENCY AGREEMENT</SelectItem>
                  <SelectItem value="LOD">LOD</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="governanceNumber" className="text-blue-900">Governance Number *</Label>
              <Input
                id="governanceNumber"
                value={formData.governanceNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, governanceNumber: e.target.value }))}
                className="border-blue-200 focus:border-blue-400"
                placeholder="Enter governance number"
                disabled={!formData.governanceType}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="program" className="text-blue-900">Program</Label>
              <Select 
                value={formData.program} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, program: value }))}
              >
                <SelectTrigger className="border-blue-200 focus:border-blue-400">
                  <SelectValue placeholder="Select program (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {PROGRAM_OPTIONS.map(program => (
                    <SelectItem key={program} value={program}>{program}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="country" className="text-blue-900">Country</Label>
              <Select 
                value={formData.country} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, country: value }))}
              >
                <SelectTrigger className="border-blue-200 focus:border-blue-400">
                  <SelectValue placeholder="Select country (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Canada">Canada</SelectItem>
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
                placeholder="Enter partner name (optional)"
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
                placeholder="0 (optional)"
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
              <Label className="text-blue-900">End Date</Label>
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
                    {formData.endDate ? format(formData.endDate, "PPP") : "Pick end date (optional)"}
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

          {/* File Upload Sections */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-blue-900">Project Documents</Label>
              <div className="border-2 border-dashed border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-center">
                  <label className="cursor-pointer flex flex-col items-center">
                    <Upload className="w-8 h-8 text-blue-400 mb-2" />
                    <span className="text-sm text-blue-600">Upload documents (optional)</span>
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      onChange={(e) => handleFileUpload(e.target.files, 'attachments')}
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
                    />
                  </label>
                </div>
                {attachments.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {attachments.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-blue-50 p-2 rounded">
                        <span className="text-sm text-blue-700">{file.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index, 'attachments')}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-blue-900">Project Photos</Label>
              <div className="border-2 border-dashed border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-center">
                  <label className="cursor-pointer flex flex-col items-center">
                    <Upload className="w-8 h-8 text-blue-400 mb-2" />
                    <span className="text-sm text-blue-600">Upload photos (optional)</span>
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      onChange={(e) => handleFileUpload(e.target.files, 'photos')}
                      accept="image/*"
                    />
                  </label>
                </div>
                {photos.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-2">
                    {photos.map((file, index) => (
                      <div key={index} className="relative">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={file.name}
                          className="w-full h-20 object-cover rounded"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute top-0 right-0 h-6 w-6 p-0 bg-red-500 hover:bg-red-600 text-white"
                          onClick={() => removeFile(index, 'photos')}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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
