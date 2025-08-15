import { ProjectMilestone } from "@/types/project";
import { LocalStorageManager } from "./localStorageManager";

export class EmergencyMilestoneRecovery {
  private static readonly CUTOFF_DATE = new Date('2025-08-14T19:00:00');

  static async recoverAllMilestones(): Promise<ProjectMilestone[]> {
    console.log('🚨 EMERGENCY MILESTONE RECOVERY STARTED');
    console.log('📅 Recovery cutoff: August 14th, 2025 7:00 PM');
    
    const recoveredMilestones: ProjectMilestone[] = [];
    const sources: string[] = [];

    // 1. Check current milestone storage
    const currentMilestones = LocalStorageManager.getItem('project-milestones', []);
    if (currentMilestones.length > 0) {
      recoveredMilestones.push(...currentMilestones);
      sources.push(`current storage (${currentMilestones.length})`);
    }

    // 2. Check backup storage locations
    const backupLocations = [
      'fftp_project-milestones',
      'fftp_project-milestones_backup',
      'project-milestones',
      'project-milestones_backup'
    ];

    for (const location of backupLocations) {
      try {
        const item = localStorage.getItem(location);
        if (item) {
          const parsed = JSON.parse(item);
          const milestones = Array.isArray(parsed) ? parsed : [];
          if (milestones.length > 0) {
            recoveredMilestones.push(...milestones);
            sources.push(`${location} (${milestones.length})`);
          }
        }
      } catch (error) {
        console.log(`⚠️ Could not parse ${location}:`, error);
      }
    }

    // 3. Check all backup files
    const backupMilestones = this.scanAllBackupFiles();
    if (backupMilestones.length > 0) {
      recoveredMilestones.push(...backupMilestones);
      sources.push(`backup files (${backupMilestones.length})`);
    }

    // 4. Check for any other milestone-related keys
    const additionalMilestones = this.scanForHiddenMilestones();
    if (additionalMilestones.length > 0) {
      recoveredMilestones.push(...additionalMilestones);
      sources.push(`hidden storage (${additionalMilestones.length})`);
    }

    // 5. Remove duplicates by ID
    const uniqueMilestones = this.removeDuplicates(recoveredMilestones);
    
    // 6. Filter by cutoff date
    const validMilestones = this.filterByDate(uniqueMilestones);

    console.log('📊 RECOVERY SUMMARY:');
    console.log(`Total found: ${recoveredMilestones.length}`);
    console.log(`Unique milestones: ${uniqueMilestones.length}`);
    console.log(`Valid milestones (before cutoff): ${validMilestones.length}`);
    console.log(`Sources: ${sources.join(', ')}`);

    if (validMilestones.length > 0) {
      await this.restoreMilestones(validMilestones);
      console.log('✅ EMERGENCY RECOVERY COMPLETED');
    } else {
      console.log('❌ NO MILESTONES FOUND FOR RECOVERY');
    }

    return validMilestones;
  }

  private static scanAllBackupFiles(): ProjectMilestone[] {
    const milestones: ProjectMilestone[] = [];

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.includes('backup') || key?.includes('fftp_backup_')) {
          try {
            const item = localStorage.getItem(key);
            if (item) {
              const parsed = JSON.parse(item);
              
              // Check if it's a full backup
              if (parsed.data?.milestones && Array.isArray(parsed.data.milestones)) {
                milestones.push(...parsed.data.milestones);
                console.log(`📦 Found ${parsed.data.milestones.length} milestones in backup: ${key}`);
              }
              
              // Check if it's direct milestone data
              if (Array.isArray(parsed)) {
                const validMilestones = parsed.filter(item => 
                  item && typeof item === 'object' && item.id && item.projectId
                );
                if (validMilestones.length > 0) {
                  milestones.push(...validMilestones);
                  console.log(`📦 Found ${validMilestones.length} milestones in: ${key}`);
                }
              }
            }
          } catch (error) {
            console.log(`⚠️ Could not parse backup ${key}:`, error);
          }
        }
      }
    } catch (error) {
      console.error('❌ Error scanning backup files:', error);
    }

    return milestones;
  }

  private static scanForHiddenMilestones(): ProjectMilestone[] {
    const milestones: ProjectMilestone[] = [];
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && !key.includes('backup') && !key.includes('fftp_backup_')) {
          try {
            const item = localStorage.getItem(key);
            if (item) {
              const parsed = JSON.parse(item);
              
              // Check if it contains milestone-like data
              if (Array.isArray(parsed)) {
                const possibleMilestones = parsed.filter(item => 
                  item && 
                  typeof item === 'object' && 
                  item.id && 
                  item.projectId && 
                  (item.title || item.milestoneType)
                );
                
                if (possibleMilestones.length > 0) {
                  milestones.push(...possibleMilestones);
                  console.log(`🔍 Found ${possibleMilestones.length} milestone-like objects in: ${key}`);
                }
              }
            }
          } catch (error) {
            // Ignore parsing errors for non-JSON data
          }
        }
      }
    } catch (error) {
      console.error('❌ Error scanning for hidden milestones:', error);
    }

    return milestones;
  }

  private static removeDuplicates(milestones: ProjectMilestone[]): ProjectMilestone[] {
    const seen = new Set<string>();
    return milestones.filter(milestone => {
      if (seen.has(milestone.id)) {
        return false;
      }
      seen.add(milestone.id);
      return true;
    });
  }

  private static filterByDate(milestones: ProjectMilestone[]): ProjectMilestone[] {
    return milestones.filter(milestone => {
      // If milestone has a creation date or timestamp, check it
      const milestoneDate = this.extractMilestoneDate(milestone);
      if (milestoneDate && milestoneDate <= this.CUTOFF_DATE) {
        return true;
      }
      
      // If no date info, include it (assume it's valid)
      if (!milestoneDate) {
        return true;
      }
      
      return false;
    });
  }

  private static extractMilestoneDate(milestone: ProjectMilestone): Date | null {
    // Try to extract date from ID (if timestamp-based)
    try {
      const idNumber = parseInt(milestone.id);
      if (!isNaN(idNumber) && idNumber > 1000000000000) { // Looks like a timestamp
        return new Date(idNumber);
      }
    } catch {}

    // Try startDate
    if (milestone.startDate) {
      try {
        return new Date(milestone.startDate);
      } catch {}
    }

    // Try dueDate
    if (milestone.dueDate) {
      try {
        return new Date(milestone.dueDate);
      } catch {}
    }

    return null;
  }

  private static async restoreMilestones(milestones: ProjectMilestone[]): Promise<void> {
    try {
      // Save to multiple locations for safety
      await LocalStorageManager.setItem('project-milestones', milestones);
      
      // Also save to backup location
      localStorage.setItem('fftp_project-milestones', JSON.stringify(milestones));
      localStorage.setItem('fftp_project-milestones_backup', JSON.stringify(milestones));
      
      console.log(`✅ Restored ${milestones.length} milestones to storage`);
      
      // Trigger update event
      window.dispatchEvent(new CustomEvent('milestones-restored', { 
        detail: { milestones, count: milestones.length } 
      }));
      
    } catch (error) {
      console.error('❌ Failed to restore milestones:', error);
      throw error;
    }
  }

  static logAllStorageKeys(): void {
    console.log('🔍 ALL LOCALSTORAGE KEYS:');
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const size = localStorage.getItem(key)?.length || 0;
        console.log(`  ${key}: ${size} chars`);
      }
    }
  }
}