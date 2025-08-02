import { LocalStorageManager } from "./localStorageManager";
import { Project } from "@/types/project";

// Removed auto-restore to prevent conflicts with user-created projects
// Users should create projects manually through the Add Project dialog

export const restorePortKaituma = async () => {
  console.log("Port Kaituma restore function called but disabled to prevent conflicts");
  // Function kept for backwards compatibility but no longer auto-executes
};