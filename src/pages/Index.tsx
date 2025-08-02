import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, BarChart3, Users, DollarSign, AlertCircle, Info, Target, TrendingUp, Calendar, CheckCircle } from "lucide-react";
import ProjectsTable from "@/components/ProjectsTable";
import { BackupManagerComponent } from "@/components/BackupManager";
import AnalyticsDashboard from "@/components/AnalyticsDashboard";
import DisbursementSchedule from "@/components/DisbursementSchedule";
import ProjectDisbursementDialog from "@/components/ProjectDisbursementDialog";
import AddProjectDialog from "@/components/AddProjectDialog";
import ProjectAttachments from "@/components/ProjectAttachments";
import ProjectGallery from "@/components/ProjectGallery";
import ProjectEditDialog from "@/components/ProjectEditDialog";
import ProgramManagementDialog from "@/components/ProgramManagementDialog";
import ProjectNotesDialog from "@/components/ProjectNotesDialog";
import ProjectMilestonesDialog from "@/components/ProjectMilestonesDialog";
import ProjectFundingStatusDialog from "@/components/ProjectFundingStatusDialog";
import ProjectGanttDialog from "@/components/ProjectGanttDialog";
import StatusReportDialog from "@/components/StatusReportDialog";
import ProgramInfoDialog from "@/components/ProgramInfoDialog";
import AutoFollowUpManager from "@/components/AutoFollowUpManager";
import NotificationsAlert from "@/components/NotificationsAlert";
import { useProjectData } from "@/hooks/useProjectData";
import { Project } from "@/types/project";
import ExchangeRateDisplay from "@/components/ExchangeRateDisplay";
import { convertUsdToCad, formatWithExchange } from "@/utils/currencyUtils";
import { useAutoFollowUp } from "@/hooks/useAutoFollowUp";
import { useProjectFunding } from "@/hooks/useProjectFunding";

