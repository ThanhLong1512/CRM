import Dexie, { type EntityTable } from "dexie";

export type OfflineOrderPayload = {
  customerId: string;
  items: { productId: string; quantity: number }[];
  customerName?: string;
};

export type OfflineOrder = {
  id?: number;
  localId: string;
  customerId: string;
  customerName: string;
  itemsJson: string;
  createdAt: string;
  syncedAt: string | null;
  lastError: string | null;
};

class OfflineDatabase extends Dexie {
  orders!: EntityTable<OfflineOrder, "id">;

  constructor() {
    super("crm-dauan-offline");
    this.version(1).stores({
      orders: "++id, localId, createdAt, syncedAt",
    });
    // v2: structured fields for sync UI
    this.version(2).stores({
      orders: "++id, localId, customerId, createdAt, syncedAt",
    });
  }
}

export const offlineDB = new OfflineDatabase();

export function createLocalId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `local_${crypto.randomUUID()}`;
  }
  return `local_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export async function enqueueOfflineOrder(input: {
  customerId: string;
  customerName: string;
  items: { productId: string; quantity: number }[];
}): Promise<OfflineOrder> {
  const localId = createLocalId();
  const row: OfflineOrder = {
    localId,
    customerId: input.customerId,
    customerName: input.customerName,
    itemsJson: JSON.stringify(input.items),
    createdAt: new Date().toISOString(),
    syncedAt: null,
    lastError: null,
  };
  const id = await offlineDB.orders.add(row);
  return { ...row, id: Number(id) };
}

export async function listPendingOfflineOrders(): Promise<OfflineOrder[]> {
  return offlineDB.orders
    .filter((row) => row.syncedAt == null)
    .sortBy("createdAt");
}

export async function countPendingOfflineOrders(): Promise<number> {
  return offlineDB.orders.filter((row) => row.syncedAt == null).count();
}

export async function markOfflineOrderSynced(localId: string): Promise<void> {
  const row = await offlineDB.orders.where("localId").equals(localId).first();
  if (!row?.id) return;
  await offlineDB.orders.update(row.id, {
    syncedAt: new Date().toISOString(),
    lastError: null,
  });
}

export async function markOfflineOrderError(
  localId: string,
  error: string,
): Promise<void> {
  const row = await offlineDB.orders.where("localId").equals(localId).first();
  if (!row?.id) return;
  await offlineDB.orders.update(row.id, { lastError: error });
}

export function parseOfflineItems(
  row: OfflineOrder,
): { productId: string; quantity: number }[] {
  try {
    const parsed = JSON.parse(row.itemsJson) as {
      productId: string;
      quantity: number;
    }[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
