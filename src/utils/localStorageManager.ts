// Centralized localStorage management with error handling and recovery

type StorageKey = 'projects' | 'project-attachments' | 'project-milestones' | 'project-photos' | 'project-notes' | 'donorReceipts' | 'donorPledges' | 'exchangeRate';

export class LocalStorageManager {
  private static readonly STORAGE_VERSION = '1.0';
  private static readonly VERSION_KEY = 'app-storage-version';

  static isAvailable(): boolean {
    try {
      const test = '__localStorage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  static checkAndUpgradeStorage(): void {
    if (!this.isAvailable()) return;
    
    const currentVersion = localStorage.getItem(this.VERSION_KEY);
    if (currentVersion !== this.STORAGE_VERSION) {
      console.log('Storage version mismatch, initializing fresh storage');
      this.clearAll();
      localStorage.setItem(this.VERSION_KEY, this.STORAGE_VERSION);
    }
  }

  static setItem<T>(key: StorageKey, value: T): boolean {
    if (!this.isAvailable()) {
      console.error('localStorage is not available');
      return false;
    }

    try {
      const serialized = JSON.stringify(value);
      
      // Check if we're close to quota limit (usually 5-10MB)
      const estimatedSize = new Blob([serialized]).size;
      if (estimatedSize > 5 * 1024 * 1024) { // 5MB warning
        console.warn(`Large storage operation (${Math.round(estimatedSize / 1024 / 1024)}MB) for key: ${key}`);
      }

      localStorage.setItem(key, serialized);
      console.log(`✅ Saved ${key} to localStorage (${Math.round(estimatedSize / 1024)}KB)`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to save ${key} to localStorage:`, error);
      
      // Try to free up space by clearing old data
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        console.log('Storage quota exceeded, attempting cleanup...');
        this.performEmergencyCleanup(key);
        
        // Try one more time after cleanup
        try {
          localStorage.setItem(key, JSON.stringify(value));
          console.log(`✅ Saved ${key} after cleanup`);
          return true;
        } catch {
          console.error(`❌ Failed to save ${key} even after cleanup`);
        }
      }
      return false;
    }
  }

  static getItem<T>(key: StorageKey, defaultValue: T): T {
    if (!this.isAvailable()) {
      console.warn(`localStorage not available, returning default for ${key}`);
      return defaultValue;
    }

    try {
      const item = localStorage.getItem(key);
      if (item === null) {
        return defaultValue;
      }
      
      const parsed = JSON.parse(item);
      console.log(`📖 Loaded ${key} from localStorage`);
      return parsed;
    } catch (error) {
      console.error(`❌ Failed to parse ${key} from localStorage:`, error);
      // Remove corrupted data
      localStorage.removeItem(key);
      return defaultValue;
    }
  }

  static removeItem(key: StorageKey): void {
    if (!this.isAvailable()) return;
    
    try {
      localStorage.removeItem(key);
      console.log(`🗑️ Removed ${key} from localStorage`);
    } catch (error) {
      console.error(`❌ Failed to remove ${key}:`, error);
    }
  }

  static clearAll(): void {
    if (!this.isAvailable()) return;
    
    try {
      localStorage.clear();
      console.log('🧹 Cleared all localStorage data');
    } catch (error) {
      console.error('❌ Failed to clear localStorage:', error);
    }
  }

  private static performEmergencyCleanup(excludeKey?: StorageKey): void {
    const cleanupOrder: StorageKey[] = ['project-photos', 'project-attachments', 'project-milestones', 'project-notes'];
    
    for (const key of cleanupOrder) {
      if (key === excludeKey) continue;
      
      try {
        const data = localStorage.getItem(key);
        if (data) {
          const parsed = JSON.parse(data);
          if (Array.isArray(parsed) && parsed.length > 10) {
            // Keep only recent items
            const reduced = parsed.slice(-10);
            localStorage.setItem(key, JSON.stringify(reduced));
            console.log(`🧹 Reduced ${key} from ${parsed.length} to ${reduced.length} items`);
          }
        }
      } catch (error) {
        console.error(`Failed to cleanup ${key}:`, error);
        localStorage.removeItem(key);
      }
    }
  }

  static getStorageStats(): { used: string; available: string; keys: number } {
    if (!this.isAvailable()) {
      return { used: '0KB', available: 'N/A', keys: 0 };
    }

    let totalSize = 0;
    let keyCount = 0;

    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        totalSize += localStorage[key].length;
        keyCount++;
      }
    }

    const usedMB = totalSize / 1024 / 1024;
    const estimatedAvailable = 5 - usedMB; // Assume ~5MB limit

    return {
      used: `${Math.round(usedMB * 100) / 100}MB`,
      available: `${Math.max(0, Math.round(estimatedAvailable * 100) / 100)}MB`,
      keys: keyCount
    };
  }
}

// Initialize storage version check on module load
LocalStorageManager.checkAndUpgradeStorage();
