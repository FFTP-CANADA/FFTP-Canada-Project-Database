import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Clock, AlertTriangle, Copy, Send, X, Settings } from "lucide-react";
import { FollowUpEmail } from "@/hooks/useAutoFollowUp";
import { useToast } from "@/hooks/use-toast";
import emailjs from '@emailjs/browser';

interface AutoFollowUpManagerProps {
  followUpEmails: FollowUpEmail[];
  onMarkSent: (followUpId: string) => void;
  onDismiss: (followUpId: string) => void;
}

const AutoFollowUpManager = ({
  followUpEmails,
  onMarkSent,
  onDismiss
}: AutoFollowUpManagerProps) => {
  const [selectedEmail, setSelectedEmail] = useState<FollowUpEmail | null>(null);
  const [editedEmailContent, setEditedEmailContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailConfig, setShowEmailConfig] = useState(false);
  const [emailConfig, setEmailConfig] = useState({
    serviceId: localStorage.getItem('emailjs_service_id') || '',
    templateId: localStorage.getItem('emailjs_template_id') || '',
    publicKey: localStorage.getItem('emailjs_public_key') || ''
  });
  const { toast } = useToast();

  const handleViewEmail = (email: FollowUpEmail) => {
    setSelectedEmail(email);
    setEditedEmailContent(email.draftEmail);
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(editedEmailContent);
    toast({
      title: "Email Copied",
      description: "The email content has been copied to your clipboard.",
    });
  };

  const handleMarkSent = () => {
    if (selectedEmail) {
      onMarkSent(selectedEmail.id);
      setSelectedEmail(null);
      toast({
        title: "Follow-up Marked as Sent",
        description: `Follow-up for ${selectedEmail.projectName} has been marked as sent.`,
      });
    }
  };

  const getPriorityColor = (priority: "High" | "Medium" | "Low") => {
    switch (priority) {
      case "High":
        return "bg-red-100 text-red-800";
      case "Medium":
        return "bg-yellow-100 text-yellow-800";
      case "Low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleSaveEmailConfig = () => {
    localStorage.setItem('emailjs_service_id', emailConfig.serviceId);
    localStorage.setItem('emailjs_template_id', emailConfig.templateId);
    localStorage.setItem('emailjs_public_key', emailConfig.publicKey);
    setShowEmailConfig(false);
    toast({
      title: "Email Configuration Saved",
      description: "EmailJS settings have been saved to localStorage.",
    });
  };

  const handleSendEmail = async () => {
    if (!selectedEmail) return;

    if (!emailConfig.serviceId || !emailConfig.templateId || !emailConfig.publicKey) {
      toast({
        title: "Email Configuration Required",
        description: "Please configure EmailJS settings first.",
        variant: "destructive",
      });
      setShowEmailConfig(true);
      return;
    }

    setIsLoading(true);

    try {
      // Extract subject from email content
      const subjectMatch = editedEmailContent.match(/Subject: (.*?)$/m);
      const subject = subjectMatch ? subjectMatch[1] : `Follow-up: ${selectedEmail.projectName}`;
      
      // Remove subject line from email body
      const emailBody = editedEmailContent.replace(/Subject: .*?\n\n/, '');

      const templateParams = {
        to_email: 'joannt@foodforthepoor.ca',
        to_name: 'Joan Tulloch',
        subject: subject,
        message: emailBody,
        from_name: 'Food For The Poor Canada Project Tracker',
        project_name: selectedEmail.projectName,
        milestone_title: selectedEmail.milestoneTitle
      };

      await emailjs.send(
        emailConfig.serviceId,
        emailConfig.templateId,
        templateParams,
        emailConfig.publicKey
      );

      onMarkSent(selectedEmail.id);
      setSelectedEmail(null);
      
      toast({
        title: "Email Sent Successfully",
        description: `Follow-up email for ${selectedEmail.projectName} has been sent to joannt@foodforthepoor.ca`,
      });
    } catch (error) {
      console.error('EmailJS Error:', error);
      toast({
        title: "Failed to Send Email",
        description: "There was an error sending the email. Please check your EmailJS configuration.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Automatic Follow-ups ({followUpEmails.length})
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEmailConfig(true)}
              className="bg-blue-50 hover:bg-blue-100 border-blue-200"
            >
              <Settings className="h-4 w-4 mr-2" />
              Email Config
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {followUpEmails.length === 0 ? (
            <div className="text-center py-8">
              <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">
                No automatic follow-ups generated. Follow-ups are created 10 days before milestones for projects marked as needing follow-up.
              </p>
              <p className="text-sm text-gray-400">
                Configure your email settings above to enable automatic email sending when follow-ups are generated.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {followUpEmails.map((email) => {
                const daysUntilDue = getDaysUntilDue(email.milestoneDueDate);
                return (
                  <div key={email.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold">{email.projectName}</h4>
                          <Badge className={getPriorityColor(email.priority)}>
                            {email.priority}
                          </Badge>
                          {daysUntilDue <= 3 && (
                            <Badge className="bg-red-100 text-red-800">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Urgent
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          Milestone: {email.milestoneTitle}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            Due: {new Date(email.milestoneDueDate).toLocaleDateString()}
                          </span>
                          <span>
                            Generated: {new Date(email.generated).toLocaleDateString()}
                          </span>
                          <span className={daysUntilDue <= 5 ? "text-red-600 font-medium" : ""}>
                            {daysUntilDue} days until due
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleViewEmail(email)}
                            >
                              <Mail className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>
                                Follow-up Email: {email.projectName} - {email.milestoneTitle}
                              </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="text-sm text-gray-600">
                                <p><strong>To:</strong> joannt@foodforthepoor.ca</p>
                                <p><strong>Due Date:</strong> {new Date(email.milestoneDueDate).toLocaleDateString()}</p>
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-2">
                                  Email Content (editable):
                                </label>
                                <Textarea
                                  value={editedEmailContent}
                                  onChange={(e) => setEditedEmailContent(e.target.value)}
                                  rows={20}
                                  className="font-mono text-sm"
                                />
                              </div>
                              <div className="flex justify-between gap-2">
                                <div className="flex gap-2">
                                  <Button onClick={handleCopyEmail} variant="outline">
                                    <Copy className="h-4 w-4 mr-2" />
                                    Copy to Clipboard
                                  </Button>
                                </div>
                                <div className="flex gap-2">
                                  <Button 
                                    onClick={handleSendEmail}
                                    disabled={isLoading}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    <Send className="h-4 w-4 mr-2" />
                                    {isLoading ? "Sending..." : "Send Email"}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onDismiss(email.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Email Configuration Dialog */}
      <Dialog open={showEmailConfig} onOpenChange={setShowEmailConfig}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>EmailJS Configuration</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Configure your EmailJS settings to enable automatic email sending. 
              Get these values from your EmailJS dashboard.
            </p>
            <div className="space-y-3">
              <div>
                <Label htmlFor="serviceId">Service ID</Label>
                <Input
                  id="serviceId"
                  value={emailConfig.serviceId}
                  onChange={(e) => setEmailConfig(prev => ({ ...prev, serviceId: e.target.value }))}
                  placeholder="your_service_id"
                />
              </div>
              <div>
                <Label htmlFor="templateId">Template ID</Label>
                <Input
                  id="templateId"
                  value={emailConfig.templateId}
                  onChange={(e) => setEmailConfig(prev => ({ ...prev, templateId: e.target.value }))}
                  placeholder="your_template_id"
                />
              </div>
              <div>
                <Label htmlFor="publicKey">Public Key</Label>
                <Input
                  id="publicKey"
                  value={emailConfig.publicKey}
                  onChange={(e) => setEmailConfig(prev => ({ ...prev, publicKey: e.target.value }))}
                  placeholder="your_public_key"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowEmailConfig(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveEmailConfig}>
                Save Configuration
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AutoFollowUpManager;
