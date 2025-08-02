// IndexedDB manager for large file storage
export class IndexedDBManager {
  private static DB_NAME = 'FFTP_AttachmentDB';
  private static DB_VERSION = 1;
  private static STORE_NAME = 'attachments';

  private static async openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          const store = db.createObjectStore(this.STORE_NAME, { keyPath: 'id' });
          store.createIndex('projectId', 'projectId', { unique: false });
        }
      };
    });
  }

  static async saveAttachment(attachment: any): Promise<boolean> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      
      await new Promise((resolve, reject) => {
        const request = store.put(attachment);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
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
          console.log(`📖 Loaded ${request.result.length} attachments from IndexedDB`);
          resolve(request.result);
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('❌ Failed to load from IndexedDB:', error);
      return [];
    }
  }

  static async deleteAttachment(id: string): Promise<boolean> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      
      await new Promise((resolve, reject) => {
        const request = store.delete(id);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
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
      const db = await this.openDB();
      const transaction = db.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const index = store.index('projectId');
      
      return new Promise((resolve, reject) => {
        const request = index.getAll(projectId);
        request.onsuccess = () => {
          console.log(`📖 Found ${request.result.length} attachments for project ${projectId}`);
          resolve(request.result);
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('❌ Failed to get project attachments:', error);
      return [];
    }
  }
}