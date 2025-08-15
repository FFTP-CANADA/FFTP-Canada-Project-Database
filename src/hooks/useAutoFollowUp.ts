
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
  trigger: "milestone" | "note";
  noteContent?: string;
}

export const useAutoFollowUp = (
  projects: Project[],
  milestones: ProjectMilestone[],
  notes: ProjectNote[]
) => {
  const [followUpEmails, setFollowUpEmails] = useState<FollowUpEmail[]>([]);
  const [lastNoteCount, setLastNoteCount] = useState(0);

  const generateGovernanceDocumentEmail = (project: Project, milestone: ProjectMilestone): string => {
    const totalCost = project.totalCost || 0;
    const formattedCost = formatCurrency(totalCost, project.currency);
    
    return `Subject: Reminder: ${project.governanceType || '[GOVERNANCE TYPE]'} (${project.governanceNumber || '[GOVERNANCE NUMBER]'}) for ${project.projectName}

Dear ${project.partnerName || '[PARTNER NAME]'},

This is a courtesy reminder that the ${project.governanceType || '[GOVERNANCE TYPE]'} (Reference: ${project.governanceNumber || '[GOVERNANCE NUMBER]'}) for the ${project.projectName} was sent for your review and signature. The anticipated signing date is ${new Date(milestone.dueDate).toLocaleDateString('en-CA', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })}.

As outlined, the timely signing of this document will allow us to proceed with the first disbursement in line with the agreed terms.

Project Overview:

Project Cost: ${formattedCost}

Start Date: ${new Date(project.startDate).toLocaleDateString('en-CA', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })}

End Date: ${project.endDate ? new Date(project.endDate).toLocaleDateString('en-CA', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }) : '[PROJECT END DATE]'}

We appreciate your attention to this matter and look forward to receiving the signed document at your earliest convenience.

Kind regards,
[SENDER NAME]
[SENDER POSITION]
[SENDER ORGANIZATION]`;
  };

  const generateFirstDisbursementEmail = (project: Project, milestone: ProjectMilestone): string => {
    const disbursementAmount = milestone.disbursementAmount || 0;
    const formattedDisbursementAmount = formatCurrency(disbursementAmount, project.currency);
    const totalCost = project.totalCost || 0;
    const formattedCost = formatCurrency(totalCost, project.currency);
    
    // Calculate interim report date (typically 30 days from disbursement)
    const interimReportDate = milestone.completedDate 
      ? new Date(new Date(milestone.completedDate).getTime() + 30 * 24 * 60 * 60 * 1000)
      : new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000);
    
    return `Subject: First Disbursement Sent – ${project.projectName}

Dear ${project.partnerName || '[PARTNER NAME]'},

This is to confirm that the first disbursement for the ${project.projectName} has been sent in accordance with the ${project.governanceType || '[GOVERNANCE TYPE]'} (Reference: ${project.governanceNumber || '[GOVERNANCE NUMBER]'}).

Transaction Details:

Amount Transferred: ${formattedDisbursementAmount}

Date of Transfer: ${new Date(milestone.completedDate || milestone.dueDate).toLocaleDateString('en-CA', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })}

Project Overview:

Project Cost: ${formattedCost}

Start Date: ${new Date(project.startDate).toLocaleDateString('en-CA', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })}

End Date: ${project.endDate ? new Date(project.endDate).toLocaleDateString('en-CA', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }) : '[PROJECT END DATE]'}

For your records, please find attached:

The official wire sheet.

The bank wire confirmation.

Kindly confirm receipt of this disbursement at your earliest convenience. We also look forward to receiving your Interim Report & Receipts by ${interimReportDate.toLocaleDateString('en-CA', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })}, as scheduled in the referenced ${project.governanceType || '[GOVERNANCE TYPE]'}.

Should you have any questions or require additional documentation, please feel free to reach out.

Kind regards,
Joan Tulloch
Food For The Poor Canada
joannt@foodforthepoor.ca`;
  };

  const generateFollowUpEmail = (
    project: Project,
    milestone: ProjectMilestone,
    projectNotes: ProjectNote[],
    trigger: "milestone" | "note" = "milestone",
    triggerNote?: ProjectNote
  ): string => {
    // Use special template for Governance Document Signed milestones
    if (milestone.milestoneType === "Governance Document Signed") {
      return generateGovernanceDocumentEmail(project, milestone);
    }

    // Use special template for First Disbursement Sent milestones
    if (milestone.milestoneType === "First Disbursement Sent") {
      return generateFirstDisbursementEmail(project, milestone);
    }

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

    const triggerContext = trigger === "note" && triggerNote
      ? `\n\nThis follow-up was triggered by a new project note added on ${new Date(triggerNote.dateOfNote).toLocaleDateString('en-CA')}:\n"${triggerNote.content}"\n\nPlease review this update and provide any necessary clarification or response.`
      : '';

    const subjectPrefix = trigger === "note" ? "Action Required - New Update:" : "Follow-up Required:";

    return `Subject: ${subjectPrefix} ${project.projectName} - ${milestone.title}

Dear ${project.partnerName || 'Partner'},

I hope this email finds you well. ${trigger === "note" ? "I am writing to follow up on a recent update regarding" : "I am writing to follow up on"} the ${project.projectName} project${trigger === "milestone" ? " as we approach an important milestone" : ""}.

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

${trigger === "milestone" ? `UPCOMING MILESTONE:
• Milestone: ${milestone.title}
• Due Date: ${new Date(milestone.dueDate).toLocaleDateString('en-CA', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })}
• Priority: ${milestone.priority}${milestoneTypeContext}` : ''}${triggerContext}

ACTION REQUIRED:
${trigger === "note" ? "Please review the recent update and provide any necessary response or clarification. Additionally, to ensure we stay on track with project milestones, please provide the following:" :
"To ensure we stay on track with this milestone, please provide the following:"}

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
    console.log("=== FOLLOW-UP GENERATION DEBUG ===");
    console.log("Total projects:", projects.length);
    console.log("Total milestones:", milestones.length);
    console.log("Projects with followUpNeeded:", projects.filter(p => p.followUpNeeded).length);
    
    const today = new Date();
    const tenDaysFromNow = new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000);
    console.log("Today:", today.toISOString());
    console.log("Ten days from now:", tenDaysFromNow.toISOString());
    
    const newFollowUps: FollowUpEmail[] = [];

    projects
      .filter(project => project.followUpNeeded)
      .forEach(project => {
        console.log(`\n--- Processing project: ${project.projectName} ---`);
        const projectMilestones = milestones.filter(m => m.projectId === project.id);
        const projectNotes = notes.filter(n => n.projectId === project.id);
        console.log(`Project milestones found: ${projectMilestones.length}`);
        console.log(`Project notes found: ${projectNotes.length}`);
        
        // Check for milestone-based follow-ups
        projectMilestones.forEach(milestone => {
          const milestoneDate = new Date(milestone.dueDate);
          console.log(`Checking milestone: ${milestone.title}, due: ${milestone.dueDate}, status: ${milestone.status}`);
          console.log(`Milestone date: ${milestoneDate.toISOString()}`);
          console.log(`Is milestone in range? ${milestoneDate >= today && milestoneDate <= tenDaysFromNow}`);
          console.log(`Is milestone not completed? ${milestone.status !== "Completed"}`);
          
          // Check if milestone is within 10 days and hasn't been completed
          if (milestoneDate >= today && 
              milestoneDate <= tenDaysFromNow && 
              milestone.status !== "Completed") {
            
            // Check if we haven't already generated a follow-up for this milestone
            const existingFollowUp = followUpEmails.find(
              email => email.projectId === project.id && 
                      email.milestoneTitle === milestone.title &&
                      email.trigger === "milestone"
            );
            
            console.log(`Existing follow-up found: ${!!existingFollowUp}`);
            
            if (!existingFollowUp) {
              console.log(`Generating milestone follow-up for: ${milestone.title}`);
              const draftEmail = generateFollowUpEmail(project, milestone, projectNotes, "milestone");
              
              newFollowUps.push({
                id: `${project.id}-${milestone.id}-milestone-${Date.now()}`,
                projectId: project.id,
                projectName: project.projectName,
                milestoneTitle: milestone.title,
                milestoneDueDate: milestone.dueDate,
                draftEmail,
                generated: new Date().toISOString(),
                priority: milestone.priority,
                trigger: "milestone"
              });
            }
          }
        });

        // Check for note-based follow-ups (new notes added today)
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const recentNotes = projectNotes.filter(note => {
          const noteDate = new Date(note.dateOfNote);
          return noteDate >= todayStart;
        });

        console.log(`Recent notes (today): ${recentNotes.length}`);

        recentNotes.forEach(note => {
          // Find the next upcoming milestone for this project
          const upcomingMilestone = projectMilestones
            .filter(m => new Date(m.dueDate) >= today && m.status !== "Completed")
            .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];

          if (upcomingMilestone) {
            console.log(`Found upcoming milestone for note: ${upcomingMilestone.title}`);
            // Check if we haven't already generated a note-based follow-up for this note
            const existingNoteFollowUp = followUpEmails.find(
              email => email.projectId === project.id && 
                      email.trigger === "note" &&
                      email.noteContent === note.content
            );

            if (!existingNoteFollowUp) {
              console.log(`Generating note follow-up for note: ${note.content.substring(0, 50)}...`);
              const draftEmail = generateFollowUpEmail(project, upcomingMilestone, projectNotes, "note", note);
              
              newFollowUps.push({
                id: `${project.id}-note-${note.id}-${Date.now()}`,
                projectId: project.id,
                projectName: project.projectName,
                milestoneTitle: upcomingMilestone.title,
                milestoneDueDate: upcomingMilestone.dueDate,
                draftEmail,
                generated: new Date().toISOString(),
                priority: upcomingMilestone.priority,
                trigger: "note",
                noteContent: note.content
              });
            }
          } else {
            console.log(`No upcoming milestone found for note follow-up`);
          }
        });
      });

    console.log(`Total new follow-ups generated: ${newFollowUps.length}`);
    console.log("=== END FOLLOW-UP GENERATION DEBUG ===");

    if (newFollowUps.length > 0) {
      setFollowUpEmails(prev => [...prev, ...newFollowUps]);
    }
  };

  useEffect(() => {
    checkAndGenerateFollowUps();
    setLastNoteCount(notes.length);
  }, [projects, milestones, notes]);

  // Check for new notes specifically
  useEffect(() => {
    if (notes.length > lastNoteCount) {
      checkAndGenerateFollowUps();
      setLastNoteCount(notes.length);
    }
  }, [notes.length, lastNoteCount]);

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
