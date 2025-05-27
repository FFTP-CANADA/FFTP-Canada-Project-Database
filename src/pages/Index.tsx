
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, BarChart3, Users, DollarSign, AlertCircle } from "lucide-react";
import ProjectsTable from "@/components/ProjectsTable";
import AnalyticsDashboard from "@/components/AnalyticsDashboard";
import AddProjectDialog from "@/components/AddProjectDialog";
import { useProjectData } from "@/hooks/useProjectData";

const Index = () => {
  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false);
  const { projects, addProject } = useProjectData();

  const stats = {
    totalProjects: projects.length,
    activeProjects: projects.filter(p => p.status === "On-Track" || p.status === "Delayed").length,
    totalDisbursed: projects.reduce((sum, p) => sum + p.amountDisbursed, 0),
    needsFollowUp: projects.filter(p => p.followUpNeeded).length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-blue-900">Food For The Poor Canada</h1>
              <p className="text-blue-600 mt-1">Project Tracker & Analytics Dashboard</p>
            </div>
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-blue-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700">Total Projects</CardTitle>
              <BarChart3 className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900">{stats.totalProjects}</div>
            </CardContent>
          </Card>

          <Card className="border-blue-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700">Active Projects</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900">{stats.activeProjects}</div>
            </CardContent>
          </Card>

          <Card className="border-blue-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700">Total Disbursed</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900">
                ${stats.totalDisbursed.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700">Needs Follow-Up</CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.needsFollowUp}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="projects" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-[400px] bg-blue-50 border border-blue-200">
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
                <ProjectsTable projects={projects} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <AnalyticsDashboard projects={projects} />
          </TabsContent>
        </Tabs>
      </div>

      <AddProjectDialog 
        open={isAddProjectOpen}
        onOpenChange={setIsAddProjectOpen}
        onAddProject={addProject}
      />
    </div>
  );
};

export default Index;
