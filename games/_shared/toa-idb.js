/* ToA Games — IndexedDB micro-layer
   - No external dependencies
   - Stores JSON for portability
*/
(function () {
  'use strict';

  const DB_NAME = 'toa-games';
  const DB_VERSION = 1;
  const STORE = 'saves';

  let dbPromise = null;

  function openDb() {
    if (dbPromise) return dbPromise;

    dbPromise = new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) {
        reject(new Error('IndexedDB unavailable'));
        return;
      }

      const req = indexedDB.open(DB_NAME, DB_VERSION);

      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
      };

      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error || new Error('IndexedDB open failed'));
    });

    return dbPromise;
  }

  async function withStore(mode, fn) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const store = tx.objectStore(STORE);
      let result;
      try { result = fn(store); } catch (e) { reject(e); return; }
      tx.oncomplete = () => resolve(result);
      tx.onerror = () => reject(tx.error || new Error('IndexedDB tx failed'));
      tx.onabort = () => reject(tx.error || new Error('IndexedDB tx aborted'));
    });
  }

  async function set(key, value) {
    return withStore('readwrite', (s) => s.put(JSON.stringify(value), key));
  }

  async function get(key) {
    const raw = await withStore('readonly', (s) => s.get(key));
    if (raw === undefined) return null;
    try { return JSON.parse(raw); } catch { return null; }
  }

  async function del(key) {
    return withStore('readwrite', (s) => s.delete(key));
  }

  window.TOA_IDB = Object.freeze({ openDb, get, set, del });
})();