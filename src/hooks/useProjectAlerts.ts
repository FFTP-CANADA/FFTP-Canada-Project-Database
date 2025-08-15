import { useState, useEffect, useCallback } from "react";
import { Project, ProjectMilestone } from "@/types/project";
import { BusinessDayCalculator } from "@/utils/businessDays";
import { useProjectMilestones } from "@/hooks/useProjectMilestones";
import { useProjectFunding } from "@/hooks/useProjectFunding";
import { getCurrentESTDate, fromDateString, toESTDate } from "@/utils/dateUtils";

export interface ProjectAlert {
  id: string;
  projectId: string;
  projectName: string;
  alertType: 'deadline' | 'milestone' | 'disbursement' | 'report' | 'overdue';
  message: string;
  dueDate: Date;
  businessDaysUntilDue: number;
  priority: 'high' | 'medium' | 'low';
  isRead: boolean;
  createdAt: Date;
  isOverdue?: boolean;
}

export const useProjectAlerts = (projects: Project[]) => {
  const [alerts, setAlerts] = useState<ProjectAlert[]>([]);
  const [alertSettings] = useState({
    warningDays: 10, // Alert 10 business days before
    enableAlerts: true,
    demoMode: false // Demo removed as requested
  });
  const { milestones } = useProjectMilestones();
  const { donorPledges } = useProjectFunding();

  /**
   * Generate alerts for all projects
   */
  const generateAlerts = useCallback(() => {
    if (!alertSettings.enableAlerts) return [];

    const newAlerts: ProjectAlert[] = [];
    const today = getCurrentESTDate();
    today.setHours(0, 0, 0, 0); // Start of today for accurate comparison

    // 1. CHECK PROJECT DEADLINES (upcoming and overdue)
    projects.forEach(project => {
      if (project.endDate) {
        const endDate = fromDateString(project.endDate);
        endDate.setHours(0, 0, 0, 0);
        const businessDaysUntil = BusinessDayCalculator.getBusinessDaysBetween(today, endDate);
        
        // Overdue project deadlines
        if (endDate < today) {
          const overdueDays = BusinessDayCalculator.getBusinessDaysBetween(endDate, today);
          newAlerts.push({
            id: `overdue-deadline-${project.id}`,
            projectId: project.id,
            projectName: project.projectName,
            alertType: 'overdue',
            message: `🚨 OVERDUE: [${project.projectName}] Project was due ${overdueDays} business day${overdueDays === 1 ? '' : 's'} ago`,
            dueDate: endDate,
            businessDaysUntilDue: -overdueDays,
            priority: 'high',
            isRead: false,
            createdAt: getCurrentESTDate(),
            isOverdue: true
          });
        }
        // Upcoming project deadlines
        else if (businessDaysUntil > 0 && businessDaysUntil <= alertSettings.warningDays) {
          newAlerts.push({
            id: `deadline-${project.id}`,
            projectId: project.id,
            projectName: project.projectName,
            alertType: 'deadline',
            message: `[${project.projectName}] Project completion is due in ${businessDaysUntil} business day${businessDaysUntil === 1 ? '' : 's'}`,
            dueDate: endDate,
            businessDaysUntilDue: businessDaysUntil,
            priority: businessDaysUntil <= 3 ? 'high' : businessDaysUntil <= 7 ? 'medium' : 'low',
            isRead: false,
            createdAt: getCurrentESTDate()
          });
        }
      }
    });

    // 2. CHECK ALL MILESTONE DEADLINES (upcoming and overdue)
    milestones.forEach(milestone => {
      if (milestone.status !== 'Completed' && milestone.dueDate) {
        const dueDate = fromDateString(milestone.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        const businessDaysUntil = BusinessDayCalculator.getBusinessDaysBetween(today, dueDate);
        const project = projects.find(p => p.id === milestone.projectId);
        const projectName = project?.projectName || 'Unknown Project';
        
        // Overdue milestones
        if (dueDate < today) {
          const overdueDays = BusinessDayCalculator.getBusinessDaysBetween(dueDate, today);
          newAlerts.push({
            id: `overdue-milestone-${milestone.id}`,
            projectId: milestone.projectId,
            projectName: projectName,
            alertType: 'overdue',
            message: `🚨 OVERDUE: [${projectName}] Milestone "${milestone.title}" was due ${overdueDays} business day${overdueDays === 1 ? '' : 's'} ago`,
            dueDate: dueDate,
            businessDaysUntilDue: -overdueDays,
            priority: 'high',
            isRead: false,
            createdAt: getCurrentESTDate(),
            isOverdue: true
          });
        }
        // Upcoming milestones
        else if (businessDaysUntil > 0 && businessDaysUntil <= alertSettings.warningDays) {
          newAlerts.push({
            id: `milestone-${milestone.id}`,
            projectId: milestone.projectId,
            projectName: projectName,
            alertType: 'milestone',
            message: `[${projectName}] Milestone "${milestone.title}" is due in ${businessDaysUntil} business day${businessDaysUntil === 1 ? '' : 's'}`,
            dueDate: dueDate,
            businessDaysUntilDue: businessDaysUntil,
            priority: businessDaysUntil <= 3 ? 'high' : businessDaysUntil <= 7 ? 'medium' : 'low',
            isRead: false,
            createdAt: getCurrentESTDate()
          });
        }
      }
    });

    // 3. CHECK FUNDING/DISBURSEMENT DEADLINES
    // Note: Will be implemented when proper disbursement date structure is available
    // Current DonorPledge structure has pledgedAmount and expectedDate but no disbursement schedule

    // 4. CHECK FOR DELAYED PROJECTS (status-based)
    projects.forEach(project => {
      if (project.status === "Delayed" || project.status === "Needs Attention") {
        newAlerts.push({
          id: `status-${project.id}`,
          projectId: project.id,
          projectName: project.projectName,
          alertType: 'overdue',
          message: `⚠️ [${project.projectName}] Project status is ${project.status.toUpperCase()}`,
          dueDate: project.endDate ? fromDateString(project.endDate) : getCurrentESTDate(),
          businessDaysUntilDue: 0,
          priority: project.status === "Delayed" ? 'high' : 'medium',
          isRead: false,
          createdAt: getCurrentESTDate(),
          isOverdue: true
        });
      }
    });

    return newAlerts;
  }, [projects, alertSettings, milestones, donorPledges]);

  /**
   * Update alerts when projects change
   */
  useEffect(() => {
    const newAlerts = generateAlerts();
    setAlerts(newAlerts);
  }, [generateAlerts]);

  /**
   * Mark an alert as read
   */
  const markAlertAsRead = useCallback((alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, isRead: true } : alert
    ));
  }, []);

  /**
   * Mark all alerts as read
   */
  const markAllAlertsAsRead = useCallback(() => {
    setAlerts(prev => prev.map(alert => ({ ...alert, isRead: true })));
  }, []);

  /**
   * Get unread alerts count
   */
  const unreadCount = alerts.filter(alert => !alert.isRead).length;

  /**
   * Get alerts by priority
   */
  const getAlertsByPriority = useCallback((priority: 'high' | 'medium' | 'low') => {
    return alerts.filter(alert => alert.priority === priority);
  }, [alerts]);

  /**
   * Disable demo mode (call this after review)
   */
  const disableDemoMode = useCallback(() => {
    // This will be used to remove demo alerts after review
    console.log('Demo mode disabled - alerts now show real data only');
  }, []);

  return {
    alerts,
    unreadCount,
    markAlertAsRead,
    markAllAlertsAsRead,
    getAlertsByPriority,
    demoMode: alertSettings.demoMode,
    disableDemoMode
  };
};