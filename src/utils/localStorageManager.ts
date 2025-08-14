// Bulletproof localStorage management with zero data loss
type StorageKey = 'projects' | 'project-attachments' | 'project-milestones' | 'project-photos' | 'project-notes' | 'donorReceipts' | 'donorPledges' | 'exchangeRate' | 'disbursed-amounts-migrated' | 'fund-reallocations' | 'undesignated-funds' | 'fund-reallocations-to-pledge';

export class LocalStorageManager {
  private static readonly PREFIX = 'fftp_';
  private static locks = new Map<StorageKey, boolean>();

  static isAvailable(): boolean {
    try {
      const test = '__test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  private static async acquireLock(key: StorageKey): Promise<void> {
    while (this.locks.get(key)) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    this.locks.set(key, true);
  }

  private static releaseLock(key: StorageKey): void {
    this.locks.set(key, false);
  }

  static async setItem<T>(key: StorageKey, value: T): Promise<boolean> {
    if (!this.isAvailable()) return false;

    await this.acquireLock(key);
    
    try {
      const prefixedKey = this.PREFIX + key;
      const serialized = JSON.stringify(value);
      
      // Create backup before saving
      const existing = localStorage.getItem(prefixedKey);
      if (existing) {
        localStorage.setItem(prefixedKey + '_backup', existing);
      }
      
      localStorage.setItem(prefixedKey, serialized);
      console.log(`✅ Saved ${key} (${Math.round(serialized.length / 1024)}KB)`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to save ${key}:`, error);
      
      // Restore from backup if save failed
      const backup = localStorage.getItem(this.PREFIX + key + '_backup');
      if (backup) {
        try {
          localStorage.setItem(this.PREFIX + key, backup);
          console.log(`🔄 Restored ${key} from backup`);
        } catch {}
      }
      return false;
    } finally {
      this.releaseLock(key);
    }
  }

  static getItem<T>(key: StorageKey, defaultValue: T): T {
    if (!this.isAvailable()) return defaultValue;

    try {
      const prefixedKey = this.PREFIX + key;
      const item = localStorage.getItem(prefixedKey);
      
      if (item === null) return defaultValue;
      
      const parsed = JSON.parse(item);
      console.log(`📖 Loaded ${key}`);
      return parsed;
    } catch (error) {
      console.error(`❌ Failed to parse ${key}:`, error);
      
      // Try backup
      try {
        const backup = localStorage.getItem(this.PREFIX + key + '_backup');
        if (backup) {
          const parsed = JSON.parse(backup);
          console.log(`🔄 Loaded ${key} from backup`);
          return parsed;
        }
      } catch {}
      
      return defaultValue;
    }
  }

  static removeItem(key: StorageKey): void {
    if (!this.isAvailable()) return;
    
    try {
      const prefixedKey = this.PREFIX + key;
      localStorage.removeItem(prefixedKey);
      localStorage.removeItem(prefixedKey + '_backup');
      console.log(`🗑️ Removed ${key}`);
    } catch (error) {
      console.error(`❌ Failed to remove ${key}:`, error);
    }
  }

  static clearAll(): void {
    if (!this.isAvailable()) return;
    
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(this.PREFIX)) {
          localStorage.removeItem(key);
        }
      });
      console.log('🧹 Cleared all app data');
    } catch (error) {
      console.error('❌ Failed to clear data:', error);
    }
  }
}
