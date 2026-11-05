const DB_NAME = 'BilleteraDB';
const DB_VERSION = 1;

export const DEFAULT_CATEGORIES = [
  { id: 'cat-1', name: 'Sueldo', type: 'income', icon: '💼', color: '#16a34a' },
  { id: 'cat-2', name: 'Inversiones', type: 'income', icon: '📈', color: '#0d9488' },
  { id: 'cat-3', name: 'Otros Ingresos', type: 'income', icon: '💰', color: '#2563eb' },
  { id: 'cat-4', name: 'Alimentación', type: 'expense', icon: '🛒', color: '#dc2626' },
  { id: 'cat-5', name: 'Vivienda y Servicios', type: 'expense', icon: '🏠', color: '#ea580c' },
  { id: 'cat-6', name: 'Transporte', type: 'expense', icon: '🚌', color: '#d97706' },
  { id: 'cat-7', name: 'Entretenimiento', type: 'expense', icon: '🎬', color: '#9333ea' },
  { id: 'cat-8', name: 'Salud', type: 'expense', icon: '🩺', color: '#db2777' }
];

export const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('movements')) {
        db.createObjectStore('movements', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('categories')) {
        const catStore = db.createObjectStore('categories', { keyPath: 'id' });
        DEFAULT_CATEGORIES.forEach(cat => catStore.add(cat));
      }
    };
  });
};

export const dbService = {
  async getMovements() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('movements', 'readonly');
      const store = tx.objectStore('movements');
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  },

  async saveMovement(movement) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('movements', 'readwrite');
      const store = tx.objectStore('movements');
      const req = store.put(movement);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  },

  async deleteMovement(id) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('movements', 'readwrite');
      const store = tx.objectStore('movements');
      const req = store.delete(id);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  },

  async clearAllMovements() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('movements', 'readwrite');
      const store = tx.objectStore('movements');
      const req = store.clear();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  },

  async getCategories() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('categories', 'readonly');
      const store = tx.objectStore('categories');
      const req = store.getAll();
      req.onsuccess = () => {
        const res = req.result;
        resolve(res && res.length > 0 ? res : DEFAULT_CATEGORIES);
      };
      req.onerror = () => reject(req.error);
    });
  },

  async saveCategory(category) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('categories', 'readwrite');
      const store = tx.objectStore('categories');
      const req = store.put(category);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  },

  async deleteCategory(id) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('categories', 'readwrite');
      const store = tx.objectStore('categories');
      const req = store.delete(id);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  },

  async exportBackup() {
    const movements = await this.getMovements();
    const categories = await this.getCategories();
    return {
      version: 1,
      appName: 'Billetera',
      exportedAt: new Date().toISOString(),
      movements,
      categories
    };
  },

  async importBackup(data) {
    if (!data || data.appName !== 'Billetera' || !Array.isArray(data.movements) || !Array.isArray(data.categories)) {
      throw new Error('El archivo de respaldo no tiene un formato válido de Billetera.');
    }

    const db = await openDB();
    const tx = db.transaction(['movements', 'categories'], 'readwrite');
    const movStore = tx.objectStore('movements');
    const catStore = tx.objectStore('categories');

    await new Promise((res, rej) => {
      const req = movStore.clear();
      req.onsuccess = res;
      req.onerror = rej;
    });

    await new Promise((res, rej) => {
      const req = catStore.clear();
      req.onsuccess = res;
      req.onerror = rej;
    });

    for (const mov of data.movements) {
      movStore.put(mov);
    }
    for (const cat of data.categories) {
      catStore.put(cat);
    }

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  }
};