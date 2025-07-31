import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Mail, FileText, Filter, Paperclip, Camera, Edit, Settings, Milestone, ChartGantt, Trash2 } from "lucide-react";
import { Project } from "@/hooks/useProjectData";
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
  onEditProject?: (project: Project) => void;
  onDeleteProject?: (projectId: string) => void;
  onManagePrograms?: () => void;
}

const ProjectsTable = ({ 
  projects, 
  availablePrograms,
  onOpenAttachments, 
  onOpenGallery,
  onOpenNotes,
  onOpenMilestones,
  onOpenGantt,
  onEditProject,
  onDeleteProject,
  onManagePrograms
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
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
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
      <div className="border border-blue-200 rounded-lg overflow-hidden">
        <Table>
          <TableHeader className="bg-blue-600">
            <TableRow>
              <TableHead className="text-white">Project Name</TableHead>
              <TableHead className="text-white">Program</TableHead>
              <TableHead className="text-white">Country</TableHead>
              <TableHead className="text-white">Impact Area</TableHead>
              <TableHead className="text-white">Status</TableHead>
              <TableHead className="text-white">Total Cost</TableHead>
              <TableHead className="text-white">Disbursed</TableHead>
              <TableHead className="text-white">Progress</TableHead>
              <TableHead className="text-white">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProjects.map((project) => (
              <TableRow key={project.id} className="hover:bg-blue-50">
                <TableCell className="font-medium text-blue-900">
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
                  {formatWithExchange(project.amountDisbursed, project.currency)}
                </TableCell>
                <TableCell>
                  {project.totalCost ? (
                    <>
                      <div className="w-full bg-blue-100 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ 
                            width: `${Math.min((project.amountDisbursed / project.totalCost) * 100, 100)}%` 
                          }}
                        />
                      </div>
                      <span className="text-xs text-blue-600 mt-1">
                        {Math.round((project.amountDisbursed / project.totalCost) * 100)}%
                      </span>
                    </>
                  ) : (
                    <span className="text-xs text-blue-600">No total cost</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-blue-300 text-blue-600 hover:bg-blue-50"
                      onClick={() => onEditProject?.(project)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-blue-300 text-blue-600 hover:bg-blue-50"
                      onClick={() => onOpenNotes?.(project.id, project.projectName)}
                    >
                      <FileText className="w-4 h-4 mr-1" />
                      Notes
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-indigo-300 text-indigo-600 hover:bg-indigo-50"
                      onClick={() => onOpenMilestones?.(project.id, project.projectName)}
                    >
                      <Milestone className="w-4 h-4 mr-1" />
                      Milestones
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-violet-300 text-violet-600 hover:bg-violet-50"
                      onClick={() => onOpenGantt?.(project)}
                    >
                      <ChartGantt className="w-4 h-4 mr-1" />
                      Timeline
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-purple-300 text-purple-600 hover:bg-purple-50"
                      onClick={() => onOpenAttachments?.(project.id, project.projectName)}
                    >
                      <Paperclip className="w-4 h-4 mr-1" />
                      Files
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-green-300 text-green-600 hover:bg-green-50"
                      onClick={() => onOpenGallery?.(project.id, project.projectName)}
                    >
                      <Camera className="w-4 h-4 mr-1" />
                      Gallery
                    </Button>
                     {project.followUpNeeded && (
                       <Button
                         size="sm"
                         variant="outline"
                         className="border-orange-300 text-orange-600 hover:bg-orange-50"
                         onClick={() => handleSendFollowUp(project)}
                       >
                         <Mail className="w-4 h-4 mr-1" />
                         Follow-up
                       </Button>
                     )}
                     <Button
                       size="sm"
                       variant="outline"
                       className="border-red-300 text-red-600 hover:bg-red-50"
                       onClick={() => handleDeleteClick(project)}
                     >
                       <Trash2 className="w-4 h-4 mr-1" />
                       Delete
                     </Button>
                   </div>
                </TableCell>
              </TableRow>
            ))}
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
