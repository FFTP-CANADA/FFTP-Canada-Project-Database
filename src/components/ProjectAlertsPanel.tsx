import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Bell, BellOff, Calendar, AlertTriangle, CheckCircle, X } from "lucide-react";
import { ProjectAlert } from "@/hooks/useProjectAlerts";
import { cn } from "@/lib/utils";

interface ProjectAlertsPanelProps {
  alerts: ProjectAlert[];
  unreadCount: number;
  onMarkAsRead: (alertId: string) => void;
  onMarkAllAsRead: () => void;
  demoMode?: boolean;
  className?: string;
}

export const ProjectAlertsPanel = ({ 
  alerts, 
  unreadCount, 
  onMarkAsRead, 
  onMarkAllAsRead,
  demoMode = false,
  className 
}: ProjectAlertsPanelProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getAlertIcon = (alertType: string) => {
    switch (alertType) {
      case 'deadline': return <Calendar className="w-4 h-4" />;
      case 'milestone': return <CheckCircle className="w-4 h-4" />;
      case 'disbursement': return <AlertTriangle className="w-4 h-4" />;
      case 'overdue': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  if (alerts.length === 0) {
    return (
      <Card className={cn("border-green-200 bg-green-50", className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <BellOff className="w-5 h-5 text-green-600" />
            <CardTitle className="text-green-800">No Active Alerts</CardTitle>
          </div>
          <CardDescription className="text-green-600">
            All projects are on track - no deadlines approaching
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

   return (
      <Card className={cn("border-orange-200 bg-orange-50", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-orange-600" />
            <CardTitle className="text-orange-800">Project Alerts</CardTitle>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {unreadCount} new
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={onMarkAllAsRead}
                className="text-xs"
              >
                Mark All Read
              </Button>
            )}
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs"
            >
              {isExpanded ? 'Collapse' : 'View All'}
            </Button>
          </div>
        </div>
        <CardDescription className="text-orange-600">
          {alerts.length} alert{alerts.length === 1 ? '' : 's'} - Items due within 10 business days or overdue
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-0">
        <ScrollArea className={cn("w-full", isExpanded ? "h-96" : "h-32")}>
          <div className="space-y-3">
            {alerts
              .sort((a, b) => {
                // Sort by: overdue first, then unread, then by priority, then by due date
                if (a.isOverdue !== b.isOverdue) return a.isOverdue ? -1 : 1;
                if (a.isRead !== b.isRead) return a.isRead ? 1 : -1;
                const priorityOrder = { high: 3, medium: 2, low: 1 };
                if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
                  return priorityOrder[b.priority] - priorityOrder[a.priority];
                }
                return a.businessDaysUntilDue - b.businessDaysUntilDue;
              })
              .slice(0, isExpanded ? alerts.length : 3)
              .map((alert) => (
                <div 
                  key={alert.id}
                  className={cn(
                    "p-3 rounded-lg border-l-4 transition-all hover:shadow-sm",
                    alert.isRead ? "bg-gray-50 opacity-70" : "bg-white shadow-sm",
                    alert.isOverdue ? "border-l-red-600 bg-red-50" : 
                    alert.priority === 'high' ? "border-l-red-500" : 
                    alert.priority === 'medium' ? "border-l-yellow-500" : "border-l-blue-500"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="mt-0.5">
                        {getAlertIcon(alert.alertType)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge 
                            variant="outline" 
                            className={cn("text-xs", 
                              alert.isOverdue ? "bg-red-100 text-red-800 border-red-200" :
                              getPriorityColor(alert.priority))}
                          >
                            {alert.isOverdue ? 'OVERDUE' : alert.priority.toUpperCase()}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            Due: {formatDate(alert.dueDate)}
                          </span>
                        </div>
                        <p className={cn(
                          "text-sm leading-5",
                          alert.isRead ? "text-gray-600" : "text-gray-900 font-medium"
                        )}>
                          {alert.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {alert.isOverdue ? 
                            `${Math.abs(alert.businessDaysUntilDue)} business day${Math.abs(alert.businessDaysUntilDue) === 1 ? '' : 's'} overdue` :
                            `${alert.businessDaysUntilDue} business day${alert.businessDaysUntilDue === 1 ? '' : 's'} remaining`
                          }
                        </p>
                      </div>
                    </div>
                    {!alert.isRead && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onMarkAsRead(alert.id)}
                        className="h-6 w-6 p-0 hover:bg-gray-200"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
          </div>
          
          {!isExpanded && alerts.length > 3 && (
            <>
              <Separator className="my-3" />
              <Button 
                variant="ghost" 
                className="w-full text-xs text-gray-600"
                onClick={() => setIsExpanded(true)}
              >
                View {alerts.length - 3} more alert{alerts.length - 3 === 1 ? '' : 's'}
              </Button>
            </>
          )}
        </ScrollArea>
      </CardContent>
      </Card>
  );
};