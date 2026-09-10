import Dexie, { type Table } from 'dexie';
import { Customer, Product, Order } from '../types';

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

/**
 * Đồng bộ danh mục khách hàng & sản phẩm thực tế từ Database PostgreSQL vào Dexie IndexedDB
 * (Loại bỏ 100% dữ liệu mock, đảm bảo tính bền vững và đồng nhất dữ liệu)
 */
export async function syncOfflineDatabase(customers?: Customer[], products?: Product[]): Promise<void> {
  try {
    if (customers && customers.length > 0) {
      await offlineDb.offline_customers.clear();
      await offlineDb.offline_customers.bulkPut(customers);
    }

    if (products && products.length > 0) {
      await offlineDb.offline_products.clear();
      await offlineDb.offline_products.bulkPut(products);
    }
  } catch (err) {
    console.warn('Error syncing Dexie database from PostgreSQL:', err);
  }
}

/** Tương thích ngược: Đồng bộ dữ liệu thực tế thay vì nạp mock data */
export async function seedOfflineDatabase(customers?: Customer[], products?: Product[]): Promise<void> {
  return syncOfflineDatabase(customers, products);
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
