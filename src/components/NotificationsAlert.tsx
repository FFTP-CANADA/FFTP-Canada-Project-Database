
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock, FileText, X, ChevronDown, ChevronUp } from "lucide-react";
import { Project, ProjectMilestone, ProjectNote } from "@/types/project";
import { formatDateForDisplay, getCurrentESTDate, fromDateString } from "@/utils/dateUtils";

interface NotificationsAlertProps {
  projects: Project[];
  milestones: ProjectMilestone[];
  notes: ProjectNote[];
}

const NotificationsAlert = ({ projects, milestones, notes }: NotificationsAlertProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [dismissedNotifications, setDismissedNotifications] = useState<string[]>([]);

  const today = getCurrentESTDate();
  const sevenDaysFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  // Get upcoming milestones (next 7 days)
  const upcomingMilestones = milestones.filter(milestone => {
    const milestoneDate = fromDateString(milestone.dueDate);
    return milestoneDate >= today && 
           milestoneDate <= sevenDaysFromNow && 
           milestone.status !== "Completed" &&
           !dismissedNotifications.includes(`milestone-${milestone.id}`);
  });

  // Get recent notes (today)
  const recentNotes = notes.filter(note => {
    const noteDate = fromDateString(note.dateOfNote);
    return noteDate >= todayStart && 
           !dismissedNotifications.includes(`note-${note.id}`);
  });

  const totalNotifications = upcomingMilestones.length + recentNotes.length;

  const dismissNotification = (id: string) => {
    setDismissedNotifications(prev => [...prev, id]);
  };

  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project?.projectName || "Unknown Project";
  };

  const getDaysUntilDue = (dueDate: string) => {
    const due = fromDateString(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (totalNotifications === 0) {
    return null;
  }

  return (
    <Alert className="border-red-200 bg-red-50 mb-6">
      <AlertTriangle className="h-4 w-4 text-red-600" />
      <div className="flex items-center justify-between w-full">
        <div className="flex-1">
          <AlertTitle className="text-red-800 flex items-center gap-2">
            Notifications 
            <Badge variant="destructive">{totalNotifications}</Badge>
          </AlertTitle>
          <AlertDescription className="text-red-700 mt-1">
            {upcomingMilestones.length > 0 && `${upcomingMilestones.length} upcoming milestone${upcomingMilestones.length > 1 ? 's' : ''}`}
            {upcomingMilestones.length > 0 && recentNotes.length > 0 && " • "}
            {recentNotes.length > 0 && `${recentNotes.length} new project update${recentNotes.length > 1 ? 's' : ''}`}
          </AlertDescription>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-red-600 hover:bg-red-100"
        >
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>

      {isExpanded && (
        <div className="mt-4 space-y-3">
          {upcomingMilestones.map((milestone) => {
            const daysUntil = getDaysUntilDue(milestone.dueDate);
            return (
              <div key={milestone.id} className="flex items-center justify-between bg-white rounded-lg p-3 border border-red-200">
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-red-600" />
                  <div>
                    <p className="font-medium text-red-900">
                      {getProjectName(milestone.projectId)} - {milestone.title}
                    </p>
                    <p className="text-sm text-red-700">
                      Due {formatDateForDisplay(milestone.dueDate)} 
                      <span className={daysUntil <= 2 ? "font-bold ml-1" : "ml-1"}>
                        ({daysUntil === 0 ? "Today" : daysUntil === 1 ? "Tomorrow" : `${daysUntil} days`})
                      </span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={milestone.priority === "High" ? "destructive" : milestone.priority === "Medium" ? "secondary" : "outline"}>
                    {milestone.priority}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => dismissNotification(`milestone-${milestone.id}`)}
                    className="text-red-600 hover:bg-red-100"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            );
          })}

          {recentNotes.map((note) => (
            <div key={note.id} className="flex items-center justify-between bg-white rounded-lg p-3 border border-red-200">
              <div className="flex items-center gap-3">
                <FileText className="h-4 w-4 text-red-600" />
                <div>
                  <p className="font-medium text-red-900">
                    New update: {getProjectName(note.projectId)}
                  </p>
                  <p className="text-sm text-red-700">
                    {note.content.length > 80 ? note.content.substring(0, 80) + "..." : note.content}
                  </p>
                  <p className="text-xs text-red-600 mt-1">
                    Added {formatDateForDisplay(note.dateOfNote)}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => dismissNotification(`note-${note.id}`)}
                className="text-red-600 hover:bg-red-100"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </Alert>
  );
};

export default NotificationsAlert;
