import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Clock, AlertTriangle, Copy, CheckCircle, X } from "lucide-react";
import { FollowUpEmail } from "@/hooks/useAutoFollowUp";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();

  const handleViewEmail = (email: FollowUpEmail) => {
    setSelectedEmail(email);
    setEditedEmailContent(email.draftEmail);
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(editedEmailContent);
    toast({
      title: "Email Template Copied",
      description: "The draft email template has been copied to your clipboard.",
    });
  };

  const handleMarkSent = () => {
    if (selectedEmail) {
      onMarkSent(selectedEmail.id);
      setSelectedEmail(null);
      toast({
        title: "Follow-up Template Used",
        description: `Draft email template for ${selectedEmail.projectName} has been marked as used.`,
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Draft Email Templates ({followUpEmails.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {followUpEmails.length === 0 ? (
          <div className="text-center py-8">
            <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">
              No draft email templates generated. Email templates are created for projects marked as needing follow-up when:
            </p>
            <ul className="text-sm text-gray-400 list-disc list-inside space-y-1">
              <li>Milestones are due within 10 days</li>
              <li>New notes are added to projects</li>
            </ul>
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
                        <Badge className={email.trigger === "note" ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"}>
                          {email.trigger === "note" ? "Note Update" : "Milestone Due"}
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
                      {email.trigger === "note" && email.noteContent && (
                        <p className="text-sm text-blue-600 mb-1 italic">
                          Triggered by note: "{email.noteContent.length > 50 ? email.noteContent.substring(0, 50) + "..." : email.noteContent}"
                        </p>
                      )}
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
                            View & Copy Template
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>
                              Draft Email Template: {email.projectName} - {email.milestoneTitle}
                            </DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                              <p><strong>To:</strong> joannt@foodforthepoor.ca</p>
                              <p><strong>Due Date:</strong> {new Date(email.milestoneDueDate).toLocaleDateString()}</p>
                              <p><strong>Trigger:</strong> {email.trigger === "note" ? "New project note" : "Upcoming milestone"}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-2">
                                Email Template Content (editable):
                              </label>
                              <Textarea
                                value={editedEmailContent}
                                onChange={(e) => setEditedEmailContent(e.target.value)}
                                rows={20}
                                className="font-mono text-sm"
                              />
                            </div>
                            <div className="flex justify-between gap-2">
                              <Button onClick={handleCopyEmail} variant="outline" size="lg">
                                <Copy className="h-4 w-4 mr-2" />
                                Copy Template to Clipboard
                              </Button>
                              <Button 
                                onClick={handleMarkSent}
                                className="bg-green-600 hover:bg-green-700"
                                size="lg"
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Mark Template as Used
                              </Button>
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
  );
};

export default AutoFollowUpManager;
