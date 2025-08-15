import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Mail, Send } from "lucide-react";
import { Project, ProjectMilestone } from "@/types/project";
import { formatDateForDisplay } from "@/utils/dateUtils";
import { toast } from "sonner";

interface AutomatedEmailGeneratorProps {
  project: Project;
  milestone: ProjectMilestone;
  isOpen: boolean;
  onClose: () => void;
}

export const AutomatedEmailGenerator = ({ 
  project, 
  milestone, 
  isOpen, 
  onClose 
}: AutomatedEmailGeneratorProps) => {
  const [senderName, setSenderName] = useState("Food For The Poor Canada Team");
  const [senderPosition, setSenderPosition] = useState("Project Coordinator");
  const [senderOrganization, setSenderOrganization] = useState("Food For The Poor Canada");
  const [partnerName, setPartnerName] = useState(project.partnerName || "[Partner Name]");
  const [officerName, setOfficerName] = useState("[Officer Name]");

  const getEmailTemplate = () => {
    const milestoneType = milestone.milestoneType || milestone.title;
    
    if (milestoneType === "Governance Document Signed" || 
        milestone.title.toLowerCase().includes("governance") ||
        milestone.title.toLowerCase().includes("agreement") ||
        milestone.title.toLowerCase().includes("lod")) {
      return "governance";
    } else if (milestoneType === "First Disbursement Sent" ||
               milestone.title.toLowerCase().includes("first disbursement")) {
      return "firstDisbursement";
    } else if (milestoneType === "Second Disbursement Sent" ||
               milestone.title.toLowerCase().includes("second disbursement")) {
      return "secondDisbursement";
    } else if (milestoneType === "Interim Report & Receipts Submitted (following Installment #1)" ||
               milestone.title.toLowerCase().includes("interim report") ||
               milestone.title.toLowerCase().includes("receipts submitted")) {
      // Check if milestone is completed to determine which template to use
      if (milestone.status === "Completed") {
        return "interimReportInternal";
      } else {
        return "interimReport";
      }
    }
    return "generic";
  };

  const generateEmailContent = () => {
    const governanceType = project.governanceType || "GOVERNANCE DOCUMENT";
    const governanceNumber = project.governanceNumber || "PENDING";
    const projectCost = project.totalCost 
      ? `${project.currency} $${project.totalCost.toLocaleString()}` 
      : "To be confirmed";
    
    const emailTemplate = getEmailTemplate();
    
    if (emailTemplate === "governance") {
      const subject = `Reminder: ${governanceType} (${governanceNumber}) for ${project.projectName}`;

      const emailBody = `Dear ${partnerName},

This is a courtesy reminder that the ${governanceType} (Reference: ${governanceNumber}) for the ${project.projectName} was sent for your review and signature. The anticipated signing date is ${formatDateForDisplay(milestone.dueDate)}.

As outlined, the timely signing of this document will allow us to proceed with the first disbursement in line with the agreed terms.

Project Overview:

Project Cost: ${projectCost}
Start Date: ${formatDateForDisplay(project.startDate)}
End Date: ${project.endDate ? formatDateForDisplay(project.endDate) : "To be determined"}
Country: ${project.country || "Multiple locations"}
Impact Area: ${project.impactArea}
Fund Type: ${project.fundType}

We appreciate your attention to this matter and look forward to receiving the signed document at your earliest convenience.

Kind regards,
${senderName}
${senderPosition}
${senderOrganization}`;

      return { subject, emailBody };
    
    } else if (emailTemplate === "firstDisbursement") {
      const disbursementAmount = milestone.disbursementAmount 
        ? `${project.currency} $${milestone.disbursementAmount.toLocaleString()}`
        : `${project.currency} $${Math.round((project.totalCost || 0) * 0.33).toLocaleString()} (estimated 33%)`;
      
      const disbursementDate = milestone.completedDate 
        ? formatDateForDisplay(milestone.completedDate)
        : formatDateForDisplay(milestone.dueDate);
      
      // Calculate interim report date (typically 60 days after disbursement)
      const interimReportDate = new Date(milestone.completedDate || milestone.dueDate);
      interimReportDate.setDate(interimReportDate.getDate() + 60);
      
      const subject = `First Disbursement Sent – ${project.projectName}`;

      const emailBody = `Dear ${partnerName},

This is to confirm that the first disbursement for the ${project.projectName} has been sent in accordance with the ${governanceType} (Reference: ${governanceNumber}).

Transaction Details:

Amount Transferred: ${disbursementAmount}
Date of Transfer: ${disbursementDate}

Project Overview:

Project Cost: ${projectCost}
Start Date: ${formatDateForDisplay(project.startDate)}
End Date: ${project.endDate ? formatDateForDisplay(project.endDate) : "To be determined"}

For your records, please find attached:

The official wire sheet.
The bank wire confirmation.

Kindly confirm receipt of this disbursement at your earliest convenience. We also look forward to receiving your Interim Report & Receipts by ${formatDateForDisplay(interimReportDate.toISOString().split('T')[0])}, as scheduled in the referenced ${governanceType}.

Should you have any questions or require additional documentation, please feel free to reach out.

Kind regards,
${senderName}
${senderPosition}
${senderOrganization}`;

      return { subject, emailBody };
    
    } else if (emailTemplate === "interimReport") {
      const subject = `Reminder – Interim Report & Receipts Due for ${project.projectName}`;

      const emailBody = `Dear ${partnerName},

This is a friendly reminder that the Interim Report & Receipts for the ${project.projectName} are due by ${formatDateForDisplay(milestone.dueDate)}, as outlined in the ${governanceType} (Reference: ${governanceNumber}).

The submission of this report, along with supporting receipts, is essential for us to review progress and proceed with the next scheduled disbursement in accordance with the agreement.

Project Overview:

Project Cost: ${projectCost}
Start Date: ${formatDateForDisplay(project.startDate)}
End Date: ${project.endDate ? formatDateForDisplay(project.endDate) : "To be determined"}

Thank you for your cooperation and continued partnership in ensuring the successful delivery of this project.

Kind regards,
${senderName}
${senderPosition}
${senderOrganization}`;

      return { subject, emailBody };
    
    } else if (emailTemplate === "interimReportInternal") {
      // Calculate second disbursement date (typically 30 days after interim report received)
      const secondDisbursementDate = new Date(milestone.completedDate || milestone.dueDate);
      secondDisbursementDate.setDate(secondDisbursementDate.getDate() + 30);
      
      const subject = `Interim Report Received – ${project.projectName} (For Review & Donor Update)`;

      const emailBody = `Dear ${officerName},

The Interim Report & Receipts for the ${project.projectName} have been received from ${partnerName}, as per the ${governanceType} (Reference: ${governanceNumber}). The report and supporting documentation are attached for your detailed review.

Please prepare the relevant donor update to keep our donor informed of the project's progress. This update should be finalized promptly, as the second disbursement under this project is scheduled for ${formatDateForDisplay(secondDisbursementDate.toISOString().split('T')[0])}, pending confirmation that there are no concerns with the submitted report.

Kindly review the attached documentation and confirm within the next three (3) business days whether you have any questions or concerns. If no concerns are raised, we will proceed with the disbursement to the partner as scheduled.

Thank you for your attention to this matter and for ensuring our donor remains up to date.

Kind regards,
${senderName}
${senderPosition}
${senderOrganization}`;

      return { subject, emailBody };
    
    } else if (emailTemplate === "secondDisbursement") {
      const disbursementAmount = milestone.disbursementAmount 
        ? `${project.currency} $${milestone.disbursementAmount.toLocaleString()}`
        : `${project.currency} $${Math.round((project.totalCost || 0) * 0.33).toLocaleString()} (estimated 33%)`;
      
      const disbursementDate = milestone.completedDate 
        ? formatDateForDisplay(milestone.completedDate)
        : formatDateForDisplay(milestone.dueDate);
      
      const subject = `Second Disbursement Sent – ${project.projectName}`;

      const emailBody = `Dear ${officerName},

This is to confirm that the second disbursement for the ${project.projectName} has been sent to ${partnerName}, in accordance with the ${governanceType} (Reference: ${governanceNumber}).

Transaction Details:

Amount Transferred: ${disbursementAmount}
Date of Transfer: ${disbursementDate}

Project Overview:

Project Cost: ${projectCost}
Start Date: ${formatDateForDisplay(project.startDate)}
End Date: ${project.endDate ? formatDateForDisplay(project.endDate) : "To be determined"}

For your reference, please find attached:

The official wire sheet.
The bank wire confirmation.

Kindly proceed with any necessary donor communications to keep them informed of this milestone. Please let me know if you require additional details for your update.

Thank you for ensuring our donor remains engaged and updated on the project's progress.

Kind regards,
${senderName}
${senderPosition}
${senderOrganization}`;

      return { subject, emailBody };
    }

    // Generic template fallback
    const subject = `Project Update: ${project.projectName} - ${milestone.title}`;
    const emailBody = `Dear ${partnerName},

This is regarding the ${project.projectName} milestone: ${milestone.title}.

Due Date: ${formatDateForDisplay(milestone.dueDate)}

Project Overview:

Project Cost: ${projectCost}
Start Date: ${formatDateForDisplay(project.startDate)}
End Date: ${project.endDate ? formatDateForDisplay(project.endDate) : "To be determined"}

Please contact us if you have any questions.

Kind regards,
${senderName}
${senderPosition}
${senderOrganization}`;

    return { subject, emailBody };
  };

  const { subject, emailBody } = generateEmailContent();
  const emailTemplate = getEmailTemplate();
  
  const getDialogTitle = () => {
    switch (emailTemplate) {
      case "governance": return "Governance Document Reminder Email";
      case "firstDisbursement": return "First Disbursement Confirmation Email";
      case "secondDisbursement": return "Internal Second Disbursement Confirmation Email";
      case "interimReport": return "Interim Report & Receipts Reminder Email";
      case "interimReportInternal": return "Internal Donor Engagement Advisory Email";
      default: return "Project Milestone Email";
    }
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(`${type} copied to clipboard`);
    }).catch(() => {
      toast.error(`Failed to copy ${type}`);
    });
  };

  const copyFullEmail = () => {
    const fullEmail = `Subject: ${subject}\n\n${emailBody}`;
    copyToClipboard(fullEmail, "Full email");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-600" />
            {getDialogTitle()}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Sender Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Sender Information</CardTitle>
              <CardDescription>Customize the sender details for the email</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="senderName">Sender Name</Label>
                  <Input
                    id="senderName"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="partnerName">
                    {(emailTemplate === "interimReportInternal" || emailTemplate === "secondDisbursement") ? "Partner Name" : "Partner Name"}
                  </Label>
                  <Input
                    id="partnerName"
                    value={partnerName}
                    onChange={(e) => setPartnerName(e.target.value)}
                    placeholder="Enter partner organization name"
                  />
                </div>
                {(emailTemplate === "interimReportInternal" || emailTemplate === "secondDisbursement") && (
                  <div>
                    <Label htmlFor="officerName">Donor Engagement Officer Name</Label>
                    <Input
                      id="officerName"
                      value={officerName}
                      onChange={(e) => setOfficerName(e.target.value)}
                      placeholder="Enter officer name"
                    />
                  </div>
                )}
                <div>
                  <Label htmlFor="senderPosition">Position</Label>
                  <Input
                    id="senderPosition"
                    value={senderPosition}
                    onChange={(e) => setSenderPosition(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="senderOrganization">Organization</Label>
                  <Input
                    id="senderOrganization"
                    value={senderOrganization}
                    onChange={(e) => setSenderOrganization(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Project Details Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Project Details</CardTitle>
              <CardDescription>Information automatically filled from database</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><strong>Project:</strong> {project.projectName}</div>
                <div><strong>Governance Type:</strong> {project.governanceType || "GOVERNANCE DOCUMENT"}</div>
                <div><strong>Governance Number:</strong> {project.governanceNumber || "PENDING"}</div>
                <div><strong>Country:</strong> {project.country || "Multiple locations"}</div>
                <div><strong>Milestone:</strong> {milestone.title}</div>
                <div><strong>Due Date:</strong> {formatDateForDisplay(milestone.dueDate)}</div>
                {emailTemplate === "firstDisbursement" && milestone.disbursementAmount && (
                  <div><strong>Disbursement Amount:</strong> {project.currency} ${milestone.disbursementAmount.toLocaleString()}</div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Email Subject */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-medium">Email Subject</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(subject, "Subject")}
                className="text-xs"
              >
                <Copy className="w-3 h-3 mr-1" />
                Copy
              </Button>
            </div>
            <div className="p-3 bg-gray-50 border rounded-md">
              <p className="text-sm font-medium">{subject}</p>
            </div>
          </div>

          {/* Email Body */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-medium">Email Body</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(emailBody, "Email body")}
                className="text-xs"
              >
                <Copy className="w-3 h-3 mr-1" />
                Copy
              </Button>
            </div>
            <Textarea
              value={emailBody}
              readOnly
              className="min-h-[300px] text-sm font-mono"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button
              variant="outline"
              onClick={copyFullEmail}
              className="flex items-center gap-2"
            >
              <Copy className="w-4 h-4" />
              Copy Full Email
            </Button>
            <Button
              onClick={() => {
                const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;
                window.open(mailtoLink);
              }}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <Send className="w-4 h-4" />
              Open in Email Client
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};