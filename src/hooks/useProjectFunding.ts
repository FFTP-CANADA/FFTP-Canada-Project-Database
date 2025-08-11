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

  const addReceipt = (receipt: Omit<DonorReceipt, "id">) => {
    const newReceipt: DonorReceipt = {
      ...receipt,
      id: Date.now().toString(),
    };
    setDonorReceipts(prev => [...prev, newReceipt]);
  };

  const updateReceipt = (id: string, updates: Partial<DonorReceipt>) => {
    setDonorReceipts(prev => prev.map(receipt => 
      receipt.id === id ? { ...receipt, ...updates } : receipt
    ));
  };

  const deleteReceipt = (id: string) => {
    setDonorReceipts(prev => prev.filter(receipt => receipt.id !== id));
  };

  const addPledge = (pledge: Omit<DonorPledge, "id">) => {
    const newPledge: DonorPledge = {
      ...pledge,
      id: Date.now().toString(),
    };
    setDonorPledges(prev => [...prev, newPledge]);
  };

  const updatePledge = (id: string, updates: Partial<DonorPledge>) => {
    setDonorPledges(prev => prev.map(pledge => 
      pledge.id === id ? { ...pledge, ...updates } : pledge
    ));
  };

  const deletePledge = (id: string) => {
    setDonorPledges(prev => prev.filter(pledge => pledge.id !== id));
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