import { useState, useEffect } from "react";

export interface DonorReceipt {
  id: string;
  projectId: string;
  donorName: string;
  amount: number;
  dateReceived: string;
  paymentMethod: string;
  governanceType?: "MOU";
  governanceNumber?: string;
  notes?: string;
  // Reallocation tracking
  reallocationId?: string;
  reallocationSource?: "project" | "undesignated";
  sourceProjectId?: string;
  sourceUndesignatedFundId?: string;
}

export interface DonorPledge {
  id: string;
  projectId: string;
  donorName: string;
  pledgedAmount: number;
  datePledged: string;
  expectedDate?: string;
  status: "Pending" | "Partially Fulfilled" | "Fulfilled";
  governanceType?: "MOU";
  governanceNumber?: string;
  notes?: string;
  // Reallocation tracking
  reallocationId?: string;
  reallocationSource?: "project" | "undesignated";
  sourceProjectId?: string;
  sourceUndesignatedFundId?: string;
}

export const useProjectFunding = () => {
  const [donorReceipts, setDonorReceipts] = useState<DonorReceipt[]>(() => {
    const saved = localStorage.getItem('donorReceipts');
    return saved ? JSON.parse(saved) : [];
  });

  const [donorPledges, setDonorPledges] = useState<DonorPledge[]>(() => {
    const saved = localStorage.getItem('donorPledges');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('donorReceipts', JSON.stringify(donorReceipts));
  }, [donorReceipts]);

  useEffect(() => {
    localStorage.setItem('donorPledges', JSON.stringify(donorPledges));
  }, [donorPledges]);

  const getReceiptsForProject = (projectId: string) => {
    return donorReceipts.filter(receipt => receipt.projectId === projectId);
  };

  const getPledgesForProject = (projectId: string) => {
    return donorPledges.filter(pledge => pledge.projectId === projectId);
  };

  const addReceipt = async (receipt: Omit<DonorReceipt, "id">) => {
    const newReceipt: DonorReceipt = {
      ...receipt,
      id: Date.now().toString(),
    };
    setDonorReceipts(prev => [...prev, newReceipt]);
    return newReceipt.id;
  };

  const updateReceipt = (id: string, updates: Partial<DonorReceipt>) => {
    setDonorReceipts(prev => prev.map(receipt => 
      receipt.id === id ? { ...receipt, ...updates } : receipt
    ));
  };

  const deleteReceipt = async (id: string) => {
    const receipt = donorReceipts.find(r => r.id === id);
    if (receipt?.reallocationId) {
      await reverseReallocation(receipt);
      // Also delete corresponding pledge with same reallocation ID
      setDonorPledges(prev => prev.filter(pledge => pledge.reallocationId !== receipt.reallocationId));
    }
    setDonorReceipts(prev => prev.filter(receipt => receipt.id !== id));
  };

  const addPledge = async (pledge: Omit<DonorPledge, "id">) => {
    const newPledge: DonorPledge = {
      ...pledge,
      id: Date.now().toString(),
    };
    setDonorPledges(prev => [...prev, newPledge]);
    return newPledge.id;
  };

  const updatePledge = (id: string, updates: Partial<DonorPledge>) => {
    setDonorPledges(prev => prev.map(pledge => 
      pledge.id === id ? { ...pledge, ...updates } : pledge
    ));
  };

  const deletePledge = async (id: string) => {
    const pledge = donorPledges.find(p => p.id === id);
    if (pledge?.reallocationId) {
      await reverseReallocation(pledge);
      // Also delete corresponding receipt with same reallocation ID
      setDonorReceipts(prev => prev.filter(receipt => receipt.reallocationId !== pledge.reallocationId));
    }
    setDonorPledges(prev => prev.filter(pledge => pledge.id !== id));
  };

  const reverseReallocation = async (item: DonorReceipt | DonorPledge) => {
    if (item.reallocationSource === "project" && item.sourceProjectId && item.reallocationId) {
      // Reverse project-to-project reallocation by marking it as cancelled
      const reallocations = JSON.parse(localStorage.getItem('fund-reallocations') || '[]');
      const reallocationIndex = reallocations.findIndex((r: any) => r.id === item.reallocationId);
      if (reallocationIndex !== -1) {
        reallocations[reallocationIndex].status = "Cancelled";
        localStorage.setItem('fund-reallocations', JSON.stringify(reallocations));
      }
    } else if (item.reallocationSource === "undesignated" && item.sourceUndesignatedFundId) {
      // Return funds to undesignated fund balance
      const amount = "amount" in item ? item.amount : item.pledgedAmount;
      
      // Update undesignated fund balance directly by adding the amount back
      const currentFunds = JSON.parse(localStorage.getItem('undesignated-funds') || '[]');
      const fundIndex = currentFunds.findIndex((f: any) => f.id === item.sourceUndesignatedFundId);
      if (fundIndex !== -1) {
        currentFunds[fundIndex].balance += amount;
        currentFunds[fundIndex].lastUpdated = new Date().toISOString();
        localStorage.setItem('undesignated-funds', JSON.stringify(currentFunds));
      }
      
      // Mark the fund reallocation as cancelled
      const fundReallocations = JSON.parse(localStorage.getItem('fund-reallocations-to-pledge') || '[]');
      const reallocationIndex = fundReallocations.findIndex((r: any) => r.id === item.reallocationId);
      if (reallocationIndex !== -1) {
        fundReallocations[reallocationIndex].status = "Cancelled";
        localStorage.setItem('fund-reallocations-to-pledge', JSON.stringify(fundReallocations));
      }
      
      // Trigger a storage event to force all components to refresh
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'undesignated-funds',
        newValue: localStorage.getItem('undesignated-funds'),
        storageArea: localStorage
      }));
    }
  };

  return {
    donorReceipts,
    donorPledges,
    getReceiptsForProject,
    getPledgesForProject,
    addReceipt,
    updateReceipt,
    deleteReceipt,
    addPledge,
    updatePledge,
    deletePledge,
  };
};