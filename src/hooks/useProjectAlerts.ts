import { useState, useEffect, useCallback } from "react";
import { Project, ProjectMilestone } from "@/types/project";
import { BusinessDayCalculator } from "@/utils/businessDays";
import { useProjectMilestones } from "@/hooks/useProjectMilestones";
import { useProjectFunding } from "@/hooks/useProjectFunding";

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

    console.log("🚨 ALERT GENERATION STARTING 🚨");
    console.log("Projects received:", projects.length);
    console.log("Milestones received:", milestones.length);
    console.log("All project names:", projects.map(p => p.projectName));

    const newAlerts: ProjectAlert[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today for accurate comparison
    
    console.log("Today's date:", today.toISOString());
    console.log("Warning days setting:", alertSettings.warningDays);

    // 1. CHECK PROJECT DEADLINES (upcoming and overdue)
    projects.forEach(project => {
      if (project.endDate) {
        const endDate = new Date(project.endDate);
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
            createdAt: new Date(),
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
            createdAt: new Date()
          });
        }
      }
    });

    // 2. CHECK ALL MILESTONE DEADLINES (upcoming and overdue)
    console.log("🔍 ALERTS DEBUG: Checking milestones for alerts");
    console.log("Total milestones:", milestones.length);
    console.log("Total projects:", projects.length);
    
    milestones.forEach(milestone => {
      const project = projects.find(p => p.id === milestone.projectId);
      const projectName = project?.projectName || 'Unknown Project';
      
      console.log(`\n>>> Alert Check: ${milestone.title} (${projectName})`);
      console.log(`    Due: ${milestone.dueDate}`);
      console.log(`    Status: ${milestone.status}`);
      console.log(`    Project ID: ${milestone.projectId}`);
      
      if (milestone.status !== 'Completed' && milestone.dueDate) {
        const dueDate = new Date(milestone.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        const businessDaysUntil = BusinessDayCalculator.getBusinessDaysBetween(today, dueDate);
        
        console.log(`    Business days until due: ${businessDaysUntil}`);
        console.log(`    Is within ${alertSettings.warningDays} days: ${businessDaysUntil > 0 && businessDaysUntil <= alertSettings.warningDays}`);
        console.log(`    Is overdue: ${dueDate < today}`);
        
        // Overdue milestones
        if (dueDate < today) {
          const overdueDays = BusinessDayCalculator.getBusinessDaysBetween(dueDate, today);
          console.log(`    → GENERATING OVERDUE ALERT (${overdueDays} days)`);
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
            createdAt: new Date(),
            isOverdue: true
          });
        }
        // Upcoming milestones
        else if (businessDaysUntil > 0 && businessDaysUntil <= alertSettings.warningDays) {
          console.log(`    → GENERATING UPCOMING ALERT (${businessDaysUntil} days)`);
          newAlerts.push({
            id: `milestone-${milestone.id}`,
            projectId: milestone.projectId,
            projectName: projectName,
            alertType: 'milestone',
            message: `[${projectName}] Milestone "${milestone.title}" is due in ${businessDaysUntil} business day${businessDaysUntil === 1 ? '' : 's'}`,
            dueDate: dueDate,
            businessDaysUntilDue: businessDaysUntil,
            priority: 'high', // ALL alerts are high priority as requested
            isRead: false,
            createdAt: new Date()
          });
        } else {
          console.log(`    → NO ALERT: Not within warning period`);
        }
      } else {
        console.log(`    → NO ALERT: ${milestone.status === 'Completed' ? 'Already completed' : 'No due date'}`);
      }
    });
    
    console.log(`🔍 ALERTS DEBUG: Generated ${newAlerts.length} alerts total`);
    console.log("Alert summary:", newAlerts.map(a => `${a.projectName}: ${a.message}`));

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
          dueDate: project.endDate ? new Date(project.endDate) : new Date(),
          businessDaysUntilDue: 0,
          priority: project.status === "Delayed" ? 'high' : 'medium',
          isRead: false,
          createdAt: new Date(),
          isOverdue: true
        });
      }
    });

    return newAlerts;
  }, [projects, alertSettings, milestones, donorPledges]);

  /**
   * Update alerts when projects or milestones change - with immediate sync
   */
  useEffect(() => {
    console.log("🔄 ALERT SYNC: Projects or milestones changed, regenerating alerts");
    console.log("Current projects count:", projects.length);
    console.log("Current milestones count:", milestones.length);
    
    const newAlerts = generateAlerts();
    setAlerts(newAlerts);
    
    console.log("📊 FINAL ALERT COUNT:", newAlerts.length);
    console.log("Alert projects:", newAlerts.map(a => a.projectName));
  }, [projects, milestones, generateAlerts]); // React to ANY change in projects or milestones

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