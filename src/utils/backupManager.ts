import { LocalStorageManager } from "./localStorageManager";
import { Project, ProjectAttachment, ProjectPhoto, ProjectMilestone, ProjectNote } from "@/types/project";

export interface FullBackup {
  timestamp: string;
  version: string;
  data: {
    projects: Project[];
    attachments: ProjectAttachment[];
    photos: ProjectPhoto[];
    milestones: ProjectMilestone[];
    notes: ProjectNote[];
    donorReceipts: any[];
    donorPledges: any[];
    exchangeRate: any;
  };
}

export class BackupManager {
  private static readonly BACKUP_PREFIX = 'fftp_backup_';
  private static readonly MAX_AUTO_BACKUPS = 10;

  static async createFullBackup(): Promise<FullBackup> {
    const timestamp = new Date().toISOString();
    
    const backup: FullBackup = {
      timestamp,
      version: "2.0",
      data: {
        projects: LocalStorageManager.getItem('projects', []),
        attachments: LocalStorageManager.getItem('project-attachments', []),
        photos: LocalStorageManager.getItem('project-photos', []),
        milestones: LocalStorageManager.getItem('project-milestones', []),
        notes: LocalStorageManager.getItem('project-notes', []),
        donorReceipts: LocalStorageManager.getItem('donorReceipts', []),
        donorPledges: LocalStorageManager.getItem('donorPledges', []),
        exchangeRate: LocalStorageManager.getItem('exchangeRate', null),
      }
    };

    // Save backup to localStorage with timestamp
    const backupKey = `${this.BACKUP_PREFIX}${Date.now()}`;
    await LocalStorageManager.setItem(backupKey as any, backup);
    
    // Clean up old auto-backups
    this.cleanupOldBackups();
    
    console.log(`✅ Created full backup: ${backupKey}`);
    return backup;
  }

  static async createAutoBackup(): Promise<void> {
    try {
      await this.createFullBackup();
      console.log('✅ Auto-backup completed');
    } catch (error) {
      console.error('❌ Auto-backup failed:', error);
    }
  }

  static downloadBackup(backup?: FullBackup): void {
    const backupData = backup || this.createFullBackup();
    
    const dataStr = JSON.stringify(backupData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fftp-backup-${new Date().toISOString().split('T')[0]}.json`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
    console.log('✅ Backup downloaded');
  }

  static async restoreFromBackup(backup: FullBackup): Promise<boolean> {
    try {
      console.log('🔄 Starting restore from backup...');
      
      // Restore all data
      await LocalStorageManager.setItem('projects', backup.data.projects);
      await LocalStorageManager.setItem('project-attachments', backup.data.attachments);
      await LocalStorageManager.setItem('project-photos', backup.data.photos);
      await LocalStorageManager.setItem('project-milestones', backup.data.milestones);
      await LocalStorageManager.setItem('project-notes', backup.data.notes);
      await LocalStorageManager.setItem('donorReceipts', backup.data.donorReceipts);
      await LocalStorageManager.setItem('donorPledges', backup.data.donorPledges);
      
      if (backup.data.exchangeRate) {
        await LocalStorageManager.setItem('exchangeRate', backup.data.exchangeRate);
      }
      
      console.log('✅ Restore completed successfully');
      
      // Force page reload to ensure all components update
      window.location.reload();
      
      return true;
    } catch (error) {
      console.error('❌ Restore failed:', error);
      return false;
    }
  }

  static async restoreFromFile(file: File): Promise<boolean> {
    try {
      const text = await file.text();
      const backup: FullBackup = JSON.parse(text);
      
      // Validate backup structure
      if (!backup.timestamp || !backup.data || !backup.data.projects) {
        throw new Error('Invalid backup file format');
      }
      
      return await this.restoreFromBackup(backup);
    } catch (error) {
      console.error('❌ Failed to restore from file:', error);
      return false;
    }
  }

  static getAvailableBackups(): FullBackup[] {
    const backups: FullBackup[] = [];
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(this.BACKUP_PREFIX)) {
          const backup = JSON.parse(localStorage.getItem(key) || '{}');
          if (backup.timestamp) {
            backups.push(backup);
          }
        }
      }
    } catch (error) {
      console.error('❌ Failed to load backups:', error);
    }
    
    return backups.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  private static cleanupOldBackups(): void {
    const backups = this.getAvailableBackups();
    
    if (backups.length > this.MAX_AUTO_BACKUPS) {
      const toDelete = backups.slice(this.MAX_AUTO_BACKUPS);
      
      toDelete.forEach(backup => {
        const key = Object.keys(localStorage).find(k => 
          k.startsWith(this.BACKUP_PREFIX) && 
          localStorage.getItem(k)?.includes(backup.timestamp)
        );
        
        if (key) {
          localStorage.removeItem(key);
          console.log(`🗑️ Removed old backup: ${key}`);
        }
      });
    }
  }

  // Initialize auto-backup on data changes
  static initializeAutoBackup(): void {
    // Create initial backup
    this.createAutoBackup();
    
    // Set up periodic backups every 5 minutes
    setInterval(() => {
      this.createAutoBackup();
    }, 5 * 60 * 1000);
    
    console.log('✅ Auto-backup system initialized');
  }
}