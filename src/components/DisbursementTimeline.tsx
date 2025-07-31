import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, DollarSign } from "lucide-react";
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
      <Card className="border-blue-200">
        <CardContent className="py-8">
          <div className="text-center text-blue-600">
            No disbursement milestones found.
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
        return "bg-green-500";
      case "Overdue":
        return "bg-red-500";
      case "In Progress":
        if (isBefore(due, today)) return "bg-red-500";
        return "bg-blue-500";
      case "Not Started":
        if (isBefore(due, today)) return "bg-red-500";
        return "bg-gray-400";
      default:
        return "bg-gray-400";
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
    <Card className="border-blue-200">
      <CardHeader>
        <CardTitle className="text-blue-900 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Disbursement Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Timeline Header */}
        <div className="mb-6">
          <div className="relative h-12 bg-blue-50 rounded-lg border border-blue-200">
            {timelineMonths.map((month, index) => (
              <div
                key={index}
                className="absolute top-0 bottom-0 border-l border-blue-300 text-xs text-blue-700 pl-2 pt-1"
                style={{ left: `${(index / timelineMonths.length) * 100}%` }}
              >
                {format(month, 'MMM yyyy')}
              </div>
            ))}
          </div>
        </div>

        {/* Project Rows */}
        <div className="space-y-4">
          {projectsWithDisbursements.map(({ project, disbursements }) => {
            const totalScheduled = disbursements.reduce(
              (sum, milestone) => sum + (milestone.disbursementAmount || 0), 0
            );

            return (
              <div key={project.id} className="border border-blue-200 rounded-lg p-4">
                {/* Project Info */}
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <h4 className="font-medium text-blue-900">{project.projectName}</h4>
                    <p className="text-sm text-blue-600">{project.country} • {project.impactArea}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-blue-900">
                      {formatWithExchange(totalScheduled, project.currency)}
                    </div>
                    <div className="text-sm text-blue-600">{disbursements.length} disbursements</div>
                  </div>
                </div>

                {/* Timeline */}
                <div className="relative h-16 bg-gray-50 rounded border">
                  {/* Today indicator */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
                    style={{ left: `${getPositionFromDate(new Date())}%` }}
                  >
                    <div className="absolute -top-1 -left-2 w-4 h-4 bg-red-500 rounded-full"></div>
                  </div>

                  {/* Disbursement markers */}
                  {disbursements.map((milestone) => {
                    const position = getPositionFromDate(parseISO(milestone.dueDate));
                    const colorClass = getStatusColor(milestone.status, milestone.dueDate);
                    
                    return (
                      <div
                        key={milestone.id}
                        className="absolute top-2 bottom-2 group cursor-pointer"
                        style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
                      >
                        <div className={`w-4 h-full ${colorClass} rounded shadow-sm border-2 border-white`}></div>
                        
                        {/* Tooltip */}
                        <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity z-20 whitespace-nowrap">
                          <div className="font-semibold">{getMilestoneShortName(milestone.milestoneType || "")}</div>
                          <div>{format(parseISO(milestone.dueDate), 'MMM dd, yyyy')}</div>
                          <div>{formatWithExchange(milestone.disbursementAmount || 0, project.currency)}</div>
                          <div className="capitalize">{milestone.status.toLowerCase()}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="mt-2 flex gap-4 text-xs text-gray-600">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-green-500 rounded"></div>
                    <span>Completed</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-blue-500 rounded"></div>
                    <span>In Progress</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-gray-400 rounded"></div>
                    <span>Not Started</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-red-500 rounded"></div>
                    <span>Overdue</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-0.5 h-3 bg-red-500"></div>
                    <span>Today</span>
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