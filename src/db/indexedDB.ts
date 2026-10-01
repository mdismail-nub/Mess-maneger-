import {
  ActivityLog,
  AppSettings,
  Expense,
  MealEntry,
  Member,
  Month,
  Payment,
} from '../types';

const DB_NAME = 'messmate_db';
const DB_VERSION = 1;

export const STORES = {
  MONTHS: 'months',
  MEMBERS: 'members',
  MEALS: 'meals',
  EXPENSES: 'expenses',
  PAYMENTS: 'payments',
  SETTINGS: 'settings',
  ACTIVITIES: 'activities',
} as const;

type StoreName = (typeof STORES)[keyof typeof STORES];

let dbPromise: Promise<IDBDatabase> | null = null;

export function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(STORES.MONTHS)) {
        db.createObjectStore(STORES.MONTHS, { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains(STORES.MEMBERS)) {
        db.createObjectStore(STORES.MEMBERS, { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains(STORES.MEALS)) {
        const mealStore = db.createObjectStore(STORES.MEALS, { keyPath: 'id' });
        mealStore.createIndex('monthId', 'monthId', { unique: false });
        mealStore.createIndex('date', 'date', { unique: false });
        mealStore.createIndex('memberId', 'memberId', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.EXPENSES)) {
        const expStore = db.createObjectStore(STORES.EXPENSES, { keyPath: 'id' });
        expStore.createIndex('monthId', 'monthId', { unique: false });
        expStore.createIndex('date', 'date', { unique: false });
        expStore.createIndex('paidByMemberId', 'paidByMemberId', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.PAYMENTS)) {
        const payStore = db.createObjectStore(STORES.PAYMENTS, { keyPath: 'id' });
        payStore.createIndex('monthId', 'monthId', { unique: false });
        payStore.createIndex('memberId', 'memberId', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
        db.createObjectStore(STORES.SETTINGS, { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains(STORES.ACTIVITIES)) {
        const actStore = db.createObjectStore(STORES.ACTIVITIES, { keyPath: 'id' });
        actStore.createIndex('monthId', 'monthId', { unique: false });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });

  return dbPromise;
}

export async function getAllFromStore<T>(storeName: StoreName): Promise<T[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result as T[]);
    request.onerror = () => reject(request.error);
  });
}

export async function getFromStore<T>(storeName: StoreName, id: string): Promise<T | undefined> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result as T | undefined);
    request.onerror = () => reject(request.error);
  });
}

export async function putToStore<T>(storeName: StoreName, item: T): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.put(item);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function putManyToStore<T>(storeName: StoreName, items: T[]): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    for (const item of items) {
      store.put(item);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function deleteFromStore(storeName: StoreName, id: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function clearStore(storeName: StoreName): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export const DEFAULT_SETTINGS: AppSettings = {
  id: 'current_settings',
  messName: 'MessMate',
  currencySymbol: '৳',
  currencyCode: 'BDT',
  theme: 'light',
  categories: [
    'Rice',
    'Vegetables',
    'Meat',
    'Fish',
    'Eggs',
    'Grocery',
    'Oil',
    'Spices',
    'Gas',
    'Utilities',
    'Other',
  ],
  updatedAt: new Date().toISOString(),
};

export async function getSettings(): Promise<AppSettings> {
  const settings = await getFromStore<AppSettings>(STORES.SETTINGS, 'current_settings');
  if (!settings) {
    await putToStore(STORES.SETTINGS, DEFAULT_SETTINGS);
    return DEFAULT_SETTINGS;
  }
  return settings;
}

export async function logActivity(
  monthId: string,
  description: string,
  type: ActivityLog['type']
): Promise<void> {
  const activity: ActivityLog = {
    id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    monthId,
    timestamp: new Date().toISOString(),
    description,
    type,
  };
  await putToStore(STORES.ACTIVITIES, activity);
}

export async function exportAllData(): Promise<string> {
  const [months, members, meals, expenses, payments, settings, activities] = await Promise.all([
    getAllFromStore<Month>(STORES.MONTHS),
    getAllFromStore<Member>(STORES.MEMBERS),
    getAllFromStore<MealEntry>(STORES.MEALS),
    getAllFromStore<Expense>(STORES.EXPENSES),
    getAllFromStore<Payment>(STORES.PAYMENTS),
    getAllFromStore<AppSettings>(STORES.SETTINGS),
    getAllFromStore<ActivityLog>(STORES.ACTIVITIES),
  ]);

  const backupPayload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    app: 'MessMate',
    data: {
      months,
      members,
      meals,
      expenses,
      payments,
      settings: settings[0] || DEFAULT_SETTINGS,
      activities,
    },
  };

  return JSON.stringify(backupPayload, null, 2);
}

export async function importAllData(jsonString: string): Promise<boolean> {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed || !parsed.data) {
      throw new Error('Invalid backup format');
    }

    const { months, members, meals, expenses, payments, settings, activities } = parsed.data;

    // Clear existing stores
    await Promise.all([
      clearStore(STORES.MONTHS),
      clearStore(STORES.MEMBERS),
      clearStore(STORES.MEALS),
      clearStore(STORES.EXPENSES),
      clearStore(STORES.PAYMENTS),
      clearStore(STORES.SETTINGS),
      clearStore(STORES.ACTIVITIES),
    ]);

    // Restore data
    if (Array.isArray(months) && months.length > 0) await putManyToStore(STORES.MONTHS, months);
    if (Array.isArray(members) && members.length > 0) await putManyToStore(STORES.MEMBERS, members);
    if (Array.isArray(meals) && meals.length > 0) await putManyToStore(STORES.MEALS, meals);
    if (Array.isArray(expenses) && expenses.length > 0)
      await putManyToStore(STORES.EXPENSES, expenses);
    if (Array.isArray(payments) && payments.length > 0)
      await putManyToStore(STORES.PAYMENTS, payments);
    if (settings) await putToStore(STORES.SETTINGS, settings);
    if (Array.isArray(activities) && activities.length > 0)
      await putManyToStore(STORES.ACTIVITIES, activities);

    return true;
  } catch (err) {
    console.error('Import error:', err);
    throw err;
  }
}

export async function clearAllData(): Promise<void> {
  await Promise.all([
    clearStore(STORES.MONTHS),
    clearStore(STORES.MEMBERS),
    clearStore(STORES.MEALS),
    clearStore(STORES.EXPENSES),
    clearStore(STORES.PAYMENTS),
    clearStore(STORES.ACTIVITIES),
  ]);
  // Reset settings
  await putToStore(STORES.SETTINGS, DEFAULT_SETTINGS);
}
