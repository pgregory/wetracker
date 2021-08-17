export default class DB {
  static staticConstructor() {
    // Database initialisation:
    this.idb = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;

    if (!this.idb) {
      console.log("Your browser doesn't support a stable version of IndexedDB. WeTracker will not be able to store settings locally.");
    }
  }

  static async loadFromIndexedDB(storeName, id) {
    return new Promise(
      (resolve, reject) => {
        const dbRequest = this.idb.open('WeTracker', 1);

        dbRequest.onerror = () => {
          reject(Error('Error text'));
        };

        dbRequest.onupgradeneeded = (event) => {
          // Objectstore does not exist. Nothing to load
          event.target.transaction.abort();
          reject(Error('Not found'));
        };

        dbRequest.onsuccess = (event) => {
          const database = event.target.result;
          const transaction = database.transaction([storeName]);
          const objectStore = transaction.objectStore(storeName);
          const objectRequest = objectStore.get(id);

          objectRequest.onerror = () => {
            reject(Error('Error text'));
          };

          objectRequest.onsuccess = () => {
            if (objectRequest.result) {
              resolve(objectRequest.result);
            } else {
              reject(Error('object not found'));
            }
          };
        };
      }
    );
  }

  static async saveToIndexedDB(storeName, object) {
    return new Promise(
      (resolve, reject) => {
        const dbRequest = this.idb.open('WeTracker', 1);

        dbRequest.onerror = () => {
          reject(Error('IndexedDB database error'));
        };

        dbRequest.onupgradeneeded = (event) => {
          const db = event.target.result;
          db.createObjectStore(storeName, { keyPath: 'id' });
        };

        dbRequest.onsuccess = (event) => {
          const db = event.target.result;
          const transaction = db.transaction([storeName], 'readwrite');
          const objectStore = transaction.objectStore(storeName);
          const objectRequest = objectStore.put(object);

          objectRequest.onerror = () => {
            reject(Error('Error writing object'));
          };

          objectRequest.onsuccess = () => {
            resolve('Data saved OK');
          };
        };
      }
    );
  }
}
DB.staticConstructor();
