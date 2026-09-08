import Dexie, { type Table } from 'dexie';
import { Customer, Product, Order } from '../types';
import { INITIAL_CUSTOMERS, INITIAL_PRODUCTS } from '../mockData';

export interface OfflineCollection {
  id: string;
  customerId: string;
  customerName: string;
  amount: number;
  collectedAt: string;
  note?: string;
  synced: boolean;
}

export class PetrolubricantOfflineDB extends Dexie {
  offline_customers!: Table<Customer, string>;
  offline_products!: Table<Product, string>;
  offline_orders!: Table<Order, string>;
  offline_collections!: Table<OfflineCollection, string>;

  constructor() {
    super('PetrolubricantOfflineDB');
    this.version(1).stores({
      offline_customers: 'id, name, type, route, creditLimit, currentDebt',
      offline_products: 'id, name, sku, category, packageType',
      offline_orders: 'id, customerId, status, createdAt',
      offline_collections: 'id, customerId, collectedAt, synced',
    });
  }
}

export const offlineDb = new PetrolubricantOfflineDB();

// Seed initial database if empty
export async function seedOfflineDatabase(): Promise<void> {
  try {
    const custCount = await offlineDb.offline_customers.count();
    if (custCount === 0) {
      await offlineDb.offline_customers.bulkPut(INITIAL_CUSTOMERS);
    }

    const prodCount = await offlineDb.offline_products.count();
    if (prodCount === 0) {
      await offlineDb.offline_products.bulkPut(INITIAL_PRODUCTS);
    }
  } catch (err) {
    console.warn('Error seeding Dexie database:', err);
  }
}

// Queue offline order
export async function enqueueOfflineOrder(order: Order): Promise<void> {
  try {
    await offlineDb.offline_orders.put(order);
  } catch (err) {
    console.warn('Error queuing offline order in Dexie:', err);
  }
}

// Get all queued offline orders
export async function getQueuedOfflineOrders(): Promise<Order[]> {
  try {
    return await offlineDb.offline_orders.toArray();
  } catch (err) {
    console.warn('Error getting offline orders:', err);
    return [];
  }
}

// Remove synced order
export async function removeSyncedOfflineOrder(orderId: string): Promise<void> {
  try {
    await offlineDb.offline_orders.delete(orderId);
  } catch (err) {
    console.warn('Error removing synced offline order:', err);
  }
}

// Clear all synced orders
export async function clearAllOfflineOrders(): Promise<void> {
  try {
    await offlineDb.offline_orders.clear();
  } catch (err) {
    console.warn('Error clearing offline orders:', err);
  }
}

// Save offline cash collection
export async function recordOfflineCollection(collection: OfflineCollection): Promise<void> {
  try {
    await offlineDb.offline_collections.put(collection);
  } catch (err) {
    console.warn('Error saving offline collection:', err);
  }
}

export async function getOfflineCollections(): Promise<OfflineCollection[]> {
  try {
    return await offlineDb.offline_collections.toArray();
  } catch (err) {
    return [];
  }
}
