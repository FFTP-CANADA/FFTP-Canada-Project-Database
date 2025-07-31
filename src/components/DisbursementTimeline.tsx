import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, DollarSign, TrendingUp, Clock, MapPin } from "lucide-react";
import { Project, ProjectMilestone } from "@/types/project";
import { formatWithExchange } from "@/utils/currencyUtils";
import { format, parseISO, startOfMonth, endOfMonth, addMonths, isBefore, isAfter, differenceInDays } from "date-fns";

interface DisbursementTimelineProps {
  projects: Project[];
  milestones: ProjectMilestone[];
}

const DisbursementTimeline = ({ projects, milestones }: DisbursementTimelineProps) => {
  // Get disbursement milestones with amounts
  const disbursementMilestones = milestones.filter(
    milestone => milestone.milestoneType?.includes("Disbursement") && milestone.disbursementAmount
  );

  // Group disbursements by project
  const projectsWithDisbursements = projects
    .map(project => {
      const projectDisbursements = disbursementMilestones.filter(
        milestone => milestone.projectId === project.id
      );
      return {
        project,
        disbursements: projectDisbursements.sort((a, b) => 
          new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        )
      };
    })
    .filter(item => item.disbursements.length > 0);

  if (projectsWithDisbursements.length === 0) {
    return (
      <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardContent className="py-12">
          <div className="text-center">
            <DollarSign className="w-16 h-16 text-blue-300 mx-auto mb-4" />
            <p className="text-blue-600 text-lg">No disbursement milestones found.</p>
            <p className="text-blue-500 text-sm mt-2">Add disbursement milestones to see the timeline visualization.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate timeline range
  const allDates = disbursementMilestones.map(m => parseISO(m.dueDate));
  const minDate = startOfMonth(new Date(Math.min(...allDates.map(d => d.getTime()))));
  const maxDate = endOfMonth(new Date(Math.max(...allDates.map(d => d.getTime()))));
  
  // Generate timeline months
  const timelineMonths = [];
  let currentMonth = minDate;
  while (isBefore(currentMonth, maxDate) || currentMonth.getTime() === maxDate.getTime()) {
    timelineMonths.push(currentMonth);
    currentMonth = addMonths(currentMonth, 1);
  }

  const totalDays = differenceInDays(maxDate, minDate);

  const getPositionFromDate = (date: Date) => {
    const days = differenceInDays(date, minDate);
    return (days / totalDays) * 100;
  };

  const getStatusColor = (status: string, dueDate: string) => {
    const today = new Date();
    const due = parseISO(dueDate);
    
    switch (status) {
      case "Completed": 
        return "bg-gradient-to-br from-emerald-400 to-emerald-500 shadow-emerald-200";
      case "Overdue":
        return "bg-gradient-to-br from-red-400 to-red-500 shadow-red-200";
      case "In Progress":
        if (isBefore(due, today)) return "bg-gradient-to-br from-red-400 to-red-500 shadow-red-200";
        return "bg-gradient-to-br from-blue-400 to-blue-500 shadow-blue-200";
      case "Not Started":
        if (isBefore(due, today)) return "bg-gradient-to-br from-red-400 to-red-500 shadow-red-200";
        return "bg-gradient-to-br from-slate-300 to-slate-400 shadow-slate-200";
      default:
        return "bg-gradient-to-br from-slate-300 to-slate-400 shadow-slate-200";
    }
  };

  const getMilestoneShortName = (type: string) => {
    if (type.includes("First")) return "1st";
    if (type.includes("Second")) return "2nd";
    if (type.includes("Third")) return "3rd";
    if (type.includes("Final")) return "Final";
    return "Disb";
  };

  return (
    <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-3 text-xl">
          <div className="p-2 bg-white/20 rounded-lg">
            <Calendar className="w-6 h-6" />
          </div>
          Disbursement Timeline
          <Badge variant="secondary" className="ml-auto bg-white/20 text-white border-white/30">
            {projectsWithDisbursements.length} Projects
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Timeline Header */}
        <div className="mb-8">
          <div className="relative h-16 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl border-2 border-slate-200 shadow-inner overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5"></div>
            {timelineMonths.map((month, index) => (
              <div
                key={index}
                className="absolute top-0 bottom-0 flex flex-col justify-center border-l-2 border-slate-300/50 text-xs font-medium text-slate-700 pl-3 transition-all hover:bg-white/50"
                style={{ left: `${(index / timelineMonths.length) * 100}%` }}
              >
                <div className="text-sm font-semibold">{format(month, 'MMM')}</div>
                <div className="text-xs text-slate-500">{format(month, 'yyyy')}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Project Rows */}
        <div className="space-y-6">
          {projectsWithDisbursements.map(({ project, disbursements }) => {
            const totalScheduled = disbursements.reduce(
              (sum, milestone) => sum + (milestone.disbursementAmount || 0), 0
            );

            return (
              <div key={project.id} className="group bg-white border-2 border-slate-200 rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 hover:border-blue-300 animate-fade-in">
                {/* Project Info */}
                <div className="flex justify-between items-start mb-5">
                  <div className="space-y-2">
                    <h4 className="font-bold text-xl text-slate-800 group-hover:text-blue-700 transition-colors">
                      {project.projectName}
                    </h4>
                    <div className="flex items-center gap-3 text-sm">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        <MapPin className="w-3 h-3 mr-1" />
                        {project.country}
                      </Badge>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        {project.impactArea}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
                    <div className="text-2xl font-bold text-blue-700 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      {formatWithExchange(totalScheduled, project.currency)}
                    </div>
                    <div className="text-sm text-blue-600 font-medium">{disbursements.length} disbursements planned</div>
                  </div>
                </div>

                {/* Timeline */}
                <div className="relative h-20 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl border-2 border-slate-200 shadow-inner overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/3 to-indigo-500/3"></div>
                  
                  {/* Today indicator */}
                  <div
                    className="absolute top-0 bottom-0 w-1 bg-gradient-to-b from-red-400 to-red-600 z-20 shadow-lg"
                    style={{ left: `${getPositionFromDate(new Date())}%` }}
                  >
                    <div className="absolute -top-2 -left-3 w-6 h-6 bg-gradient-to-br from-red-400 to-red-600 rounded-full shadow-lg border-2 border-white animate-pulse">
                      <Clock className="w-3 h-3 text-white absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  {/* Disbursement markers */}
                  {disbursements.map((milestone, index) => {
                    const position = getPositionFromDate(parseISO(milestone.dueDate));
                    const colorClass = getStatusColor(milestone.status, milestone.dueDate);
                    
                    return (
                      <div
                        key={milestone.id}
                        className="absolute top-3 bottom-3 group cursor-pointer z-10 hover-scale"
                        style={{ 
                          left: `${position}%`, 
                          transform: 'translateX(-50%)',
                          animationDelay: `${index * 100}ms`
                        }}
                      >
                        <div className={`w-6 h-full ${colorClass} rounded-lg shadow-lg border-3 border-white hover:scale-110 transition-all duration-300 animate-fade-in`}></div>
                        
                        {/* Enhanced Tooltip */}
                        <div className="absolute bottom-full mb-3 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded-xl px-4 py-3 opacity-0 group-hover:opacity-100 transition-all duration-300 z-30 whitespace-nowrap shadow-xl border border-gray-700 animate-scale-in">
                          <div className="space-y-1">
                            <div className="font-bold text-center text-white border-b border-gray-600 pb-1">
                              {getMilestoneShortName(milestone.milestoneType || "")} Disbursement
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-3 h-3" />
                              {format(parseISO(milestone.dueDate), 'MMM dd, yyyy')}
                            </div>
                            <div className="flex items-center gap-2">
                              <DollarSign className="w-3 h-3" />
                              {formatWithExchange(milestone.disbursementAmount || 0, project.currency)}
                            </div>
                            <div className="text-center">
                              <Badge variant="outline" className="text-xs bg-gray-800 border-gray-600 text-white">
                                {milestone.status}
                              </Badge>
                            </div>
                          </div>
                          {/* Tooltip arrow */}
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Enhanced Legend */}
                <div className="mt-6 p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl border border-slate-200">
                  <div className="flex flex-wrap gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded shadow-sm"></div>
                      <span className="font-medium text-slate-700">Completed</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-gradient-to-br from-blue-400 to-blue-500 rounded shadow-sm"></div>
                      <span className="font-medium text-slate-700">In Progress</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-gradient-to-br from-slate-300 to-slate-400 rounded shadow-sm"></div>
                      <span className="font-medium text-slate-700">Not Started</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-gradient-to-br from-red-400 to-red-500 rounded shadow-sm"></div>
                      <span className="font-medium text-slate-700">Overdue</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-4 bg-gradient-to-b from-red-400 to-red-600 rounded-full shadow-sm"></div>
                      <Clock className="w-3 h-3 text-red-500" />
                      <span className="font-medium text-slate-700">Today</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default DisbursementTimeline;