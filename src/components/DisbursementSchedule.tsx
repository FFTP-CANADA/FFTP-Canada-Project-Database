import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Calendar, DollarSign, Clock, Grid, BarChart3 } from "lucide-react";
import { Project, ProjectMilestone } from "@/types/project";
import { formatWithExchange } from "@/utils/currencyUtils";
import DisbursementTimeline from "./DisbursementTimeline";
import { format, parseISO, isAfter, isBefore } from "date-fns";

interface DisbursementScheduleProps {
  projects: Project[];
  milestones: ProjectMilestone[];
}

const DisbursementSchedule = ({ projects, milestones }: DisbursementScheduleProps) => {
  const [viewMode, setViewMode] = useState<'table' | 'timeline'>('timeline');
  // Get disbursement milestones with amounts
  const disbursementMilestones = milestones.filter(
    milestone => milestone.milestoneType?.includes("Disbursement") && milestone.disbursementAmount
  );

  // Sort by due date
  const sortedDisbursements = disbursementMilestones.sort((a, b) => 
    new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  );

  // Group disbursements by project
  const disbursementsByProject = projects.map(project => {
    const projectDisbursements = sortedDisbursements.filter(
      milestone => milestone.projectId === project.id
    );
    
    const totalScheduled = projectDisbursements.reduce(
      (sum, milestone) => sum + (milestone.disbursementAmount || 0), 0
    );

    const completed = projectDisbursements.filter(m => m.status === "Completed");
    const upcoming = projectDisbursements.filter(m => m.status !== "Completed");
    
    return {
      project,
      disbursements: projectDisbursements,
      totalScheduled,
      completedCount: completed.length,
      upcomingCount: upcoming.length
    };
  }).filter(item => item.disbursements.length > 0);

  const getStatusColor = (status: string, dueDate: string) => {
    const today = new Date();
    const due = parseISO(dueDate);
    
    switch (status) {
      case "Completed": 
        return "bg-green-100 text-green-800 border-green-200";
      case "Overdue":
        return "bg-red-100 text-red-800 border-red-200";
      case "In Progress":
        if (isBefore(due, today)) return "bg-red-100 text-red-800 border-red-200";
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Not Started":
        if (isBefore(due, today)) return "bg-red-100 text-red-800 border-red-200";
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getDisplayStatus = (status: string, dueDate: string) => {
    const today = new Date();
    const due = parseISO(dueDate);
    
    if (status === "Completed") return status;
    if (isBefore(due, today) && status !== "Completed") return "Overdue";
    return status;
  };

  return (
    <div className="space-y-6">
      {/* View Toggle */}
      <div className="flex gap-2">
        <Button
          variant={viewMode === 'timeline' ? 'default' : 'outline'}
          onClick={() => setViewMode('timeline')}
          className="flex items-center gap-2"
        >
          <BarChart3 className="w-4 h-4" />
          Timeline View
        </Button>
        <Button
          variant={viewMode === 'table' ? 'default' : 'outline'}
          onClick={() => setViewMode('table')}
          className="flex items-center gap-2"
        >
          <Grid className="w-4 h-4" />
          Table View
        </Button>
      </div>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">Projects with Disbursements</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{disbursementsByProject.length}</div>
          </CardContent>
        </Card>

        <Card className="border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">Total Disbursements</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{sortedDisbursements.length}</div>
          </CardContent>
        </Card>

        <Card className="border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">Upcoming Disbursements</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {sortedDisbursements.filter(m => m.status !== "Completed").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conditional View */}
      {viewMode === 'timeline' ? (
        <DisbursementTimeline projects={projects} milestones={milestones} />
      ) : (
        /* Disbursement Schedule Table */
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">Disbursement Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border border-blue-200 rounded-lg overflow-hidden">
              <Table>
                <TableHeader className="bg-blue-600">
                  <TableRow>
                    <TableHead className="text-white">Project</TableHead>
                    <TableHead className="text-white">Milestone</TableHead>
                    <TableHead className="text-white">Due Date</TableHead>
                    <TableHead className="text-white">Amount</TableHead>
                    <TableHead className="text-white">Status</TableHead>
                    <TableHead className="text-white">Priority</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedDisbursements.map((milestone) => {
                    const project = projects.find(p => p.id === milestone.projectId);
                    if (!project) return null;

                    return (
                      <TableRow key={milestone.id} className="hover:bg-blue-50">
                        <TableCell className="font-medium text-blue-900">
                          {project.projectName}
                          <div className="text-sm text-blue-600">{project.country}</div>
                        </TableCell>
                        <TableCell className="text-blue-700">
                          {milestone.milestoneType}
                          {milestone.description && (
                            <div className="text-sm text-gray-600">{milestone.description}</div>
                          )}
                        </TableCell>
                        <TableCell className="text-blue-700">
                          {format(parseISO(milestone.dueDate), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell className="text-blue-900 font-medium">
                          {formatWithExchange(milestone.disbursementAmount || 0, project.currency)}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(milestone.status, milestone.dueDate)}>
                            {getDisplayStatus(milestone.status, milestone.dueDate)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline"
                            className={
                              milestone.priority === "High" ? "border-red-300 text-red-600" :
                              milestone.priority === "Medium" ? "border-yellow-300 text-yellow-600" :
                              "border-green-300 text-green-600"
                            }
                          >
                            {milestone.priority}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {sortedDisbursements.length === 0 && (
              <div className="text-center py-8 text-blue-600">
                No disbursement milestones found.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Project Summary */}
      <Card className="border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">Disbursement Summary by Project</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {disbursementsByProject.map(({ project, disbursements, totalScheduled, completedCount, upcomingCount }) => {
              // Calculate actual disbursement progress (completed vs scheduled)
              const completedDisbursements = disbursements.filter(d => d.status === "Completed");
              const totalCompletedAmount = completedDisbursements.reduce(
                (sum, milestone) => sum + (milestone.disbursementAmount || 0), 0
              );
              const disbursementProgress = totalScheduled > 0 ? (totalCompletedAmount / totalScheduled) * 100 : 0;
              
              // Calculate balance due
              const balanceDue = project.totalCost ? project.totalCost - project.amountDisbursed : 0;
              
              return (
              <div key={project.id} className="p-4 border border-blue-200 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-medium text-blue-900">{project.projectName}</h4>
                    <p className="text-sm text-blue-600">{project.country} • {project.impactArea}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="text-lg font-semibold text-blue-900">
                      {formatWithExchange(totalScheduled, project.currency)}
                    </div>
                    <div className="text-sm text-blue-600">Total Scheduled</div>
                    {project.totalCost && (
                      <div className="text-sm">
                        <span className="text-orange-600 font-medium">
                          Balance Due: {formatWithExchange(balanceDue, project.currency)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-4 text-sm mb-2">
                  <span className="text-green-600">
                    Completed: {completedCount} ({formatWithExchange(totalCompletedAmount, project.currency)})
                  </span>
                  <span className="text-orange-600">
                    Upcoming: {upcomingCount}
                  </span>
                  <span className="text-blue-600">
                    Total: {disbursements.length} disbursements
                  </span>
                </div>

                <div className="mt-2">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Disbursement Progress (Completed vs Scheduled)</span>
                    <span>{Math.round(disbursementProgress)}%</span>
                  </div>
                  <div className="w-full bg-blue-100 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ 
                        width: `${Math.min(disbursementProgress, 100)}%` 
                      }}
                    />
                  </div>
                </div>
              </div>
            );})}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DisbursementSchedule;