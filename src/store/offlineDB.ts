import Dexie, { type EntityTable } from "dexie";

export type OfflineOrder = {
  id?: number;
  localId: string;
  payload: string;
  createdAt: string;
  syncedAt: string | null;
};

/**
 * Placeholder Dexie database for offline-first order drafts.
 */
class OfflineDatabase extends Dexie {
  orders!: EntityTable<OfflineOrder, "id">;

  constructor() {
    super("crm-dauan-offline");
    this.version(1).stores({
      orders: "++id, localId, createdAt, syncedAt",
    });
  }
}

export const offlineDB = new OfflineDatabase();
