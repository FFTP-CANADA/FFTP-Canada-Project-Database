
import { useState } from "react";
import { PROGRAM_OPTIONS } from "@/constants/programs";

export const usePrograms = () => {
  const [customPrograms, setCustomPrograms] = useState<string[]>([]);

  const allPrograms = [...PROGRAM_OPTIONS, ...customPrograms];

  const addProgram = (program: string) => {
    if (!allPrograms.includes(program)) {
      setCustomPrograms(prev => [...prev, program]);
    }
  };

  const deleteProgram = (program: string) => {
    // Only allow deletion of custom programs, not default ones
    if (customPrograms.includes(program)) {
      setCustomPrograms(prev => prev.filter(p => p !== program));
    }
  };

  return {
    allPrograms,
    addProgram,
    deleteProgram,
  };
};
