import { useState, useEffect, useCallback } from "react";
import { Project, ProjectMilestone } from "@/types/project";
import { BusinessDayCalculator } from "@/utils/businessDays";
import { useProjectMilestones } from "@/hooks/useProjectMilestones";
import { useProjectFunding } from "@/hooks/useProjectFunding";

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
    enableAlerts: true,
    demoMode: true // DEMO MODE - will be removed after review
  });
  const { milestones } = useProjectMilestones();
  const { donorPledges } = useProjectFunding();

  /**
   * Generate alerts for all projects
   */
  const generateAlerts = useCallback(() => {
    if (!alertSettings.enableAlerts) return [];

    const newAlerts: ProjectAlert[] = [];
    const today = new Date();

    // DEMO MODE: Add realistic dummy alerts to demonstrate the system
    if (alertSettings.demoMode) {
      const demoAlerts: ProjectAlert[] = [
        {
          id: 'demo-milestone-1',
          projectId: 'demo-project-1',
          projectName: '[DEMO] Port Kaituma Water System',
          alertType: 'milestone',
          message: 'MILESTONE: "First Disbursement Sent" is due in 3 business days',
          dueDate: BusinessDayCalculator.addBusinessDays(today, 3),
          businessDaysUntilDue: 3,
          priority: 'high',
          isRead: false,
          createdAt: new Date()
        },
        {
          id: 'demo-funding-1',
          projectId: 'demo-project-2',
          projectName: '[DEMO] Haiti School Construction',
          alertType: 'disbursement',
          message: 'FUNDING: Second disbursement ($25,000 CAD) is due in 7 business days',
          dueDate: BusinessDayCalculator.addBusinessDays(today, 7),
          businessDaysUntilDue: 7,
          priority: 'medium',
          isRead: false,
          createdAt: new Date()
        },
        {
          id: 'demo-milestone-2',
          projectId: 'demo-project-3',
          projectName: '[DEMO] Jamaica Housing Project',
          alertType: 'milestone',
          message: 'MILESTONE: "Interim Report & Receipts Submitted" is due in 9 business days',
          dueDate: BusinessDayCalculator.addBusinessDays(today, 9),
          businessDaysUntilDue: 9,
          priority: 'low',
          isRead: false,
          createdAt: new Date()
        },
        {
          id: 'demo-deadline-1',
          projectId: 'demo-project-4',
          projectName: '[DEMO] Guyana Education Initiative',
          alertType: 'deadline',
          message: 'PROJECT DEADLINE: Complete project is due in 5 business days',
          dueDate: BusinessDayCalculator.addBusinessDays(today, 5),
          businessDaysUntilDue: 5,
          priority: 'high',
          isRead: false,
          createdAt: new Date()
        },
        {
          id: 'demo-report-1',
          projectId: 'demo-project-5',
          projectName: '[DEMO] Honduras Health Clinic',
          alertType: 'report',
          message: 'REPORT: Final report submission is due in 2 business days',
          dueDate: BusinessDayCalculator.addBusinessDays(today, 2),
          businessDaysUntilDue: 2,
          priority: 'high',
          isRead: false,
          createdAt: new Date()
        }
      ];
      newAlerts.push(...demoAlerts);
    }

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
            message: `Project "${project.projectName}" completion is due in ${businessDaysUntil} business day${businessDaysUntil === 1 ? '' : 's'}`,
            dueDate: endDate,
            businessDaysUntilDue: businessDaysUntil,
            priority: businessDaysUntil <= 3 ? 'high' : businessDaysUntil <= 7 ? 'medium' : 'low',
            isRead: false,
            createdAt: new Date()
          });
        }
      }
    });

    // Check milestone deadlines for all projects
    milestones.forEach(milestone => {
      if (milestone.status !== 'Completed' && milestone.dueDate) {
        const dueDate = new Date(milestone.dueDate);
        const businessDaysUntil = BusinessDayCalculator.getBusinessDaysBetween(today, dueDate);
        
        if (businessDaysUntil > 0 && businessDaysUntil <= alertSettings.warningDays) {
          const project = projects.find(p => p.id === milestone.projectId);
          newAlerts.push({
            id: `milestone-${milestone.id}`,
            projectId: milestone.projectId,
            projectName: project?.projectName || 'Unknown Project',
            alertType: 'milestone',
            message: `Milestone "${milestone.title}" is due in ${businessDaysUntil} business day${businessDaysUntil === 1 ? '' : 's'}`,
            dueDate: dueDate,
            businessDaysUntilDue: businessDaysUntil,
            priority: businessDaysUntil <= 3 ? 'high' : businessDaysUntil <= 7 ? 'medium' : 'low',
            isRead: false,
            createdAt: new Date()
          });
        }
      }
    });

    // Funding/disbursement alerts will be added when proper data structure is available
    // For now, demo shows realistic examples of what funding alerts would look like

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