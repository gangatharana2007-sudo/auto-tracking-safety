import { OfflineQueueRecord, EmergencyCategory } from '../types';

const DB_NAME = 'KavachMeshLocalDB';
const DB_VERSION = 1;
const STORE_NAME = 'message_queue';

class LocalMessageDatabase {
  private dbPromise: Promise<IDBDatabase>;

  constructor() {
    this.dbPromise = this.initDB();
  }

  private initDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('status', 'status', { unique: false });
          store.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async enqueue(record: Omit<OfflineQueueRecord, 'id' | 'createdAt' | 'updatedAt' | 'retryCount' | 'nextRetryMs'>): Promise<OfflineQueueRecord> {
    const db = await this.dbPromise;
    const now = Date.now();
    const item: OfflineQueueRecord = {
      ...record,
      id: `q-${now}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: now,
      updatedAt: now,
      retryCount: 0,
      nextRetryMs: now + 3000
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.add(item);
      req.onsuccess = () => resolve(item);
      req.onerror = () => reject(req.error);
    });
  }

  async getAll(): Promise<OfflineQueueRecord[]> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => {
        const records = (req.result as OfflineQueueRecord[]) || [];
        records.sort((a, b) => b.createdAt - a.createdAt);
        resolve(records);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async updateStatus(id: string, status: OfflineQueueRecord['status']): Promise<void> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const getReq = store.get(id);

      getReq.onsuccess = () => {
        const record = getReq.result as OfflineQueueRecord | undefined;
        if (!record) {
          resolve();
          return;
        }
        record.status = status;
        record.updatedAt = Date.now();
        record.retryCount += 1;
        record.nextRetryMs = Date.now() + Math.min(60000, 3000 * Math.pow(1.8, record.retryCount));
        const putReq = store.put(record);
        putReq.onsuccess = () => resolve();
        putReq.onerror = () => reject(putReq.error);
      };
      getReq.onerror = () => reject(getReq.error);
    });
  }

  async clearAll(): Promise<void> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }
}

export const localQueueDb = new LocalMessageDatabase();
