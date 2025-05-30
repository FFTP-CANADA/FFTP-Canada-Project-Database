
import { useState, useEffect } from "react";
import { Project, ProjectMilestone, ProjectNote } from "@/types/project";
import { formatCurrency, convertUsdToCad } from "@/utils/currencyUtils";

export interface FollowUpEmail {
  id: string;
  projectId: string;
  projectName: string;
  milestoneTitle: string;
  milestoneDueDate: string;
  draftEmail: string;
  generated: string;
  priority: "High" | "Medium" | "Low";
}

export const useAutoFollowUp = (
  projects: Project[],
  milestones: ProjectMilestone[],
  notes: ProjectNote[]
) => {
  const [followUpEmails, setFollowUpEmails] = useState<FollowUpEmail[]>([]);

  const generateFollowUpEmail = (
    project: Project,
    milestone: ProjectMilestone,
    projectNotes: ProjectNote[]
  ): string => {
    const totalCostCAD = project.currency === 'USD' 
      ? convertUsdToCad(project.totalCost || 0)
      : (project.totalCost || 0);
    
    const disbursedCAD = project.currency === 'USD'
      ? convertUsdToCad(project.amountDisbursed)
      : project.amountDisbursed;

    const reportedSpendCAD = project.currency === 'USD'
      ? convertUsdToCad(project.reportedSpend)
      : project.reportedSpend;

    const outstandingAmount = disbursedCAD - reportedSpendCAD;

    // Extract recent notes for context
    const recentNotes = projectNotes
      .sort((a, b) => new Date(b.dateOfNote).getTime() - new Date(a.dateOfNote).getTime())
      .slice(0, 3);

    const notesContext = recentNotes.length > 0 
      ? `\n\nBased on our recent project notes:\n${recentNotes.map(note => `• ${note.content}`).join('\n')}`
      : '';

    const milestoneTypeContext = milestone.milestoneType 
      ? `\n\nThis follow-up is regarding the upcoming milestone: "${milestone.milestoneType}"`
      : '';

    return `Subject: Follow-up Required: ${project.projectName} - ${milestone.title}

Dear ${project.partnerName || 'Partner'},

I hope this email finds you well. I am writing to follow up on the ${project.projectName} project as we approach an important milestone.

PROJECT DETAILS:
• Project: ${project.projectName}
• Country: ${project.country || 'Not specified'}
• Impact Area: ${project.impactArea}
• Current Status: ${project.status}

FINANCIAL SUMMARY:
• Total Project Cost: ${formatCurrency(totalCostCAD, 'CAD')}
• Amount Disbursed: ${formatCurrency(disbursedCAD, 'CAD')}
• Reported Spend: ${formatCurrency(reportedSpendCAD, 'CAD')}
• Outstanding Amount: ${formatCurrency(outstandingAmount, 'CAD')}

UPCOMING MILESTONE:
• Milestone: ${milestone.title}
• Due Date: ${new Date(milestone.dueDate).toLocaleDateString('en-CA', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })}
• Priority: ${milestone.priority}${milestoneTypeContext}

ACTION REQUIRED:
To ensure we stay on track with this milestone, please provide the following:

${milestone.milestoneType?.includes('Disbursement') ? 
  '• Confirmation of readiness to receive the next disbursement\n• Updated bank account information if needed\n• Any changes to project implementation plans' :
  milestone.milestoneType?.includes('Receipts') ?
  '• Financial receipts and documentation for the previous disbursement\n• Detailed expenditure report\n• Progress photos and implementation updates' :
  milestone.milestoneType?.includes('Report') ?
  '• Comprehensive project report including outcomes and impact\n• Financial summary with all supporting documentation\n• Lessons learned and recommendations for future projects' :
  '• Current project status update\n• Any challenges or delays encountered\n• Next steps and timeline confirmation'
}

${outstandingAmount > 0 ? 
  `\nPLEASE NOTE: We currently show an outstanding amount of ${formatCurrency(outstandingAmount, 'CAD')} that requires documentation. Please prioritize providing receipts and reports for these funds.` : 
  ''
}${notesContext}

Please respond by ${new Date(new Date(milestone.dueDate).getTime() - 5 * 24 * 60 * 60 * 1000).toLocaleDateString('en-CA', { 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric' 
})} to ensure we can process everything before the milestone deadline.

If you have any questions or need assistance, please don't hesitate to reach out.

Thank you for your continued partnership.

Best regards,
Joan Tulloch
Food For The Poor Canada
joannt@foodforthepoor.ca`;
  };

  const checkAndGenerateFollowUps = () => {
    const today = new Date();
    const tenDaysFromNow = new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000);
    
    const newFollowUps: FollowUpEmail[] = [];

    projects
      .filter(project => project.followUpNeeded)
      .forEach(project => {
        const projectMilestones = milestones.filter(m => m.projectId === project.id);
        const projectNotes = notes.filter(n => n.projectId === project.id);
        
        projectMilestones.forEach(milestone => {
          const milestoneDate = new Date(milestone.dueDate);
          
          // Check if milestone is within 10 days and hasn't been completed
          if (milestoneDate >= today && 
              milestoneDate <= tenDaysFromNow && 
              milestone.status !== "Completed") {
            
            // Check if we haven't already generated a follow-up for this milestone
            const existingFollowUp = followUpEmails.find(
              email => email.projectId === project.id && 
                      email.milestoneTitle === milestone.title
            );
            
            if (!existingFollowUp) {
              const draftEmail = generateFollowUpEmail(project, milestone, projectNotes);
              
              newFollowUps.push({
                id: `${project.id}-${milestone.id}-${Date.now()}`,
                projectId: project.id,
                projectName: project.projectName,
                milestoneTitle: milestone.title,
                milestoneDueDate: milestone.dueDate,
                draftEmail,
                generated: new Date().toISOString(),
                priority: milestone.priority
              });
            }
          }
        });
      });

    if (newFollowUps.length > 0) {
      setFollowUpEmails(prev => [...prev, ...newFollowUps]);
    }
  };

  useEffect(() => {
    checkAndGenerateFollowUps();
  }, [projects, milestones, notes]);

  const markFollowUpSent = (followUpId: string) => {
    setFollowUpEmails(prev => prev.filter(email => email.id !== followUpId));
  };

  const dismissFollowUp = (followUpId: string) => {
    setFollowUpEmails(prev => prev.filter(email => email.id !== followUpId));
  };

  return {
    followUpEmails,
    markFollowUpSent,
    dismissFollowUp,
    checkAndGenerateFollowUps
  };
};
