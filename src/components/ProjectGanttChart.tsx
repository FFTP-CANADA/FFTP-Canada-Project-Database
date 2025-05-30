
import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartGantt } from "lucide-react";
import { Project, ProjectMilestone } from "@/hooks/useProjectData";

interface ProjectGanttChartProps {
  project: Project;
  milestones: ProjectMilestone[];
}

const ProjectGanttChart = ({ project, milestones }: ProjectGanttChartProps) => {
  const chartData = useMemo(() => {
    const projectStart = new Date(project.startDate);
    const projectEnd = project.endDate ? new Date(project.endDate) : new Date();
    
    // Calculate project duration in days
    const totalDays = Math.ceil((projectEnd.getTime() - projectStart.getTime()) / (1000 * 60 * 60 * 24));
    
    // Create timeline items
    const items = [
      {
        id: "project",
        name: project.projectName,
        start: projectStart,
        end: projectEnd,
        type: "project",
        status: project.status,
        color: getProjectColor(project.status)
      },
      ...milestones.map((milestone) => ({
        id: milestone.id,
        name: milestone.title,
        start: new Date(milestone.dueDate),
        end: new Date(milestone.dueDate),
        type: "milestone",
        status: milestone.status,
        priority: milestone.priority,
        color: getMilestoneColor(milestone.status)
      }))
    ];

    return { items, projectStart, projectEnd, totalDays };
  }, [project, milestones]);

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

  const getMilestoneColor = (status: ProjectMilestone["status"]) => {
    switch (status) {
      case "Completed":
        return "bg-green-600";
      case "In Progress":
        return "bg-blue-600";
      case "Overdue":
        return "bg-red-600";
      default:
        return "bg-gray-600";
    }
  };

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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ChartGantt className="h-5 w-5" />
          Project Timeline
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
          </div>

          {/* Gantt Chart Items */}
          <div className="space-y-3">
            {chartData.items.map((item) => (
              <div key={item.id} className="flex items-center gap-4">
                <div className="w-48 text-sm font-medium truncate" title={item.name}>
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
                    />
                  ) : (
                    <div
                      className={`absolute w-3 h-6 top-1 transform -translate-x-1/2 ${item.color} rounded-full border-2 border-white`}
                      style={{ left: `${calculatePosition(item.start)}%` }}
                    />
                  )}
                </div>
                <div className="w-20 text-xs text-gray-500">
                  {item.type === "project" ? item.status : item.status}
                </div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 pt-4 border-t text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-2 bg-blue-500 rounded"></div>
              <span>Project Duration</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-600 rounded-full"></div>
              <span>Milestone</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectGanttChart;
