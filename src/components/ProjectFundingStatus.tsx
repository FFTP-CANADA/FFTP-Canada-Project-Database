import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Banknote, Plus, AlertTriangle, CheckCircle, Clock, Edit, Trash2, Save, X } from "lucide-react";
import { Project, ProjectMilestone } from "@/types/project";
import { formatWithExchange } from "@/utils/currencyUtils";
import { useState, useEffect } from "react";
import { useProjectFunding, DonorReceipt, DonorPledge } from "@/hooks/useProjectFunding";

interface ProjectFundingStatusProps {
  project: Project;
  milestones: ProjectMilestone[];
  onUpdateProject?: (id: string, updates: Partial<Project>) => void;
}

const ProjectFundingStatus = ({ project, milestones, onUpdateProject }: ProjectFundingStatusProps) => {
  const fundingHook = useProjectFunding();
  const projectReceipts = fundingHook.getReceiptsForProject(project.id);
  const projectPledges = fundingHook.getPledgesForProject(project.id);

  const [isAddingReceipt, setIsAddingReceipt] = useState(false);
  const [editingReceiptId, setEditingReceiptId] = useState<string | null>(null);
  const [receiptForm, setReceiptForm] = useState({
    donorName: "",
    amount: "",
    dateReceived: "",
    paymentMethod: "",
    notes: ""
  });

  // Pledge management state
  const [isAddingPledge, setIsAddingPledge] = useState(false);
  const [editingPledgeId, setEditingPledgeId] = useState<string | null>(null);
  const [pledgeForm, setPledgeForm] = useState<{
    donorName: string;
    pledgedAmount: string;
    datePledged: string;
    expectedDate: string;
    status: "Pending" | "Partially Fulfilled" | "Fulfilled";
    notes: string;
  }>({
    donorName: "",
    pledgedAmount: "",
    datePledged: "",
    expectedDate: "",
    status: "Pending",
    notes: ""
  });

  // Calculate total scheduled disbursements
  const totalScheduledDisbursements = milestones
    .filter(m => m.disbursementAmount)
    .reduce((sum, m) => sum + (m.disbursementAmount || 0), 0);

  // Calculate total received from all donor receipts
  const totalReceivedFromDonors = projectReceipts.reduce((sum, receipt) => sum + receipt.amount, 0);
  
  // Calculate total pledged from all donor pledges
  const totalPledgedFromDonors = projectPledges.reduce((sum, pledge) => sum + pledge.pledgedAmount, 0);
  
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

  // Auto-update project status to "Completed" when funding reaches 100%
  useEffect(() => {
    if (fundingPercentage >= 100 && project.status !== "Completed" && onUpdateProject) {
      onUpdateProject(project.id, { status: "Completed" });
    }
  }, [fundingPercentage, project.status, project.id, onUpdateProject]);

  const resetForm = () => {
    setReceiptForm({
      donorName: "",
      amount: "",
      dateReceived: "",
      paymentMethod: "",
      notes: ""
    });
    setEditingReceiptId(null);
  };

  const handleAddReceipt = () => {
    if (!receiptForm.donorName || !receiptForm.amount || !receiptForm.dateReceived) return;
    
    // Convert date to ISO string and split to get just the date part (fixes timezone issues)
    const dateReceived = new Date(receiptForm.dateReceived + 'T00:00:00').toISOString().split('T')[0];
    
    fundingHook.addReceipt({
      projectId: project.id,
      donorName: receiptForm.donorName,
      amount: parseFloat(receiptForm.amount),
      dateReceived: dateReceived,
      paymentMethod: receiptForm.paymentMethod,
      notes: receiptForm.notes
    });
    
    resetForm();
    setIsAddingReceipt(false);
  };

  const handleEditReceipt = (receipt: DonorReceipt) => {
    setReceiptForm({
      donorName: receipt.donorName,
      amount: receipt.amount.toString(),
      dateReceived: receipt.dateReceived,
      paymentMethod: receipt.paymentMethod,
      notes: receipt.notes || ""
    });
    setEditingReceiptId(receipt.id);
    setIsAddingReceipt(true);
  };

  const handleUpdateReceipt = () => {
    if (!receiptForm.donorName || !receiptForm.amount || !receiptForm.dateReceived || !editingReceiptId) return;
    
    // Convert date to ISO string and split to get just the date part (fixes timezone issues)
    const dateReceived = new Date(receiptForm.dateReceived + 'T00:00:00').toISOString().split('T')[0];
    
    fundingHook.updateReceipt(editingReceiptId, {
      donorName: receiptForm.donorName,
      amount: parseFloat(receiptForm.amount),
      dateReceived: dateReceived,
      paymentMethod: receiptForm.paymentMethod,
      notes: receiptForm.notes
    });
    
    resetForm();
    setIsAddingReceipt(false);
  };

  const handleDeleteReceipt = (receiptId: string) => {
    fundingHook.deleteReceipt(receiptId);
  };

  // Pledge management functions
  const resetPledgeForm = () => {
    setPledgeForm({
      donorName: "",
      pledgedAmount: "",
      datePledged: "",
      expectedDate: "",
      status: "Pending",
      notes: ""
    });
    setEditingPledgeId(null);
  };

  const handleAddPledge = () => {
    if (!pledgeForm.donorName || !pledgeForm.pledgedAmount || !pledgeForm.datePledged) return;
    
    // Convert dates to ISO string and split to get just the date part (fixes timezone issues)
    const datePledged = new Date(pledgeForm.datePledged + 'T00:00:00').toISOString().split('T')[0];
    const expectedDate = pledgeForm.expectedDate ? new Date(pledgeForm.expectedDate + 'T00:00:00').toISOString().split('T')[0] : '';
    
    fundingHook.addPledge({
      projectId: project.id,
      donorName: pledgeForm.donorName,
      pledgedAmount: parseFloat(pledgeForm.pledgedAmount),
      datePledged: datePledged,
      expectedDate: expectedDate,
      status: pledgeForm.status,
      notes: pledgeForm.notes
    });
    
    resetPledgeForm();
    setIsAddingPledge(false);
  };

  const handleEditPledge = (pledge: DonorPledge) => {
    setPledgeForm({
      donorName: pledge.donorName,
      pledgedAmount: pledge.pledgedAmount.toString(),
      datePledged: pledge.datePledged,
      expectedDate: pledge.expectedDate || "",
      status: pledge.status,
      notes: pledge.notes || ""
    });
    setEditingPledgeId(pledge.id);
    setIsAddingPledge(true);
  };

  const handleUpdatePledge = () => {
    if (!pledgeForm.donorName || !pledgeForm.pledgedAmount || !pledgeForm.datePledged || !editingPledgeId) return;
    
    // Convert dates to ISO string and split to get just the date part (fixes timezone issues)
    const datePledged = new Date(pledgeForm.datePledged + 'T00:00:00').toISOString().split('T')[0];
    const expectedDate = pledgeForm.expectedDate ? new Date(pledgeForm.expectedDate + 'T00:00:00').toISOString().split('T')[0] : '';
    
    fundingHook.updatePledge(editingPledgeId, {
      donorName: pledgeForm.donorName,
      pledgedAmount: parseFloat(pledgeForm.pledgedAmount),
      datePledged: datePledged,
      expectedDate: expectedDate,
      status: pledgeForm.status,
      notes: pledgeForm.notes
    });
    
    resetPledgeForm();
    setIsAddingPledge(false);
  };

  const handleDeletePledge = (pledgeId: string) => {
    fundingHook.deletePledge(pledgeId);
  };

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
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-gray-600">Total Pledged</p>
            <p className="text-lg font-bold text-blue-600">
              {formatWithExchange(totalPledgedFromDonors, project.currency)}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-gray-600">Received from Donors</p>
            <p className="text-lg font-bold text-green-600">
              {formatWithExchange(totalReceivedFromDonors, project.currency)}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-gray-600">Scheduled to Disburse</p>
            <p className="text-lg font-bold text-purple-600">
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

        {/* Donor Pledges Table */}
        <div className="mt-6">
          <h4 className="font-medium text-gray-800 mb-3">Donor Pledges</h4>
          {projectPledges.length > 0 ? (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-medium">Donor/Foundation</TableHead>
                    <TableHead className="font-medium">Pledged Amount</TableHead>
                    <TableHead className="font-medium">Date Pledged</TableHead>
                    <TableHead className="font-medium">Expected Date</TableHead>
                    <TableHead className="font-medium">Status</TableHead>
                    <TableHead className="font-medium">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projectPledges.map((pledge) => (
                    <TableRow key={pledge.id}>
                      <TableCell className="font-medium">{pledge.donorName}</TableCell>
                      <TableCell className="text-blue-600 font-medium">
                        {formatWithExchange(pledge.pledgedAmount, project.currency)}
                      </TableCell>
                      <TableCell>{new Date(pledge.datePledged + 'T00:00:00').toLocaleDateString()}</TableCell>
                      <TableCell>
                        {pledge.expectedDate ? new Date(pledge.expectedDate + 'T00:00:00').toLocaleDateString() : 'TBD'}
                      </TableCell>
                      <TableCell>
                        <Badge className={
                          pledge.status === "Fulfilled" ? "bg-green-500 text-white" :
                          pledge.status === "Partially Fulfilled" ? "bg-yellow-500 text-white" :
                          "bg-gray-500 text-white"
                        }>
                          {pledge.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditPledge(pledge)}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeletePledge(pledge.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No donor pledges recorded yet.</p>
          )}
        </div>

        {/* Add/Edit Pledge Button */}
        <Dialog open={isAddingPledge} onOpenChange={(open) => {
          setIsAddingPledge(open);
          if (!open) resetPledgeForm();
        }}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="w-full mt-4">
              <Plus className="w-4 h-4 mr-2" />
              Add Donor Pledge
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingPledgeId ? "Edit Donor Pledge" : "Add Donor Pledge"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Donor/Foundation Name</Label>
                <Input
                  placeholder="e.g. International Education Trust"
                  value={pledgeForm.donorName}
                  onChange={(e) => setPledgeForm(prev => ({ ...prev, donorName: e.target.value }))}
                />
              </div>
              <div>
                <Label>Pledged Amount</Label>
                <Input
                  type="number"
                  placeholder="15000"
                  value={pledgeForm.pledgedAmount}
                  onChange={(e) => setPledgeForm(prev => ({ ...prev, pledgedAmount: e.target.value }))}
                />
              </div>
              <div>
                <Label>Date Pledged</Label>
                <Input
                  type="date"
                  value={pledgeForm.datePledged}
                  onChange={(e) => setPledgeForm(prev => ({ ...prev, datePledged: e.target.value }))}
                />
              </div>
              <div>
                <Label>Expected Date (Optional)</Label>
                <Input
                  type="date"
                  value={pledgeForm.expectedDate}
                  onChange={(e) => setPledgeForm(prev => ({ ...prev, expectedDate: e.target.value }))}
                />
              </div>
              <div>
                <Label>Status</Label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={pledgeForm.status}
                  onChange={(e) => setPledgeForm(prev => ({ ...prev, status: e.target.value as any }))}
                >
                  <option value="Pending">Pending</option>
                  <option value="Partially Fulfilled">Partially Fulfilled</option>
                  <option value="Fulfilled">Fulfilled</option>
                </select>
              </div>
              <div>
                <Label>Notes (Optional)</Label>
                <Input
                  placeholder="Additional notes about this pledge"
                  value={pledgeForm.notes}
                  onChange={(e) => setPledgeForm(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={editingPledgeId ? handleUpdatePledge : handleAddPledge}
                  className="flex-1"
                  disabled={!pledgeForm.donorName || !pledgeForm.pledgedAmount || !pledgeForm.datePledged}
                >
                  {editingPledgeId ? (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Update Pledge
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Save Pledge
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsAddingPledge(false);
                    resetPledgeForm();
                  }}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Donor Receipts Table */}
        <div className="mt-6">
          <h4 className="font-medium text-gray-800 mb-3">Donor Fund Receipts</h4>
          {projectReceipts.length > 0 ? (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-medium">Donor/Foundation</TableHead>
                    <TableHead className="font-medium">Amount</TableHead>
                    <TableHead className="font-medium">Date Received</TableHead>
                    <TableHead className="font-medium">Method</TableHead>
                    <TableHead className="font-medium">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projectReceipts.map((receipt) => (
                    <TableRow key={receipt.id}>
                      <TableCell className="font-medium">{receipt.donorName}</TableCell>
                      <TableCell className="text-green-600 font-medium">
                        {formatWithExchange(receipt.amount, project.currency)}
                      </TableCell>
                      <TableCell>{new Date(receipt.dateReceived + 'T00:00:00').toLocaleDateString()}</TableCell>
                      <TableCell>{receipt.paymentMethod}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditReceipt(receipt)}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteReceipt(receipt.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No donor receipts recorded yet.</p>
          )}
        </div>

        {/* Add/Edit Receipt Button */}
        <Dialog open={isAddingReceipt} onOpenChange={(open) => {
          setIsAddingReceipt(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="w-full mt-4">
              <Plus className="w-4 h-4 mr-2" />
              Add Donor Receipt
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingReceiptId ? "Edit Donor Fund Receipt" : "Add Donor Fund Receipt"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Donor/Foundation Name</Label>
                <Input
                  placeholder="e.g. Global Education Foundation"
                  value={receiptForm.donorName}
                  onChange={(e) => setReceiptForm(prev => ({ ...prev, donorName: e.target.value }))}
                />
              </div>
              <div>
                <Label>Amount Received</Label>
                <Input
                  type="number"
                  placeholder="5000"
                  value={receiptForm.amount}
                  onChange={(e) => setReceiptForm(prev => ({ ...prev, amount: e.target.value }))}
                />
              </div>
              <div>
                <Label>Date Received</Label>
                <Input
                  type="date"
                  value={receiptForm.dateReceived}
                  onChange={(e) => setReceiptForm(prev => ({ ...prev, dateReceived: e.target.value }))}
                />
              </div>
              <div>
                <Label>Payment Method</Label>
                <Input
                  placeholder="e.g. Check, Wire Transfer, Email Confirmation"
                  value={receiptForm.paymentMethod}
                  onChange={(e) => setReceiptForm(prev => ({ ...prev, paymentMethod: e.target.value }))}
                />
              </div>
              <div>
                <Label>Notes (Optional)</Label>
                <Input
                  placeholder="Additional notes about this receipt"
                  value={receiptForm.notes}
                  onChange={(e) => setReceiptForm(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={editingReceiptId ? handleUpdateReceipt : handleAddReceipt}
                  className="flex-1"
                  disabled={!receiptForm.donorName || !receiptForm.amount || !receiptForm.dateReceived}
                >
                  {editingReceiptId ? (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Update Receipt
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Save Receipt
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsAddingReceipt(false);
                    resetForm();
                  }}
                >
                  <X className="w-4 h-4 mr-2" />
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