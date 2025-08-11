import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Mail, FileText, Filter, Paperclip, Camera, Edit, Settings, Milestone, ChartGantt, Banknote, Calendar, Trash2, ArrowRightLeft } from "lucide-react";
import { Project } from "@/types/project";
import { useToast } from "@/hooks/use-toast";
import { formatWithExchange } from "@/utils/currencyUtils";
import { ProjectDeleteDialog } from "@/components/ProjectDeleteDialog";

interface ProjectsTableProps {
  projects: Project[];
  availablePrograms: string[];
  onOpenAttachments?: (projectId: string, projectName: string) => void;
  onOpenGallery?: (projectId: string, projectName: string) => void;
  onOpenNotes?: (projectId: string, projectName: string) => void;
  onOpenMilestones?: (projectId: string, projectName: string) => void;
  onOpenGantt?: (project: Project) => void;
  onOpenFunding?: (project: Project) => void;
  onOpenDisbursement?: (project: Project) => void;
  onEditProject?: (project: Project) => void;
  onDeleteProject?: (projectId: string) => void;
  onManagePrograms?: () => void;
  onOpenReallocation?: (project: Project) => void;
  donorPledges?: Array<{id: string; projectId: string; pledgedAmount: number}>;
  donorReceipts?: Array<{id: string; projectId: string; amount: number}>;
}

const ProjectsTable = ({ 
  projects, 
  availablePrograms,
  onOpenAttachments, 
  onOpenGallery,
  onOpenNotes,
  onOpenMilestones,
  onOpenGantt,
  onOpenFunding,
  onOpenDisbursement,
  onEditProject,
  onDeleteProject,
  onManagePrograms,
  onOpenReallocation,
  donorPledges = [],
  donorReceipts = []
}: ProjectsTableProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [countryFilter, setCountryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [impactAreaFilter, setImpactAreaFilter] = useState("all");
  const [programFilter, setProgramFilter] = useState("all");
  const [deleteDialog, setDeleteDialog] = useState<{open: boolean; projectId: string; projectName: string}>({
    open: false,
    projectId: "",
    projectName: ""
  });
  const { toast } = useToast();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "On-Track": return "bg-green-100 text-green-800 border-green-200";
      case "Delayed": return "bg-red-100 text-red-800 border-red-200";
      case "Pending Start": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Completed": return "bg-blue-100 text-blue-800 border-blue-200";
      case "Cancelled": return "bg-gray-100 text-gray-800 border-gray-200";
      case "Needs Attention": return "bg-orange-100 text-orange-800 border-orange-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPledgeStatus = (project: Project) => {
    const projectPledges = donorPledges.filter(pledge => pledge.projectId === project.id);
    const projectReceipts = donorReceipts.filter(receipt => receipt.projectId === project.id);
    const totalPledged = projectPledges.reduce((sum, pledge) => sum + pledge.pledgedAmount, 0);
    const totalReceived = projectReceipts.reduce((sum, receipt) => sum + receipt.amount, 0);
    const projectValue = project.totalCost || 0;
    const pledgeShortfall = projectValue - totalPledged;
    
    return {
      totalPledged,
      totalReceived,
      projectValue,
      pledgeShortfall,
      hasPledgeShortfall: pledgeShortfall > 0
    };
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (project.partnerName?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
                         (project.program?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesCountry = countryFilter === "all" || project.country === countryFilter;
    const matchesStatus = statusFilter === "all" || project.status === statusFilter;
    const matchesImpactArea = impactAreaFilter === "all" || project.impactArea === impactAreaFilter;
    const matchesProgram = programFilter === "all" || project.program === programFilter;
    
    return matchesSearch && matchesCountry && matchesStatus && matchesImpactArea && matchesProgram;
  });

  const handleSendFollowUp = (project: Project) => {
    toast({
      title: "Follow-up Email Sent",
      description: `Follow-up email sent for project: ${project.projectName}`,
    });
  };

  const handleDeleteClick = (project: Project) => {
    setDeleteDialog({
      open: true,
      projectId: project.id,
      projectName: project.projectName
    });
  };

  const handleConfirmDelete = () => {
    if (onDeleteProject) {
      onDeleteProject(deleteDialog.projectId);
    }
  };

  return (
    <div className="space-y-2">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-700">Filters:</span>
        </div>
        
        <Input
          placeholder="Search projects, partners, programs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-xs border-blue-200 focus:border-blue-400"
        />

        <Select value={countryFilter} onValueChange={setCountryFilter}>
          <SelectTrigger className="w-[140px] border-blue-200 focus:border-blue-400">
            <SelectValue placeholder="Country" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Countries</SelectItem>
            <SelectItem value="Canada">Canada</SelectItem>
            <SelectItem value="Jamaica">Jamaica</SelectItem>
            <SelectItem value="Guyana">Guyana</SelectItem>
            <SelectItem value="Haiti">Haiti</SelectItem>
            <SelectItem value="Honduras">Honduras</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px] border-blue-200 focus:border-blue-400">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="On-Track">On-Track</SelectItem>
            <SelectItem value="Delayed">Delayed</SelectItem>
            <SelectItem value="Pending Start">Pending Start</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
            <SelectItem value="Cancelled">Cancelled</SelectItem>
            <SelectItem value="Needs Attention">Needs Attention</SelectItem>
          </SelectContent>
        </Select>

        <Select value={impactAreaFilter} onValueChange={setImpactAreaFilter}>
          <SelectTrigger className="w-[180px] border-blue-200 focus:border-blue-400">
            <SelectValue placeholder="Impact Area" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Impact Areas</SelectItem>
            <SelectItem value="Food Security">Food Security</SelectItem>
            <SelectItem value="Education">Education</SelectItem>
            <SelectItem value="Housing & Community">Housing & Community</SelectItem>
            <SelectItem value="Health">Health</SelectItem>
            <SelectItem value="Economic Empowerment">Economic Empowerment</SelectItem>
            <SelectItem value="Greatest Needs">Greatest Needs</SelectItem>
          </SelectContent>
        </Select>

        <Select value={programFilter} onValueChange={setProgramFilter}>
          <SelectTrigger className="w-[140px] border-blue-200 focus:border-blue-400">
            <SelectValue placeholder="Program" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Programs</SelectItem>
            {availablePrograms.map(program => (
              <SelectItem key={program} value={program}>{program}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          onClick={onManagePrograms}
          className="border-blue-300 text-blue-600 hover:bg-blue-50"
        >
          <Settings className="w-4 h-4 mr-2" />
          Manage Programs
        </Button>
      </div>

      {/* Table */}
      <div className="border border-blue-200 rounded-lg overflow-x-auto">
        <Table className="w-full">
          <TableHeader className="bg-blue-600">
            <TableRow>
              <TableHead className="text-white px-6 text-center">Governance</TableHead>
              <TableHead className="text-white px-6 text-center">Project Name</TableHead>
              <TableHead className="text-white px-4 text-center">Program</TableHead>
              <TableHead className="text-white px-4 text-center">Country</TableHead>
              <TableHead className="text-white px-4 text-center">Impact Area</TableHead>
              <TableHead className="text-white px-4 text-center">Status</TableHead>
              <TableHead className="text-white px-4 text-center">Total Cost</TableHead>
              <TableHead className="text-white px-4 text-center">Pledged</TableHead>
              <TableHead className="text-white px-4 text-center">Received</TableHead>
              <TableHead className="text-white px-4 text-center">Pledge Gap</TableHead>
              <TableHead className="text-white px-4 text-center">Disbursed</TableHead>
              <TableHead className="text-white px-4 text-center">Balance Due</TableHead>
              <TableHead className="text-white px-4 text-center">Progress</TableHead>
              <TableHead className="text-white px-6 min-w-[400px] text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProjects.map((project) => {
              const pledgeStatus = getPledgeStatus(project);
              
              return (
              <TableRow key={project.id} className="hover:bg-blue-50">
                <TableCell className="text-blue-700 px-6">
                  {project.governanceType && project.governanceNumber ? (
                    <div className="text-sm">
                      <Badge variant="outline" className="text-xs">
                        {project.governanceType}
                      </Badge>
                      <div className="mt-1 font-mono text-xs">
                        {project.governanceNumber}
                      </div>
                    </div>
                  ) : (
                    "N/A"
                  )}
                </TableCell>
                <TableCell className="font-medium text-blue-900 px-6">
                  {project.projectName}
                  {project.followUpNeeded && (
                    <Badge variant="outline" className="ml-2 text-orange-600 border-orange-300">
                      Follow-up needed
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-blue-700">{project.program || "N/A"}</TableCell>
                <TableCell className="text-blue-700">{project.country || "N/A"}</TableCell>
                <TableCell className="text-blue-700">{project.impactArea}</TableCell>
                <TableCell>
                  <Badge className={getStatusColor(project.status)}>
                    {project.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-blue-900">
                  {project.totalCost ? formatWithExchange(project.totalCost, project.currency) : "N/A"}
                </TableCell>
                <TableCell className="text-blue-900">
                  {pledgeStatus.totalPledged > 0 ? formatWithExchange(pledgeStatus.totalPledged, project.currency) : "No pledges"}
                </TableCell>
                <TableCell className="text-blue-900">
                  {pledgeStatus.totalReceived > 0 ? (
                    <span className="text-green-600 font-medium">
                      {formatWithExchange(pledgeStatus.totalReceived, project.currency)}
                    </span>
                  ) : "No receipts"}
                </TableCell>
                <TableCell className="text-blue-900">
                  {pledgeStatus.hasPledgeShortfall ? (
                    <span className="text-red-600 font-medium">
                      -{formatWithExchange(pledgeStatus.pledgeShortfall, project.currency)}
                    </span>
                  ) : pledgeStatus.totalPledged > 0 ? (
                    <span className="text-green-600">Fully pledged</span>
                  ) : (
                    <span className="text-gray-500">N/A</span>
                  )}
                </TableCell>
                <TableCell className="text-blue-900">
                  {formatWithExchange(project.amountDisbursed, project.currency)}
                </TableCell>
                <TableCell className="text-blue-900">
                  {project.totalCost ? 
                    <span className={project.totalCost - project.amountDisbursed > 0 ? "text-orange-600 font-medium" : "text-green-600"}>
                      {formatWithExchange(project.totalCost - project.amountDisbursed, project.currency)}
                    </span>
                    : "N/A"
                  }
                </TableCell>
                <TableCell className="px-4">
                  {project.totalCost ? (
                    <div className="space-y-1">
                      <div className="w-full bg-blue-100 rounded-md h-3 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-md transition-all duration-300"
                          style={{ 
                            width: `${Math.min((project.amountDisbursed / project.totalCost) * 100, 100)}%` 
                          }}
                        />
                      </div>
                      <div className="text-xs text-blue-700 font-medium text-center">
                        {Math.round((project.amountDisbursed / project.totalCost) * 100)}%
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-blue-600 text-center">No total cost</div>
                  )}
                </TableCell>
                <TableCell className="px-6 min-w-[400px]">
                  <div className="flex flex-wrap gap-1.5 max-w-none">
                    {/* Primary Actions */}
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-blue-300 text-blue-600 hover:bg-blue-50 text-xs px-2 py-1 h-7"
                      onClick={() => onEditProject?.(project)}
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                    
                    {/* Documentation Group */}
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-blue-300 text-blue-600 hover:bg-blue-50 text-xs px-2 py-1 h-7"
                      onClick={() => onOpenNotes?.(project.id, project.projectName)}
                    >
                      <FileText className="w-3 h-3 mr-1" />
                      Notes
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-purple-300 text-purple-600 hover:bg-purple-50 text-xs px-2 py-1 h-7"
                      onClick={() => onOpenAttachments?.(project.id, project.projectName)}
                    >
                      <Paperclip className="w-3 h-3 mr-1" />
                      Files
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-green-300 text-green-600 hover:bg-green-50 text-xs px-2 py-1 h-7"
                      onClick={() => onOpenGallery?.(project.id, project.projectName)}
                    >
                      <Camera className="w-3 h-3 mr-1" />
                      Photos
                    </Button>
                    
                    {/* Project Management Group */}
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-indigo-300 text-indigo-600 hover:bg-indigo-50 text-xs px-2 py-1 h-7"
                      onClick={() => onOpenMilestones?.(project.id, project.projectName)}
                    >
                      <Milestone className="w-3 h-3 mr-1" />
                      Milestones
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-violet-300 text-violet-600 hover:bg-violet-50 text-xs px-2 py-1 h-7"
                      onClick={() => onOpenGantt?.(project)}
                    >
                      <ChartGantt className="w-3 h-3 mr-1" />
                      Gantt
                    </Button>
                    
                    {/* Financial Group */}
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-emerald-300 text-emerald-600 hover:bg-emerald-50 text-xs px-2 py-1 h-7"
                      onClick={() => onOpenFunding?.(project)}
                    >
                      <Banknote className="w-3 h-3 mr-1" />
                      Funding
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-teal-300 text-teal-600 hover:bg-teal-50 text-xs px-2 py-1 h-7"
                      onClick={() => onOpenDisbursement?.(project)}
                      title="Disbursement Schedule"
                    >
                      <Calendar className="w-3 h-3 mr-1" />
                      Schedule
                    </Button>
                    
                    {/* Reallocation */}
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-cyan-300 text-cyan-600 hover:bg-cyan-50 text-xs px-2 py-1 h-7"
                      onClick={() => onOpenReallocation?.(project)}
                      title="Fund Reallocation"
                    >
                      <ArrowRightLeft className="w-3 h-3 mr-1" />
                      Reallocate
                    </Button>
                    
                    {/* Conditional Actions */}
                    {project.followUpNeeded && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-orange-300 text-orange-600 hover:bg-orange-50 text-xs px-2 py-1 h-7"
                        onClick={() => handleSendFollowUp(project)}
                      >
                        <Mail className="w-3 h-3 mr-1" />
                        Follow-up
                      </Button>
                    )}
                    
                    {/* Delete Action */}
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-300 text-red-600 hover:bg-red-50 text-xs px-2 py-1 h-7"
                      onClick={() => handleDeleteClick(project)}
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {filteredProjects.length === 0 && (
        <div className="text-center py-8 text-blue-600">
          No projects found matching your criteria.
        </div>
      )}

      <ProjectDeleteDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog(prev => ({ ...prev, open }))}
        projectName={deleteDialog.projectName}
        onConfirmDelete={handleConfirmDelete}
      />
    </div>
  );
};

export default ProjectsTable;