const Index = () => {
  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false);
  const [editProject, setEditProject] = useState<{ open: boolean; project: any }>({
    open: false,
    project: null
  });
  const [showProgramInfo, setShowProgramInfo] = useState(false);
  const [programManagementOpen, setProgramManagementOpen] = useState(false);
  const [notesDialog, setNotesDialog] = useState<{ open: boolean; projectId: string; projectName: string }>({
    open: false,
    projectId: "",
    projectName: ""
  });
  const [milestonesDialog, setMilestonesDialog] = useState<{ open: boolean; projectId: string; projectName: string }>({
    open: false,
    projectId: "",
    projectName: ""
  });
  const [ganttDialog, setGanttDialog] = useState<{ open: boolean; project: Project | null }>({
    open: false,
    project: null
  });
  const [fundingDialog, setFundingDialog] = useState<{ open: boolean; project: Project | null }>({
    open: false,
    project: null
  });
  const [disbursementDialog, setDisbursementDialog] = useState<{ open: boolean; project: Project | null }>({
    open: false,
    project: null
  });
  const [attachmentsDialog, setAttachmentsDialog] = useState<{ open: boolean; projectId: string; projectName: string }>({
    open: false,
    projectId: "",
    projectName: ""
  });
  const [galleryDialog, setGalleryDialog] = useState<{ open: boolean; projectId: string; projectName: string }>({
    open: false,
    projectId: "",
    projectName: ""
  });

  const { 
    projects, 
    addProject, 
    updateProject,
    deleteProject,
    validateGovernanceNumber,
    attachments,
    photos,
    notes,
    allPrograms,
    addAttachment,
    deleteAttachment,
    getAttachmentsForProject,
    addPhoto,
    getPhotosForProject,
    addNote,
    getNotesForProject,
    addProgram,
    deleteProgram,
    milestones,
    getMilestonesForProject,
    addMilestone,
    updateMilestone,
    deleteMilestone
  } = useProjectData();

  const {
    followUpEmails,
    markFollowUpSent,
    dismissFollowUp
  } = useAutoFollowUp(projects, milestones, notes);

  const { donorPledges } = useProjectFunding();

  const stats = {
    totalProjects: projects.length,
    activeProjects: projects.filter(p => p.status === "On-Track" || p.status === "Delayed").length,
    totalDisbursed: projects.reduce((sum, p) => sum + p.amountDisbursed, 0),
    totalDisbursedCAD: projects.reduce((sum, p) => {
      if (p.currency === 'USD') {
        return sum + convertUsdToCad(p.amountDisbursed);
      }
      return sum + p.amountDisbursed;
    }, 0),
    needsFollowUp: projects.filter(p => p.followUpNeeded).length,
    totalProjectValueCAD: projects.reduce((sum, p) => {
      const cost = p.totalCost || 0;
      if (p.currency === 'USD') {
        return sum + convertUsdToCad(cost);
      }
      return sum + cost;
    }, 0),
    totalPledgesCAD: donorPledges.reduce((sum, pledge) => sum + pledge.pledgedAmount, 0),
    completedProjects: projects.filter(p => p.status === "Completed").length,
    projectsAtRisk: projects.filter(p => p.status === "Delayed" || p.status === "Needs Attention").length,
    avgProjectValue: projects.length > 0 ? projects.reduce((sum, p) => {
      const cost = p.totalCost || 0;
      if (p.currency === 'USD') {
        return sum + convertUsdToCad(cost);
      }
      return sum + cost;
    }, 0) / projects.length : 0,
  };

  const handleOpenAttachments = (projectId: string, projectName: string) => {
    setAttachmentsDialog({ open: true, projectId, projectName });
  };

  const handleOpenGallery = (projectId: string, projectName: string) => {
    setGalleryDialog({ open: true, projectId, projectName });
  };

  const handleEditProject = (project: any) => {
    setEditProject({ open: true, project });
  };

  const handleOpenNotes = (projectId: string, projectName: string) => {
    setNotesDialog({ open: true, projectId, projectName });
  };

  const handleOpenMilestones = (projectId: string, projectName: string) => {
    setMilestonesDialog({ open: true, projectId, projectName });
  };

  const handleOpenGantt = (project: Project) => {
    setGanttDialog({ open: true, project });
  };

  const handleOpenFunding = (project: Project) => {
    console.log("Opening funding dialog for project:", project.id);
    setFundingDialog({ open: true, project });
  };

  const handleOpenDisbursement = (project: Project) => {
    setDisbursementDialog({ open: true, project });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <img 
                src="/lovable-uploads/af3d9a60-0267-4a1b-bf2d-e92b594a9ba7.png" 
                alt="Food For The Poor Canada" 
                className="h-16 w-auto"
              />
              <p className="text-blue-600 mt-1">Project Tracker & Analytics Dashboard</p>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline"
                onClick={() => setShowProgramInfo(true)}
                className="border-blue-300 text-blue-700 hover:bg-blue-50"
              >
                <Info className="w-4 h-4 mr-2" />
                Program Info
              </Button>
              <StatusReportDialog projects={projects} notes={notes} />
              <Button 
                onClick={() => setIsAddProjectOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Project
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Notifications Alert */}
        <NotificationsAlert 
          projects={projects} 
          milestones={milestones} 
          notes={notes} 
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-8">
          {/* Row 1 - Primary Metrics */}
          <Card className="border-blue-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-blue-700">Total Projects</CardTitle>
              <BarChart3 className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-blue-900">{stats.totalProjects}</div>
            </CardContent>
          </Card>

          <Card className="border-blue-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-blue-700">Active Projects</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-blue-900">{stats.activeProjects}</div>
            </CardContent>
          </Card>

          <Card className="border-blue-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-blue-700">Total Project Value</CardTitle>
              <Target className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-blue-900">
                CAD ${stats.totalProjectValueCAD.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-blue-700">Total Pledges</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-blue-900">
                CAD ${stats.totalPledgesCAD.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-blue-700">Total Disbursed</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-blue-900">
                CAD ${stats.totalDisbursedCAD.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </div>
            </CardContent>
          </Card>

          {/* Row 2 - Management Metrics */}
          <Card className="border-blue-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-blue-700">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-green-600">{stats.completedProjects}</div>
            </CardContent>
          </Card>

          <Card className="border-blue-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-blue-700">At Risk</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-red-600">{stats.projectsAtRisk}</div>
            </CardContent>
          </Card>

          <Card className="border-blue-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-blue-700">Needs Follow-Up</CardTitle>
              <Calendar className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-orange-600">{stats.needsFollowUp}</div>
            </CardContent>
          </Card>

          <Card className="border-blue-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-blue-700">Avg Project Value</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-blue-900">
                CAD ${stats.avgProjectValue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </div>
            </CardContent>
          </Card>

          <ExchangeRateDisplay />
        </div>

        {/* Auto Follow-up Manager */}
        {followUpEmails.length > 0 && (
          <div className="mb-8">
            <AutoFollowUpManager
              followUpEmails={followUpEmails}
              onMarkSent={markFollowUpSent}
              onDismiss={dismissFollowUp}
            />
          </div>
        )}

        {/* Main Content Tabs */}
        <Tabs defaultValue="projects" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-[600px] bg-blue-50 border border-blue-200">
            <TabsTrigger 
              value="projects" 
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              Projects
            </TabsTrigger>
            <TabsTrigger 
              value="analytics" 
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              Analytics
            </TabsTrigger>
            <TabsTrigger 
              value="backup" 
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              Data Backup
            </TabsTrigger>
          </TabsList>

          <TabsContent value="projects" className="space-y-6">
            <Card className="border-blue-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-blue-900">Project Management</CardTitle>
                <CardDescription className="text-blue-600">
                  Track and manage charitable projects across the Caribbean and Latin America
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ProjectsTable 
                  projects={projects}
                  availablePrograms={allPrograms}
                  onOpenAttachments={handleOpenAttachments}
                  onOpenGallery={handleOpenGallery}
                  onOpenNotes={handleOpenNotes}
                  onOpenMilestones={handleOpenMilestones}
                  onOpenGantt={handleOpenGantt}
                  onOpenFunding={handleOpenFunding}
                  onOpenDisbursement={handleOpenDisbursement}
                  onEditProject={handleEditProject}
                  onDeleteProject={deleteProject}
                  onManagePrograms={() => setProgramManagementOpen(true)}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <AnalyticsDashboard projects={projects} />
          </TabsContent>

          <TabsContent value="backup" className="space-y-6">
            <div className="flex justify-center">
              <BackupManagerComponent />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <AddProjectDialog 
        open={isAddProjectOpen}
        onOpenChange={setIsAddProjectOpen}
        onAddProject={addProject}
      />

      <ProjectEditDialog
        project={editProject.project}
        open={editProject.open}
        onOpenChange={(open) => setEditProject(prev => ({ ...prev, open }))}
        onUpdateProject={updateProject}
        availablePrograms={allPrograms}
        validateGovernanceNumber={validateGovernanceNumber}
      />

      <ProgramManagementDialog
        open={programManagementOpen}
        onOpenChange={setProgramManagementOpen}
        programs={allPrograms}
        onAddProgram={addProgram}
        onDeleteProgram={deleteProgram}
      />

      <ProjectAttachments
        projectId={attachmentsDialog.projectId}
        projectName={attachmentsDialog.projectName}
        open={attachmentsDialog.open}
        onOpenChange={(open) => setAttachmentsDialog(prev => ({ ...prev, open }))}
        attachments={getAttachmentsForProject(attachmentsDialog.projectId)}
        onAddAttachment={addAttachment}
        onDeleteAttachment={deleteAttachment}
      />

      <ProjectGallery
        projectId={galleryDialog.projectId}
        projectName={galleryDialog.projectName}
        open={galleryDialog.open}
        onOpenChange={(open) => setGalleryDialog(prev => ({ ...prev, open }))}
        photos={getPhotosForProject(galleryDialog.projectId)}
        onAddPhoto={addPhoto}
      />

      <ProjectNotesDialog
        projectId={notesDialog.projectId}
        projectName={notesDialog.projectName}
        open={notesDialog.open}
        onOpenChange={(open) => setNotesDialog(prev => ({ ...prev, open }))}
        notes={getNotesForProject(notesDialog.projectId)}
        onAddNote={addNote}
      />

      <ProjectMilestonesDialog
        projectId={milestonesDialog.projectId}
        projectName={milestonesDialog.projectName}
        open={milestonesDialog.open}
        onOpenChange={(open) => setMilestonesDialog(prev => ({ ...prev, open }))}
      />

      <ProjectGanttDialog
        project={ganttDialog.project}
        open={ganttDialog.open}
        onOpenChange={(open) => setGanttDialog(prev => ({ ...prev, open }))}
      />

      <ProjectFundingStatusDialog
        project={fundingDialog.project}
        open={fundingDialog.open}
        onOpenChange={(open) => setFundingDialog({open, project: null})}
        onUpdateProject={updateProject}
      />

      <ProjectDisbursementDialog
        project={disbursementDialog.project}
        open={disbursementDialog.open}
        onOpenChange={(open) => setDisbursementDialog({open, project: null})}
      />

      <ProgramInfoDialog 
        open={showProgramInfo}
        onOpenChange={setShowProgramInfo}
      />
    </div>
  );
};

export default Index;
