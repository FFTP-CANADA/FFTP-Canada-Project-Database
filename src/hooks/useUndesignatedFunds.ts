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
    
    setFundReallocations(prev => [...prev, newReallocation]);
    return newReallocation.id;
  }, []);

  const updateFundReallocation = useCallback(async (id: string, updates: Partial<FundReallocationToPledge>) => {
    setFundReallocations(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  }, []);

  const getAvailableBalance = useCallback((fundId: string) => {
    const fund = undesignatedFunds.find(f => f.id === fundId);
    if (!fund) return 0;

    const allocatedAmount = fundReallocations
      .filter(r => r.fromUndesignatedFundId === fundId && r.status === 'Completed')
      .reduce((sum, r) => sum + r.amount, 0);

    return fund.balance - allocatedAmount;
  }, [undesignatedFunds, fundReallocations]);

  const getFundsByImpactArea = useCallback((impactArea: string) => {
    return undesignatedFunds.filter(f => f.impactArea === impactArea);
  }, [undesignatedFunds]);

  return {
    undesignatedFunds,
    fundReallocations,
    addOrUpdateUndesignatedFund,
    updateUndesignatedFund,
    deleteUndesignatedFund,
    addFundReallocation,
    updateFundReallocation,
    getAvailableBalance,
    getFundsByImpactArea,
  };
};