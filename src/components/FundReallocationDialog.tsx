import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, DollarSign, Calendar } from "lucide-react";
import { Project } from "@/types/project";
import { FundReallocation } from "@/types/reallocation";
import { useReallocation } from "@/hooks/useReallocation";
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

  const [fromProjectId, setFromProjectId] = useState(currentProject?.id || "");
  const [toProjectId, setToProjectId] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [approvedBy, setApprovedBy] = useState("");

  const fromProject = projects.find(p => p.id === fromProjectId);
  const toProject = projects.find(p => p.id === toProjectId);
  const availableBalance = fromProject ? getAvailableBalance(fromProject) : 0;

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
      await addReallocation({
        fromProjectId,
        fromProjectName: fromProject!.projectName,
        toProjectId,
        toProjectName: toProject!.projectName,
        amount: reallocationAmount,
        currency: fromProject!.currency,
        reallocationDate: new Date().toISOString().split('T')[0],
        reason,
        approvedBy,
        status: "Completed"
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

  const currentProjectReallocations = currentProject ? getReallocationsForProject(currentProject.id) : [];
  const reallocationSummary = currentProject ? getReallocationSummary(currentProject) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-blue-900">Fund Reallocation</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Reallocation Form */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-blue-800">Create New Reallocation</h3>
            
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
      </DialogContent>
    </Dialog>
  );
};