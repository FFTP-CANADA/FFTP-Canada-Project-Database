// Emergency data recovery utility
import { BackupManager } from "./backupManager";

export class EmergencyDataRecovery {
  static async recoverMilestones(): Promise<any[]> {
    console.log("🚨 EMERGENCY MILESTONE RECOVERY STARTING");
    
    // 1. Check all possible localStorage keys for milestone data
    const possibleKeys = [
      'project-milestones',
      'fftp_project-milestones', 
      'milestones',
      'projectMilestones'
    ];
    
    for (const key of possibleKeys) {
      try {
        const data = localStorage.getItem(key);
        if (data) {
          const parsed = JSON.parse(data);
          if (Array.isArray(parsed) && parsed.length > 0) {
            console.log(`🔍 FOUND milestones in ${key}:`, parsed.length);
            return parsed;
          }
        }
      } catch (e) {
        console.log(`❌ Failed to parse ${key}`);
      }
    }
    
    // 2. Check backup files for milestone data
    console.log("🔍 Searching backups for milestone data...");
    const backups = BackupManager.getAvailableBackups();
    console.log(`📦 Found ${backups.length} backup files`);
    
    for (const backup of backups) {
      try {
        if (backup.data && backup.data.milestones && backup.data.milestones.length > 0) {
          console.log(`🔍 FOUND milestones in backup ${backup.timestamp}:`, backup.data.milestones.length);
          console.log("📊 Milestone data:", backup.data.milestones);
          return backup.data.milestones;
        }
      } catch (e) {
        console.log(`❌ Failed to check backup ${backup.timestamp}`);
      }
    }
    
    // 3. Check all localStorage keys that might contain backups
    console.log("🔍 Checking all localStorage for milestone traces...");
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes('milestone')) {
        try {
          const data = localStorage.getItem(key);
          if (data) {
            const parsed = JSON.parse(data);
            console.log(`🔍 Found milestone-related key ${key}:`, parsed);
            if (Array.isArray(parsed) && parsed.length > 0) {
              return parsed;
            }
          }
        } catch (e) {
          console.log(`❌ Failed to parse milestone key ${key}`);
        }
      }
    }
    
    return [];
  }
  
  static async restoreMilestonesFromMostRecentBackup(): Promise<boolean> {
    try {
      const backups = BackupManager.getAvailableBackups();
      
      for (const backup of backups) {
        if (backup.data && backup.data.milestones && backup.data.milestones.length > 0) {
          console.log(`🔄 RESTORING milestones from backup ${backup.timestamp}`);
          console.log(`📊 Restoring ${backup.data.milestones.length} milestones`);
          
          // Restore milestones to both storage locations
          localStorage.setItem('project-milestones', JSON.stringify(backup.data.milestones));
          localStorage.setItem('fftp_project-milestones', JSON.stringify(backup.data.milestones));
          
          console.log("✅ MILESTONES RESTORED SUCCESSFULLY");
          return true;
        }
      }
      
      console.log("❌ No milestone data found in any backup");
      return false;
    } catch (error) {
      console.error("❌ Failed to restore milestones:", error);
      return false;
    }
  }
}