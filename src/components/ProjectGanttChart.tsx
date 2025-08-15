import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartGantt } from "lucide-react";
import { Project, ProjectMilestone, FFTPMilestoneType } from "@/types/project";
import { formatDateForDisplay, fromDateString, getCurrentESTDate } from "@/utils/dateUtils";

interface ProjectGanttChartProps {
  project: Project;
  milestones: ProjectMilestone[];
}

const getProjectColor = (status: Project["status"]) => {
  switch (status) {
    case "Completed":
      return "bg-green-500";
    case "On-Track":
      return "bg-blue-500";
    case "Delayed":
      return "bg-red-500";
    case "Pending Start":
      return "bg-yellow-500";
    case "Cancelled":
      return "bg-gray-500";
    case "Needs Attention":
      return "bg-orange-500";
    default:
      return "bg-gray-400";
  }
};

const getMilestoneColor = (milestoneType: FFTPMilestoneType | undefined, status: ProjectMilestone["status"]) => {
  // Color coding by status
  switch (status) {
    case "Completed":
      return "bg-green-500";
    case "Not Started":
      return "bg-orange-500";
    case "In Progress":
      return "bg-blue-500";
    case "Overdue":
      return "bg-red-500";
    default:
      return "bg-gray-500";
  }
};

const ProjectGanttChart = ({ project, milestones }: ProjectGanttChartProps) => {
  console.log(`ProjectGanttChart: Rendering project ${project.projectName} with status: ${project.status}`);
  const chartData = useMemo(() => {
    const projectStart = fromDateString(project.startDate);
    const projectEnd = project.endDate ? fromDateString(project.endDate) : getCurrentESTDate();
    
    // Calculate project duration in days
    const totalDays = Math.ceil((projectEnd.getTime() - projectStart.getTime()) / (1000 * 60 * 60 * 24));
    
    // Sort milestones by start date in ascending order
    const sortedMilestones = [...milestones].sort((a, b) => 
      fromDateString(a.startDate).getTime() - fromDateString(b.startDate).getTime()
    );
    
    // Create timeline items with proper typing
    const items: Array<{
      id: string;
      name: string;
      start: Date;
      end: Date;
      type: "project" | "milestone";
      status: Project["status"] | ProjectMilestone["status"];
      color: string;
      priority?: ProjectMilestone["priority"];
      milestoneType?: FFTPMilestoneType;
      sortOrder: number;
    }> = [
      {
        id: "project",
        name: project.projectName,
        start: projectStart,
        end: projectEnd,
        type: "project",
        status: project.status,
        color: getProjectColor(project.status),
        sortOrder: 0
      },
      ...sortedMilestones.map((milestone, index) => {
        const start = fromDateString(milestone.startDate);
        const end = milestone.completedDate 
          ? fromDateString(milestone.completedDate)
          : fromDateString(milestone.dueDate);
        
        // For completed milestones, make them shorter (1-2 days max)
        if (milestone.status === "Completed" && milestone.completedDate) {
          const completedDate = fromDateString(milestone.completedDate);
          const shortEnd = new Date(completedDate);
          shortEnd.setDate(completedDate.getDate() + 1); // 1 day duration for completed
          return {
            id: milestone.id,
            name: milestone.title,
            start: completedDate,
            end: shortEnd,
            type: "milestone" as const,
            status: milestone.status,
            priority: milestone.priority,
            milestoneType: milestone.milestoneType,
            color: getMilestoneColor(milestone.milestoneType, milestone.status),
            sortOrder: index + 1
          };
        }
        
        // For non-completed milestones, make them shorter duration (3-5 days max)
        const shortEnd = new Date(start);
        shortEnd.setDate(start.getDate() + 3); // 3 day duration for ongoing/future
        
        return {
          id: milestone.id,
          name: milestone.title,
          start,
          end: shortEnd,
          type: "milestone" as const,
          status: milestone.status,
          priority: milestone.priority,
          milestoneType: milestone.milestoneType,
          color: getMilestoneColor(milestone.milestoneType, milestone.status),
          sortOrder: index + 1
        };
      })
    ];

    return { items, projectStart, projectEnd, totalDays };
  }, [project, milestones]);

  const calculatePosition = (date: Date) => {
    const daysDiff = Math.ceil((date.getTime() - chartData.projectStart.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, Math.min(100, (daysDiff / chartData.totalDays) * 100));
  };

  const calculateWidth = (start: Date, end: Date) => {
    const durationDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(2, (durationDays / chartData.totalDays) * 100);
  };

  const generateTimelineMarkers = () => {
    const markers = [];
    const monthsDiff = Math.ceil(chartData.totalDays / 30);
    const markerCount = Math.min(6, Math.max(2, monthsDiff));
    
    for (let i = 0; i <= markerCount; i++) {
      const position = (i / markerCount) * 100;
      const date = new Date(chartData.projectStart);
      date.setDate(date.getDate() + (i / markerCount) * chartData.totalDays);
      
      markers.push({
        position,
        date: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      });
    }
    
    return markers;
  };

  // Calculate "today" line position
  const todayPosition = calculatePosition(getCurrentESTDate());

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ChartGantt className="h-5 w-5" />
          FFTP-Canada Project Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Timeline Header */}
          <div className="relative h-8 border-b">
            <div className="flex justify-between items-center h-full">
              {generateTimelineMarkers().map((marker, index) => (
                <div
                  key={index}
                  className="absolute text-xs text-gray-500 transform -translate-x-1/2"
                  style={{ left: `${marker.position}%` }}
                >
                  {marker.date}
                </div>
              ))}
            </div>
            {/* Today line */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
              style={{ left: `${todayPosition}%` }}
            >
              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 text-xs text-red-500 font-medium">
                Today
              </div>
            </div>
          </div>

          {/* Gantt Chart Items */}
          <div className="space-y-3">
            {chartData.items.map((item) => (
              <div key={item.id} className="flex items-center gap-4">
                <div className="w-64 text-sm font-medium truncate" title={item.name}>
                  {item.name}
                </div>
                <div className="flex-1 relative h-8 bg-gray-100 rounded">
                  {item.type === "project" ? (
                    <div
                      className={`absolute h-6 top-1 rounded ${item.color} opacity-80`}
                      style={{
                        left: `${calculatePosition(item.start)}%`,
                        width: `${calculateWidth(item.start, item.end)}%`
                      }}
                      title={`${item.name}: ${item.start.toLocaleDateString()} - ${item.end.toLocaleDateString()}`}
                    />
                  ) : (
                    <div
                      className={`absolute h-6 top-1 rounded ${item.color} opacity-90 border-2 border-white`}
                      style={{
                        left: `${calculatePosition(item.start)}%`,
                        width: `${calculateWidth(item.start, item.end)}%`,
                        minWidth: "8px"
                      }}
                      title={`${item.name}: ${item.start.toLocaleDateString()} - ${item.end.toLocaleDateString()}`}
                    />
                  )}
                </div>
                <div className="w-24 text-xs text-gray-500">
                  {item.type === "project" ? item.status : `${item.status}${item.priority === "High" ? " (!)" : ""}`}
                </div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 pt-4 border-t text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-2 bg-green-500 rounded"></div>
              <span>Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-2 bg-orange-500 rounded"></div>
              <span>Not Started</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-2 bg-blue-500 rounded"></div>
              <span>On Track</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-2 bg-red-500 rounded"></div>
              <span>Delayed/Overdue</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-0.5 h-4 bg-red-500"></div>
              <span>Today</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectGanttChart;
