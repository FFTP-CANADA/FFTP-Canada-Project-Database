import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2, ArrowRight } from "lucide-react";
import { useUndesignatedFunds } from "@/hooks/useUndesignatedFunds";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/utils/currencyUtils";
import { getCurrentESTTimestamp, formatTimestampForDisplay } from "@/utils/dateUtils";
import { UndesignatedFund } from "@/types/undesignatedFunds";
import { Project } from "@/types/project";
import { useProjectFunding } from "@/hooks/useProjectFunding";

interface UndesignatedFundsManagerProps {
  projects: Project[];
}

const IMPACT_AREAS = [
  "Food Security",
  "Education", 
  "Housing & Community",
  "Health",
  "Economic Empowerment",
  "Greatest Needs"
] as const;

const UndesignatedFundsManager = ({ projects }: UndesignatedFundsManagerProps) => {
  const { 
    undesignatedFunds, 
    addOrUpdateUndesignatedFund, 
    updateUndesignatedFund, 
    deleteUndesignatedFund,
    addFundReallocation,
    getAvailableBalance
  } = useUndesignatedFunds();
  const { addPledge, addReceipt } = useProjectFunding();
  const { toast } = useToast();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isReallocationDialogOpen, setIsReallocationDialogOpen] = useState(false);
  const [editingFund, setEditingFund] = useState<UndesignatedFund | null>(null);
  const [selectedFund, setSelectedFund] = useState<UndesignatedFund | null>(null);

  const [formData, setFormData] = useState({
    impactArea: "" as any,
    balance: "",
    currency: "CAD" as "CAD" | "USD",
    notes: ""
  });

  const [reallocationData, setReallocationData] = useState({
    projectId: "",
    amount: "",
    reason: "",
    approvedBy: ""
  });

  const resetForm = () => {
    setFormData({
      impactArea: "" as any,
      balance: "",
      currency: "CAD",
      notes: ""
    });
  };

  const resetReallocationForm = () => {
    setReallocationData({
      projectId: "",
      amount: "",
      reason: "",
      approvedBy: ""
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.impactArea || !formData.balance) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingFund) {
        await updateUndesignatedFund(editingFund.id, {
          impactArea: formData.impactArea,
          balance: parseFloat(formData.balance),
          currency: formData.currency,
          notes: formData.notes
        });
        toast({
          title: "Success",
          description: "Undesignated fund updated successfully.",
        });
        setIsEditDialogOpen(false);
        setEditingFund(null);
      } else {
        await addOrUpdateUndesignatedFund({
          impactArea: formData.impactArea,
          balance: parseFloat(formData.balance),
          currency: formData.currency,
          notes: formData.notes
        });
        toast({
          title: "Success",
          description: "Undesignated fund added successfully.",
        });
        setIsAddDialogOpen(false);
      }
      resetForm();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save undesignated fund.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (fund: UndesignatedFund) => {
    setEditingFund(fund);
    setFormData({
      impactArea: fund.impactArea,
      balance: fund.balance.toString(),
      currency: fund.currency,
      notes: fund.notes || ""
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (fundId: string) => {
    try {
      await deleteUndesignatedFund(fundId);
      toast({
        title: "Success",
        description: "Undesignated fund deleted successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete undesignated fund.",
        variant: "destructive",
      });
    }
  };

  const handleReallocation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFund || !reallocationData.projectId || !reallocationData.amount) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(reallocationData.amount);
    const availableBalance = getAvailableBalance(selectedFund.id);
    
    if (amount > availableBalance) {
      toast({
        title: "Error",
        description: `Insufficient funds. Available balance: ${formatCurrency(availableBalance, selectedFund.currency)}`,
        variant: "destructive",
      });
      return;
    }

    try {
      // Add fund reallocation
      const reallocationId = await addFundReallocation({
        fromUndesignatedFundId: selectedFund.id,
        toProjectId: reallocationData.projectId,
        amount: amount,
        currency: selectedFund.currency,
        reallocationDate: getCurrentESTTimestamp(),
        reason: reallocationData.reason,
        approvedBy: reallocationData.approvedBy,
        status: "Completed"
      });

      // Add as pledge to the project with reallocation tracking
      const selectedProject = projects.find(p => p.id === reallocationData.projectId);
      if (selectedProject) {
        await addPledge({
          projectId: reallocationData.projectId,
          donorName: `Undesignated Funds - ${selectedFund.impactArea}`,
          pledgedAmount: amount,
          datePledged: getCurrentESTTimestamp(),
          status: "Fulfilled",
          notes: `Reallocated from undesignated ${selectedFund.impactArea} funds. ${reallocationData.reason}`,
          reallocationId,
          reallocationSource: "undesignated",
          sourceUndesignatedFundId: selectedFund.id
        });

        // Also add a corresponding receipt
        addReceipt({
          projectId: reallocationData.projectId,
          donorName: `Undesignated Funds - ${selectedFund.impactArea}`,
          amount: amount,
          dateReceived: getCurrentESTTimestamp(),
          paymentMethod: "Fund Allocation",
          notes: `Reallocated from undesignated ${selectedFund.impactArea} funds. ${reallocationData.reason}`,
          reallocationId,
          reallocationSource: "undesignated",
          sourceUndesignatedFundId: selectedFund.id
        });
      }

      toast({
        title: "Success",
        description: "Funds reallocated successfully and added as project pledge.",
      });
      
      setIsReallocationDialogOpen(false);
      setSelectedFund(null);
      resetReallocationForm();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reallocate funds.",
        variant: "destructive",
      });
    }
  };

  const openReallocationDialog = (fund: UndesignatedFund) => {
    setSelectedFund(fund);
    setIsReallocationDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Undesignated Fund Balances</CardTitle>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="w-4 h-4 mr-2" />
                Add Fund Balance
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Undesignated Fund Balance</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="impactArea">Impact Area *</Label>
                  <Select value={formData.impactArea} onValueChange={(value: any) => setFormData({...formData, impactArea: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select impact area" />
                    </SelectTrigger>
                    <SelectContent>
                      {IMPACT_AREAS.map((area) => (
                        <SelectItem key={area} value={area}>{area}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="balance">Balance Amount *</Label>
                  <Input
                    id="balance"
                    type="number"
                    step="0.01"
                    value={formData.balance}
                    onChange={(e) => setFormData({...formData, balance: e.target.value})}
                    placeholder="Enter balance amount"
                  />
                </div>
                <div>
                  <Label htmlFor="currency">Currency *</Label>
                  <Select value={formData.currency} onValueChange={(value: "CAD" | "USD") => setFormData({...formData, currency: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CAD">CAD</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    placeholder="Additional notes..."
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Add Fund Balance</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Impact Area</TableHead>
              <TableHead>Currency</TableHead>
              <TableHead>Available Balance</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {undesignatedFunds.map((fund) => {
              const availableBalance = getAvailableBalance(fund.id);
              return (
                <TableRow key={fund.id}>
                  <TableCell>{fund.impactArea}</TableCell>
                  <TableCell>{fund.currency}</TableCell>
                  <TableCell>{formatCurrency(availableBalance, fund.currency)}</TableCell>
                  <TableCell>{formatTimestampForDisplay(fund.lastUpdated)}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(fund)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openReallocationDialog(fund)}
                        disabled={availableBalance <= 0}
                      >
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(fund.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Undesignated Fund Balance</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="impactArea">Impact Area *</Label>
                <Select value={formData.impactArea} onValueChange={(value: any) => setFormData({...formData, impactArea: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select impact area" />
                  </SelectTrigger>
                  <SelectContent>
                    {IMPACT_AREAS.map((area) => (
                      <SelectItem key={area} value={area}>{area}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="balance">Balance Amount *</Label>
                <Input
                  id="balance"
                  type="number"
                  step="0.01"
                  value={formData.balance}
                  onChange={(e) => setFormData({...formData, balance: e.target.value})}
                  placeholder="Enter balance amount"
                />
              </div>
              <div>
                <Label htmlFor="currency">Currency *</Label>
                <Select value={formData.currency} onValueChange={(value: "CAD" | "USD") => setFormData({...formData, currency: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CAD">CAD</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Additional notes..."
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Update Fund Balance</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Reallocation Dialog */}
        <Dialog open={isReallocationDialogOpen} onOpenChange={setIsReallocationDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reallocate Funds to Project</DialogTitle>
            </DialogHeader>
            {selectedFund && (
              <div className="mb-4 p-4 bg-muted rounded-lg">
                <h4 className="font-medium">From: {selectedFund.impactArea}</h4>
                <p className="text-sm text-muted-foreground">
                  Available: {formatCurrency(getAvailableBalance(selectedFund.id), selectedFund.currency)}
                </p>
              </div>
            )}
            <form onSubmit={handleReallocation} className="space-y-4">
              <div>
                <Label htmlFor="projectId">Target Project *</Label>
                <Select value={reallocationData.projectId} onValueChange={(value) => setReallocationData({...reallocationData, projectId: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.projectName} ({project.country})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="amount">Amount *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={reallocationData.amount}
                  onChange={(e) => setReallocationData({...reallocationData, amount: e.target.value})}
                  placeholder="Enter amount to reallocate"
                />
              </div>
              <div>
                <Label htmlFor="reason">Reason</Label>
                <Textarea
                  id="reason"
                  value={reallocationData.reason}
                  onChange={(e) => setReallocationData({...reallocationData, reason: e.target.value})}
                  placeholder="Reason for reallocation..."
                />
              </div>
              <div>
                <Label htmlFor="approvedBy">Approved By</Label>
                <Input
                  id="approvedBy"
                  value={reallocationData.approvedBy}
                  onChange={(e) => setReallocationData({...reallocationData, approvedBy: e.target.value})}
                  placeholder="Who approved this reallocation?"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsReallocationDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Reallocate Funds</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default UndesignatedFundsManager;