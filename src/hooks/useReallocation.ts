import { useState, useEffect, useCallback } from "react";
import { FundReallocation, ReallocationSummary } from "@/types/reallocation";
import { Project } from "@/types/project";
import { LocalStorageManager } from "@/utils/localStorageManager";

export const useReallocation = () => {
  const [reallocations, setReallocations] = useState<FundReallocation[]>(() => {
    return LocalStorageManager.getItem('fund-reallocations', []);
  });

  useEffect(() => {
    LocalStorageManager.setItem('fund-reallocations', reallocations);
  }, [reallocations]);

  const addReallocation = useCallback(async (reallocation: Omit<FundReallocation, "id">) => {
    const newReallocation: FundReallocation = {
      ...reallocation,
      id: Date.now().toString(),
    };
    
    setReallocations(prev => [...prev, newReallocation]);
    return newReallocation.id;
  }, []);

  const updateReallocation = useCallback(async (id: string, updates: Partial<FundReallocation>) => {
    setReallocations(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  }, []);

  const deleteReallocation = useCallback(async (id: string) => {
    setReallocations(prev => prev.filter(r => r.id !== id));
  }, []);

  const getReallocationsForProject = useCallback((projectId: string) => {
    return reallocations.filter(r => r.fromProjectId === projectId || r.toProjectId === projectId);
  }, [reallocations]);

  const getReallocationSummary = useCallback((project: Project): ReallocationSummary => {
    const projectReallocations = getReallocationsForProject(project.id);
    
    const allocatedOut = projectReallocations
      .filter(r => r.fromProjectId === project.id && r.status === 'Completed')
      .reduce((sum, r) => sum + r.amount, 0);
    
    const allocatedIn = projectReallocations
      .filter(r => r.toProjectId === project.id && r.status === 'Completed')
      .reduce((sum, r) => sum + r.amount, 0);

    return {
      projectId: project.id,
      projectName: project.projectName,
      totalAllocatedOut: allocatedOut,
      totalAllocatedIn: allocatedIn,
      netReallocation: allocatedIn - allocatedOut,
      currency: project.currency
    };
  }, [getReallocationsForProject]);

  const getAvailableBalance = useCallback((project: Project) => {
    const summary = getReallocationSummary(project);
    const baseBalance = (project.totalCost || 0) - project.amountDisbursed;
    return baseBalance + summary.netReallocation;
  }, [getReallocationSummary]);

  return {
    reallocations,
    addReallocation,
    updateReallocation,
    deleteReallocation,
    getReallocationsForProject,
    getReallocationSummary,
    getAvailableBalance,
  };
};