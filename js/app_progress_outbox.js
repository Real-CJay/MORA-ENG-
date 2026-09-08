// Durable, account-owned operations. Retries are deduplicated by the server receipt.
(function () {
  'use strict';
  const DB_NAME = 'mora-progress-v2';
  let database, running = null, sendOperation, currentUser;
  let queuedDuringFlush = false;
  function open() {
    if (!database) database = new Promise((resolve, reject) => {
      if (!window.indexedDB) return reject(new Error('Persistent storage is unavailable'));
      const request = indexedDB.open(DB_NAME, 2);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('operations')) {
          const operations = db.createObjectStore('operations', { keyPath: 'operationId' });
          operations.createIndex('userId', 'userId');
          db.createObjectStore('recovery', { keyPath: 'key' });
        }
        if (!db.objectStoreNames.contains('imports')) db.createObjectStore('imports', { keyPath: 'key' });
      };
      request.onsuccess = () => {
        request.result.onversionchange = () => { request.result.close(); database = null; };
        resolve(request.result);
      };
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error('Close older Mora Quiz tabs to enable progress storage'));
    }).catch(error => { database = null; throw error; });
    return database;
  }
  async function transaction(storeName, mode, action) {
    const db = await open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, mode);
      let value;
      const request = action(tx.objectStore(storeName));
      if (request) request.onsuccess = () => { value = request.result; };
      tx.oncomplete = () => resolve(value);
      tx.onerror = () => reject(tx.error || new Error('Progress storage failed'));
      tx.onabort = () => reject(tx.error || new Error('Progress storage aborted'));
    });
  }
  async function enqueue(operation) {
    if (!operation.userId || !operation.operationId) throw new Error('Progress owner and receipt are required');
    // add, not put: an existing receipt must never be overwritten with a new payload.
    try { await transaction('operations', 'readwrite', store => store.add(operation)); }
    catch (error) {
      const previous = await transaction('operations', 'readonly', store => store.get(operation.operationId));
      if (!previous || JSON.stringify(previous) !== JSON.stringify(operation)) throw error;
    }
    queuedDuringFlush = true;
    return operation.operationId;
  }
  function pending(userId) {
    return transaction('operations', 'readonly', store => store.index('userId').getAll(userId));
  }
  async function flush() {
    if (running) return running;
    if (!navigator.onLine || !sendOperation || !currentUser?.()) return false;
    running = (async () => {
      const owner = currentUser();
      // Other tabs may also replay. Server receipts make this safe; deletes are per ID.
      do {
        queuedDuringFlush = false;
        const operations = (await pending(owner)).sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));
        for (const operation of operations) {
          if (currentUser() !== owner || !navigator.onLine) return false;
          const acknowledgement = await sendOperation(operation);
          if (acknowledgement?.operationId !== operation.operationId) throw new Error('Save was not acknowledged');
          await transaction('operations', 'readwrite', store => store.delete(operation.operationId));
        }
      } while (queuedDuringFlush);
      return (await pending(owner)).length === 0;
    })().finally(() => { running = null; });
    return running;
  }
  async function preserveLegacy() {
    // Never delete the originals or infer who owns these records.
    const keys = Object.keys(localStorage).filter(key => key === 'mora_quiz_pending_sync_v1' || key.startsWith('mora_flags_v1_'));
    for (const key of keys) {
      const existing = await transaction('recovery', 'readonly', store => store.get(key));
      if (!existing) await transaction('recovery', 'readwrite', store => store.put({ key, raw: localStorage.getItem(key), preservedAt: new Date().toISOString() }));
    }
  }
  function exportRecovery() {
    return transaction('recovery', 'readonly', store => store.getAll());
  }
  async function getOrCreateImport(key, candidate) {
    const db = await open();
    return new Promise((resolve, reject) => {
      // One read/write transaction serializes first import across tabs/accounts.
      const tx = db.transaction('imports', 'readwrite');
      const store = tx.objectStore('imports');
      let manifest;
      const request = store.get(key);
      request.onsuccess = () => {
        manifest = request.result || { ...candidate, key };
        if (!request.result) store.add(manifest);
      };
      tx.oncomplete = () => resolve(manifest);
      tx.onerror = tx.onabort = () => reject(tx.error || new Error('Guest import storage failed'));
    });
  }
  function configure(sender, getUser) {
    sendOperation = sender;
    currentUser = getUser;
  }
  window.downloadProgressRecovery = async function () {
    try {
      await preserveLegacy();
      const rows = await exportRecovery();
      const url = URL.createObjectURL(new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' }));
      const link = document.createElement('a');
      link.href = url; link.download = 'mora-offline-recovery.json';
      document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) { window.alert('Recovery export failed: ' + error.message); }
  };
  window.MoraProgressOutbox = { enqueue, pending, flush, preserveLegacy, exportRecovery, getOrCreateImport, configure };
})();
