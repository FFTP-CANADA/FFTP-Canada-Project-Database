import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRight, DollarSign, Calendar } from "lucide-react";
import { Project } from "@/types/project";
import { FundReallocation } from "@/types/reallocation";
import { useReallocation } from "@/hooks/useReallocation";
import { useUndesignatedFunds } from "@/hooks/useUndesignatedFunds";
import { useProjectFunding } from "@/hooks/useProjectFunding";
import { formatWithExchange } from "@/utils/currencyUtils";
import { useToast } from "@/hooks/use-toast";

interface FundReallocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: Project[];
  currentProject?: Project;
}

export const FundReallocationDialog = ({
  open,
  onOpenChange,
  projects,
  currentProject
}: FundReallocationDialogProps) => {
  const { toast } = useToast();
  const { 
    addReallocation, 
    getReallocationsForProject, 
    getAvailableBalance,
    getReallocationSummary 
  } = useReallocation();
  
  const { undesignatedFunds, getAvailableBalance: getUndesignatedBalance, addFundReallocation } = useUndesignatedFunds();
  const { addPledge, addReceipt } = useProjectFunding();

  // Project-to-project reallocation state
  const [fromProjectId, setFromProjectId] = useState(currentProject?.id || "");
  const [toProjectId, setToProjectId] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [approvedBy, setApprovedBy] = useState("");

  // Undesignated-to-project reallocation state
  const [selectedFundId, setSelectedFundId] = useState("");
  const [undesignatedToProjectId, setUndesignatedToProjectId] = useState("");
  const [undesignatedAmount, setUndesignatedAmount] = useState("");
  const [undesignatedReason, setUndesignatedReason] = useState("");
  const [undesignatedApprovedBy, setUndesignatedApprovedBy] = useState("");

  const fromProject = projects.find(p => p.id === fromProjectId);
  const toProject = projects.find(p => p.id === toProjectId);
  const availableBalance = fromProject ? getAvailableBalance(fromProject) : 0;
  
  const selectedFund = undesignatedFunds.find(f => f.id === selectedFundId);
  const undesignatedToProject = projects.find(p => p.id === undesignatedToProjectId);
  const availableFundBalance = selectedFund ? getUndesignatedBalance(selectedFund.id) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fromProjectId || !toProjectId || !amount) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all required fields"
      });
      return;
    }

    if (fromProjectId === toProjectId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Cannot reallocate funds to the same project"
      });
      return;
    }

    const reallocationAmount = parseFloat(amount);
    if (reallocationAmount <= 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Amount must be greater than 0"
      });
      return;
    }

    if (reallocationAmount > availableBalance) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Insufficient funds. Available balance: ${formatWithExchange(availableBalance, fromProject!.currency)}`
      });
      return;
    }

    try {
      const reallocationDate = new Date().toISOString().split('T')[0];
      
      await addReallocation({
        fromProjectId,
        fromProjectName: fromProject!.projectName,
        toProjectId,
        toProjectName: toProject!.projectName,
        amount: reallocationAmount,
        currency: fromProject!.currency,
        reallocationDate,
        reason,
        approvedBy,
        status: "Completed"
      });

      // Create donor pledge entry for the receiving project
      await addPledge({
        projectId: toProjectId,
        donorName: `Reallocation from ${fromProject!.projectName}`,
        pledgedAmount: reallocationAmount,
        datePledged: reallocationDate,
        status: "Fulfilled"
      });

      // Create donor receipt entry for the receiving project
      await addReceipt({
        projectId: toProjectId,
        donorName: `Reallocation from ${fromProject!.projectName}`,
        amount: reallocationAmount,
        dateReceived: reallocationDate,
        paymentMethod: "Fund Reallocation"
      });

      toast({
        title: "Success",
        description: `Reallocated ${formatWithExchange(reallocationAmount, fromProject!.currency)} from ${fromProject!.projectName} to ${toProject!.projectName}`
      });

      // Reset form
      setFromProjectId(currentProject?.id || "");
      setToProjectId("");
      setAmount("");
      setReason("");
      setApprovedBy("");
      onOpenChange(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create reallocation"
      });
    }
  };

  const handleUndesignatedReallocation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFundId || !undesignatedToProjectId || !undesignatedAmount) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all required fields"
      });
      return;
    }

    const reallocationAmount = parseFloat(undesignatedAmount);
    if (reallocationAmount <= 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Amount must be greater than 0"
      });
      return;
    }

    if (reallocationAmount > availableFundBalance) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Insufficient funds. Available balance: ${formatWithExchange(availableFundBalance, selectedFund!.currency)}`
      });
      return;
    }

    try {
      const reallocationDate = new Date().toISOString().split('T')[0];
      
      // Create fund reallocation record
      await addFundReallocation({
        fromUndesignatedFundId: selectedFundId,
        toProjectId: undesignatedToProjectId,
        amount: reallocationAmount,
        currency: selectedFund!.currency,
        reallocationDate,
        reason: undesignatedReason,
        approvedBy: undesignatedApprovedBy,
        status: "Completed"
      });

      // Create pledge for the project
      await addPledge({
        projectId: undesignatedToProjectId,
        donorName: `${selectedFund!.impactArea} Fund Allocation`,
        pledgedAmount: reallocationAmount,
        datePledged: reallocationDate,
        status: "Fulfilled"
      });

      // Create receipt for the project
      await addReceipt({
        projectId: undesignatedToProjectId,
        donorName: `${selectedFund!.impactArea} Fund Allocation`,
        amount: reallocationAmount,
        dateReceived: reallocationDate,
        paymentMethod: "Fund Allocation"
      });

      toast({
        title: "Success",
        description: `Allocated ${formatWithExchange(reallocationAmount, selectedFund!.currency)} from ${selectedFund!.impactArea} fund to ${undesignatedToProject!.projectName}`
      });

      // Reset form
      setSelectedFundId("");
      setUndesignatedToProjectId("");
      setUndesignatedAmount("");
      setUndesignatedReason("");
      setUndesignatedApprovedBy("");
      onOpenChange(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create fund allocation"
      });
    }
  };

  const currentProjectReallocations = currentProject ? getReallocationsForProject(currentProject.id) : [];
  const reallocationSummary = currentProject ? getReallocationSummary(currentProject) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-blue-900">Fund Reallocation</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="project-to-project" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="project-to-project">Project to Project</TabsTrigger>
            <TabsTrigger value="undesignated-to-project">Undesignated to Project</TabsTrigger>
          </TabsList>

          <TabsContent value="project-to-project">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">{/* Project-to-project reallocation form */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-blue-800">Reallocate Between Projects</h3>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="fromProject">From Project *</Label>
                    <Select value={fromProjectId} onValueChange={setFromProjectId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select source project" />
                      </SelectTrigger>
                      <SelectContent className="bg-white z-50">
                        {projects.map(project => {
                          const balance = getAvailableBalance(project);
                          return (
                            <SelectItem key={project.id} value={project.id}>
                              <div className="flex justify-between items-center w-full">
                                <span>{project.projectName}</span>
                                <Badge variant="outline" className="ml-2">
                                  {formatWithExchange(balance, project.currency)}
                                </Badge>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    {fromProject && (
                      <p className="text-sm text-blue-600 mt-1">
                        Available: {formatWithExchange(availableBalance, fromProject.currency)}
                      </p>
                    )}
                  </div>

                  <div className="flex justify-center py-2">
                    <ArrowRight className="w-6 h-6 text-blue-500" />
                  </div>

                  <div>
                    <Label htmlFor="toProject">To Project *</Label>
                    <Select value={toProjectId} onValueChange={setToProjectId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select destination project" />
                      </SelectTrigger>
                      <SelectContent className="bg-white z-50">
                        {projects
                          .filter(project => project.id !== fromProjectId)
                          .map(project => (
                            <SelectItem key={project.id} value={project.id}>
                              {project.projectName}
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
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="reason">Reason</Label>
                    <Textarea
                      id="reason"
                      placeholder="Enter reason for reallocation..."
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="approvedBy">Approved By</Label>
                    <Input
                      id="approvedBy"
                      placeholder="Name of approving authority"
                      value={approvedBy}
                      onChange={(e) => setApprovedBy(e.target.value)}
                    />
                  </div>

                  <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                    Create Reallocation
                  </Button>
                </form>
              </div>

              {/* Current Project Summary & History */}
              <div className="space-y-4">
                {currentProject && reallocationSummary && (
                  <>
                    <h3 className="text-lg font-semibold text-blue-800">
                      {currentProject.projectName} - Reallocation Summary
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                        <div className="flex items-center gap-2 text-red-700">
                          <DollarSign className="w-4 h-4" />
                          <span className="text-sm font-medium">Allocated Out</span>
                        </div>
                        <div className="text-xl font-bold text-red-800">
                          {formatWithExchange(reallocationSummary.totalAllocatedOut, reallocationSummary.currency)}
                        </div>
                      </div>
                      
                      <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                        <div className="flex items-center gap-2 text-green-700">
                          <DollarSign className="w-4 h-4" />
                          <span className="text-sm font-medium">Allocated In</span>
                        </div>
                        <div className="text-xl font-bold text-green-800">
                          {formatWithExchange(reallocationSummary.totalAllocatedIn, reallocationSummary.currency)}
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2 text-blue-700">
                        <DollarSign className="w-4 h-4" />
                        <span className="text-sm font-medium">Net Reallocation</span>
                      </div>
                      <div className={`text-xl font-bold ${reallocationSummary.netReallocation >= 0 ? 'text-green-800' : 'text-red-800'}`}>
                        {reallocationSummary.netReallocation >= 0 ? '+' : ''}
                        {formatWithExchange(reallocationSummary.netReallocation, reallocationSummary.currency)}
                      </div>
                    </div>

                    <h4 className="text-md font-semibold text-blue-700 mt-6">Recent Reallocations</h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {currentProjectReallocations.length > 0 ? (
                        currentProjectReallocations.slice(-5).reverse().map(reallocation => (
                          <div key={reallocation.id} className="bg-white p-3 rounded border border-blue-200">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="text-sm">
                                  <span className="font-medium">
                                    {reallocation.fromProjectId === currentProject.id ? 'To: ' : 'From: '}
                                  </span>
                                  <span className="text-blue-700">
                                    {reallocation.fromProjectId === currentProject.id 
                                      ? reallocation.toProjectName 
                                      : reallocation.fromProjectName}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <Calendar className="w-3 h-3 text-gray-500" />
                                  <span className="text-xs text-gray-600">{reallocation.reallocationDate}</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className={`font-medium ${reallocation.fromProjectId === currentProject.id ? 'text-red-600' : 'text-green-600'}`}>
                                  {reallocation.fromProjectId === currentProject.id ? '-' : '+'}
                                  {formatWithExchange(reallocation.amount, reallocation.currency)}
                                </div>
                                <Badge variant="outline" className="text-xs">
                                  {reallocation.status}
                                </Badge>
                              </div>
                            </div>
                            {reallocation.reason && (
                              <p className="text-xs text-gray-600 mt-2">{reallocation.reason}</p>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500 text-center py-4">No reallocations found</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="undesignated-to-project">
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-blue-800">Allocate from Undesignated Funds</h3>
                
                <form onSubmit={handleUndesignatedReallocation} className="space-y-4">
                  <div>
                    <Label htmlFor="selectedFund">From Undesignated Fund *</Label>
                    <Select value={selectedFundId} onValueChange={setSelectedFundId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select undesignated fund" />
                      </SelectTrigger>
                      <SelectContent className="bg-white z-50">
                        {undesignatedFunds.map(fund => {
                          const balance = getUndesignatedBalance(fund.id);
                          return (
                            <SelectItem key={fund.id} value={fund.id}>
                              <div className="flex justify-between items-center w-full">
                                <span>{fund.impactArea} ({fund.currency})</span>
                                <Badge variant="outline" className="ml-2">
                                  {formatWithExchange(balance, fund.currency)}
                                </Badge>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    {selectedFund && (
                      <p className="text-sm text-blue-600 mt-1">
                        Available: {formatWithExchange(availableFundBalance, selectedFund.currency)}
                      </p>
                    )}
                  </div>

                  <div className="flex justify-center py-2">
                    <ArrowRight className="w-6 h-6 text-blue-500" />
                  </div>

                  <div>
                    <Label htmlFor="undesignatedToProject">To Project *</Label>
                    <Select value={undesignatedToProjectId} onValueChange={setUndesignatedToProjectId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select destination project" />
                      </SelectTrigger>
                      <SelectContent className="bg-white z-50">
                        {projects.map(project => (
                          <SelectItem key={project.id} value={project.id}>
                            <div className="flex flex-col">
                              <span>{project.projectName}</span>
                              <span className="text-xs text-gray-500">{project.impactArea}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="undesignatedAmount">Amount *</Label>
                    <Input
                      id="undesignatedAmount"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={undesignatedAmount}
                      onChange={(e) => setUndesignatedAmount(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="undesignatedReason">Reason</Label>
                    <Textarea
                      id="undesignatedReason"
                      placeholder="Enter reason for allocation..."
                      value={undesignatedReason}
                      onChange={(e) => setUndesignatedReason(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="undesignatedApprovedBy">Approved By</Label>
                    <Input
                      id="undesignatedApprovedBy"
                      placeholder="Name of approving authority"
                      value={undesignatedApprovedBy}
                      onChange={(e) => setUndesignatedApprovedBy(e.target.value)}
                    />
                  </div>

                  <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                    Allocate Funds & Create Pledge
                  </Button>
                </form>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};