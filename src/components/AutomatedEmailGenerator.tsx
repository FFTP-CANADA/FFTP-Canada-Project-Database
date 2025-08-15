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

  const generateEmailContent = () => {
    const governanceType = project.governanceType || "GOVERNANCE DOCUMENT";
    const governanceNumber = project.governanceNumber || "PENDING";
    const projectCost = project.totalCost 
      ? `${project.currency} $${project.totalCost.toLocaleString()}` 
      : "To be confirmed";

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
  };

  const { subject, emailBody } = generateEmailContent();

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
            Governance Document Reminder Email
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
                  <Label htmlFor="partnerName">Partner Name</Label>
                  <Input
                    id="partnerName"
                    value={partnerName}
                    onChange={(e) => setPartnerName(e.target.value)}
                    placeholder="Enter partner organization name"
                  />
                </div>
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