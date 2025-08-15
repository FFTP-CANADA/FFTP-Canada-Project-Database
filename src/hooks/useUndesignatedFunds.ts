import { useState, useEffect, useCallback } from "react";
import { UndesignatedFund, FundReallocationToPledge } from "@/types/undesignatedFunds";
import { LocalStorageManager } from "@/utils/localStorageManager";

export const useUndesignatedFunds = () => {
  const [undesignatedFunds, setUndesignatedFunds] = useState<UndesignatedFund[]>(() => {
    return LocalStorageManager.getItem('undesignated-funds', []);
  });

  const [fundReallocations, setFundReallocations] = useState<FundReallocationToPledge[]>(() => {
    return LocalStorageManager.getItem('fund-reallocations-to-pledge', []);
  });

  useEffect(() => {
    LocalStorageManager.setItem('undesignated-funds', undesignatedFunds);
  }, [undesignatedFunds]);

  useEffect(() => {
    LocalStorageManager.setItem('fund-reallocations-to-pledge', fundReallocations);
  }, [fundReallocations]);

  const addOrUpdateUndesignatedFund = useCallback(async (fundData: Omit<UndesignatedFund, "id" | "lastUpdated">) => {
    const existingFund = undesignatedFunds.find(f => 
      f.impactArea === fundData.impactArea && f.currency === fundData.currency
    );

    if (existingFund) {
      setUndesignatedFunds(prev => prev.map(f => 
        f.id === existingFund.id 
          ? { ...f, ...fundData, lastUpdated: new Date().toISOString() }
          : f
      ));
      return existingFund.id;
    } else {
      const newFund: UndesignatedFund = {
        ...fundData,
        id: Date.now().toString(),
        lastUpdated: new Date().toISOString(),
      };
      setUndesignatedFunds(prev => [...prev, newFund]);
      return newFund.id;
    }
  }, [undesignatedFunds]);

  const updateUndesignatedFund = useCallback(async (id: string, updates: Partial<UndesignatedFund>) => {
    setUndesignatedFunds(prev => prev.map(f => 
      f.id === id ? { ...f, ...updates, lastUpdated: new Date().toISOString() } : f
    ));
  }, []);

  const deleteUndesignatedFund = useCallback(async (id: string) => {
    setUndesignatedFunds(prev => prev.filter(f => f.id !== id));
  }, []);

  const addFundReallocation = useCallback(async (reallocation: Omit<FundReallocationToPledge, "id">) => {
    const newReallocation: FundReallocationToPledge = {
      ...reallocation,
      id: Date.now().toString(),
    };
    
    // If the reallocation is completed, reduce the fund balance
    if (newReallocation.status === "Completed") {
      setUndesignatedFunds(prev => prev.map(f => 
        f.id === newReallocation.fromUndesignatedFundId 
          ? { ...f, balance: f.balance - newReallocation.amount, lastUpdated: new Date().toISOString() }
          : f
      ));
    }
    
    setFundReallocations(prev => [...prev, newReallocation]);
    return newReallocation.id;
  }, []);

  const updateFundReallocation = useCallback(async (id: string, updates: Partial<FundReallocationToPledge>) => {
    setFundReallocations(prev => prev.map(r => {
      if (r.id === id) {
        const oldReallocation = r;
        const updatedReallocation = { ...r, ...updates };
        
        // If status changed to completed, reduce the fund balance
        if (oldReallocation.status !== "Completed" && updatedReallocation.status === "Completed") {
          setUndesignatedFunds(fundsPrev => fundsPrev.map(f => 
            f.id === updatedReallocation.fromUndesignatedFundId 
              ? { ...f, balance: f.balance - updatedReallocation.amount, lastUpdated: new Date().toISOString() }
              : f
          ));
        }
        // If status changed from completed to something else, restore the fund balance
        else if (oldReallocation.status === "Completed" && updatedReallocation.status !== "Completed") {
          setUndesignatedFunds(fundsPrev => fundsPrev.map(f => 
            f.id === updatedReallocation.fromUndesignatedFundId 
              ? { ...f, balance: f.balance + oldReallocation.amount, lastUpdated: new Date().toISOString() }
              : f
          ));
        }
        
        return updatedReallocation;
      }
      return r;
    }));
  }, []);

  const getAvailableBalance = useCallback((fundId: string) => {
    const fund = undesignatedFunds.find(f => f.id === fundId);
    if (!fund) {
      return 0;
    }

    // Since we now reduce the fund balance when reallocations are completed,
    // the available balance is simply the current fund balance
    return fund.balance;
  }, [undesignatedFunds]);

  const getFundsByImpactArea = useCallback((impactArea: string) => {
    return undesignatedFunds.filter(f => f.impactArea === impactArea);
  }, [undesignatedFunds]);

  const deleteFundReallocation = useCallback(async (id: string) => {
    const reallocation = fundReallocations.find(r => r.id === id);
    if (reallocation && reallocation.status === "Completed") {
      // Restore the fund balance when deleting a completed reallocation
      setUndesignatedFunds(prev => prev.map(f => 
        f.id === reallocation.fromUndesignatedFundId 
          ? { ...f, balance: f.balance + reallocation.amount, lastUpdated: new Date().toISOString() }
          : f
      ));
    }
    
    setFundReallocations(prev => prev.filter(r => r.id !== id));
  }, [fundReallocations]);

  return {
    undesignatedFunds,
    fundReallocations,
    addOrUpdateUndesignatedFund,
    updateUndesignatedFund,
    deleteUndesignatedFund,
    addFundReallocation,
    updateFundReallocation,
    deleteFundReallocation,
    getAvailableBalance,
    getFundsByImpactArea,
  };
};