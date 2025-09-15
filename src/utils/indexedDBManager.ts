// IndexedDB manager for large file storage with enhanced error handling
export class IndexedDBManager {
  private static DB_NAME = 'FFTP_AttachmentDB';
  private static DB_VERSION = 1;
  private static STORE_NAME = 'attachments';

  private static async openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      try {
        const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);
        
        request.onerror = () => {
          console.error('IndexedDB open error:', request.error);
          reject(new Error(`IndexedDB failed to open: ${request.error}`));
        };
        
        request.onsuccess = () => {
          console.log('IndexedDB opened successfully');
          resolve(request.result);
        };
        
        request.onupgradeneeded = (event) => {
          try {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(this.STORE_NAME)) {
              const store = db.createObjectStore(this.STORE_NAME, { keyPath: 'id' });
              store.createIndex('projectId', 'projectId', { unique: false });
              console.log('IndexedDB store created');
            }
          } catch (upgradeError) {
            console.error('IndexedDB upgrade error:', upgradeError);
            reject(upgradeError);
          }
        };
      } catch (error) {
        console.error('IndexedDB initialization error:', error);
        reject(error);
      }
    });
  }

  static async saveAttachment(attachment: any): Promise<boolean> {
    try {
      if (!attachment || !attachment.id) {
        console.error('Invalid attachment data:', attachment);
        return false;
      }

      const db = await this.openDB();
      const transaction = db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      
      await new Promise((resolve, reject) => {
        const request = store.put(attachment);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => {
          console.error('IndexedDB put error:', request.error);
          reject(new Error(`Failed to save attachment: ${request.error}`));
        };
      });
      
      console.log(`✅ Saved attachment ${attachment.fileName} to IndexedDB`);
      return true;
    } catch (error) {
      console.error('❌ Failed to save to IndexedDB:', error);
      return false;
    }
  }

  static async getAllAttachments(): Promise<any[]> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      
      return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => {
          const result = Array.isArray(request.result) ? request.result : [];
          console.log(`📖 Loaded ${result.length} attachments from IndexedDB`);
          resolve(result);
        };
        request.onerror = () => {
          console.error('IndexedDB getAll error:', request.error);
          reject(new Error(`Failed to load attachments: ${request.error}`));
        };
      });
    } catch (error) {
      console.error('❌ Failed to load from IndexedDB:', error);
      return [];
    }
  }

  static async deleteAttachment(id: string): Promise<boolean> {
    try {
      if (!id) {
        console.error('Invalid attachment ID for deletion');
        return false;
      }

      const db = await this.openDB();
      const transaction = db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      
      await new Promise((resolve, reject) => {
        const request = store.delete(id);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => {
          console.error('IndexedDB delete error:', request.error);
          reject(new Error(`Failed to delete attachment: ${request.error}`));
        };
      });
      
      console.log(`🗑️ Deleted attachment ${id} from IndexedDB`);
      return true;
    } catch (error) {
      console.error('❌ Failed to delete from IndexedDB:', error);
      return false;
    }
  }

  static async getAttachmentsByProject(projectId: string): Promise<any[]> {
    try {
      if (!projectId) {
        console.warn('Empty projectId for getAttachmentsByProject');
        return [];
      }

      const db = await this.openDB();
      const transaction = db.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const index = store.index('projectId');
      
      return new Promise((resolve, reject) => {
        const request = index.getAll(projectId);
        request.onsuccess = () => {
          const result = Array.isArray(request.result) ? request.result : [];
          console.log(`📖 Found ${result.length} attachments for project ${projectId}`);
          resolve(result);
        };
        request.onerror = () => {
          console.error('IndexedDB getAll by project error:', request.error);
          reject(new Error(`Failed to get project attachments: ${request.error}`));
        };
      });
    } catch (error) {
      console.error('❌ Failed to get project attachments:', error);
      return [];
    }
  }
}