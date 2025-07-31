import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Banknote, Plus, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { Project, ProjectMilestone } from "@/types/project";
import { formatWithExchange } from "@/utils/currencyUtils";
import { useState } from "react";

interface ProjectFundingStatusProps {
  project: Project;
  milestones: ProjectMilestone[];
}

const ProjectFundingStatus = ({ project, milestones }: ProjectFundingStatusProps) => {
  const [isAddingReceipt, setIsAddingReceipt] = useState(false);
  const [receiptAmount, setReceiptAmount] = useState("");
  const [receiptDate, setReceiptDate] = useState("");
  const [receiptMethod, setReceiptMethod] = useState("");

  // Calculate total scheduled disbursements
  const totalScheduledDisbursements = milestones
    .filter(m => m.disbursementAmount)
    .reduce((sum, m) => sum + (m.disbursementAmount || 0), 0);

  // Mock data - in real implementation this would come from Supabase
  const totalReceivedFromDonors = 12000; // Example: $12,000 received
  
  const fundingGap = totalScheduledDisbursements - totalReceivedFromDonors;
  const fundingPercentage = totalScheduledDisbursements > 0 
    ? Math.round((totalReceivedFromDonors / totalScheduledDisbursements) * 100)
    : 0;

  const getFundingStatus = () => {
    if (fundingPercentage >= 100) {
      return { label: "Fully Funded", color: "bg-green-500", icon: CheckCircle };
    } else if (fundingPercentage >= 50) {
      return { label: "Partially Funded", color: "bg-yellow-500", icon: Clock };
    } else {
      return { label: "Underfunded", color: "bg-red-500", icon: AlertTriangle };
    }
  };

  const fundingStatus = getFundingStatus();
  const StatusIcon = fundingStatus.icon;

  return (
    <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Banknote className="w-5 h-5 text-blue-600" />
          Funding Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Funding Overview */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-gray-600">Received from Donors</p>
            <p className="text-lg font-bold text-green-600">
              {formatWithExchange(totalReceivedFromDonors, project.currency)}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-gray-600">Scheduled to Disburse</p>
            <p className="text-lg font-bold text-blue-600">
              {formatWithExchange(totalScheduledDisbursements, project.currency)}
            </p>
          </div>
        </div>

        {/* Funding Status Badge */}
        <div className="flex items-center justify-between">
          <Badge 
            className={`${fundingStatus.color} text-white flex items-center gap-1 px-3 py-1`}
          >
            <StatusIcon className="w-3 h-3" />
            {fundingStatus.label} ({fundingPercentage}%)
          </Badge>
          
          {fundingGap > 0 && (
            <div className="text-right">
              <p className="text-xs text-gray-600">Funding Gap</p>
              <p className="text-sm font-bold text-red-600">
                {formatWithExchange(fundingGap, project.currency)}
              </p>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${fundingStatus.color}`}
            style={{ width: `${Math.min(fundingPercentage, 100)}%` }}
          />
        </div>

        {/* Add Receipt Button */}
        <Dialog open={isAddingReceipt} onOpenChange={setIsAddingReceipt}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Add Donor Receipt
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Donor Fund Receipt</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Amount Received</Label>
                <Input
                  type="number"
                  placeholder="5000"
                  value={receiptAmount}
                  onChange={(e) => setReceiptAmount(e.target.value)}
                />
              </div>
              <div>
                <Label>Receipt Date</Label>
                <Input
                  type="date"
                  value={receiptDate}
                  onChange={(e) => setReceiptDate(e.target.value)}
                />
              </div>
              <div>
                <Label>Payment Method</Label>
                <Input
                  placeholder="e.g. Check, Wire Transfer, Email Confirmation"
                  value={receiptMethod}
                  onChange={(e) => setReceiptMethod(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={() => {
                    // TODO: Save to Supabase when connected
                    console.log("Save receipt:", { receiptAmount, receiptDate, receiptMethod });
                    setIsAddingReceipt(false);
                    setReceiptAmount("");
                    setReceiptDate("");
                    setReceiptMethod("");
                  }}
                  className="flex-1"
                >
                  Save Receipt
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsAddingReceipt(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Quick Info */}
        <div className="text-xs text-gray-500 text-center">
          Connect to Supabase to save donor receipts and track funding history
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectFundingStatus;