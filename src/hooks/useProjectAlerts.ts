import { useState, useEffect, useCallback } from "react";
import { Project } from "@/types/project";
import { BusinessDayCalculator } from "@/utils/businessDays";

export interface ProjectAlert {
  id: string;
  projectId: string;
  projectName: string;
  alertType: 'deadline' | 'milestone' | 'disbursement' | 'report';
  message: string;
  dueDate: Date;
  businessDaysUntilDue: number;
  priority: 'high' | 'medium' | 'low';
  isRead: boolean;
  createdAt: Date;
}

export const useProjectAlerts = (projects: Project[]) => {
  const [alerts, setAlerts] = useState<ProjectAlert[]>([]);
  const [alertSettings] = useState({
    warningDays: 10, // Alert 10 business days before
    enableAlerts: true
  });

  /**
   * Generate alerts for all projects
   */
  const generateAlerts = useCallback(() => {
    if (!alertSettings.enableAlerts) return [];

    const newAlerts: ProjectAlert[] = [];
    const today = new Date();

    projects.forEach(project => {
      // Check project completion deadline
      if (project.endDate) {
        const endDate = new Date(project.endDate);
        const businessDaysUntil = BusinessDayCalculator.getBusinessDaysBetween(today, endDate);
        
        if (businessDaysUntil > 0 && businessDaysUntil <= alertSettings.warningDays) {
          newAlerts.push({
            id: `deadline-${project.id}`,
            projectId: project.id,
            projectName: project.projectName,
            alertType: 'deadline',
            message: `Project "${project.projectName}" is due in ${businessDaysUntil} business day${businessDaysUntil === 1 ? '' : 's'}`,
            dueDate: endDate,
            businessDaysUntilDue: businessDaysUntil,
            priority: businessDaysUntil <= 3 ? 'high' : businessDaysUntil <= 7 ? 'medium' : 'low',
            isRead: false,
            createdAt: new Date()
          });
        }
      }

      // Check milestone deadlines (if project has milestones)
      // This will be expanded when milestone data structure is available
      
      // Note: Disbursement alerts will be implemented when disbursement data structure is available
      // For now, focusing on project deadline alerts
      
      // Add more alert types as needed (status reports, milestones, etc.)

      // Add more alert types as needed (status reports, etc.)
    });

    return newAlerts;
  }, [projects, alertSettings]);

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

  return {
    alerts,
    unreadCount,
    markAlertAsRead,
    markAllAlertsAsRead,
    getAlertsByPriority
  };
};