"use client";

const databaseName = "directscal-demo-files";
const storeName = "files";

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(storeName);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function operate<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>) {
  const database = await openDatabase();
  try {
    return await new Promise<T>((resolve, reject) => {
      const transaction = database.transaction(storeName, mode);
      const request = action(transaction.objectStore(storeName));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      transaction.onerror = () => reject(transaction.error);
    });
  } finally { database.close(); }
}

export function saveDemoFile(id: string, file: File) { return operate("readwrite", store => store.put(file, id)); }
export function getDemoFile(id: string) { return operate<File | undefined>("readonly", store => store.get(id)); }
export function removeDemoFile(id: string) { return operate("readwrite", store => store.delete(id)); }
export function clearDemoFiles() { return operate("readwrite", store => store.clear()); }
