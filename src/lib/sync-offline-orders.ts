"use client";

import { createOrder } from "@/app/(private)/don-hang/actions";
import {
  listPendingOfflineOrders,
  markOfflineOrderError,
  markOfflineOrderSynced,
  parseOfflineItems,
} from "@/store/offlineDB";

export type SyncOfflineResult = {
  attempted: number;
  synced: number;
  failed: number;
  errors: string[];
};

export async function syncPendingOfflineOrders(): Promise<SyncOfflineResult> {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return { attempted: 0, synced: 0, failed: 0, errors: ["Đang offline."] };
  }

  const pending = await listPendingOfflineOrders();
  let synced = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const row of pending) {
    const items = parseOfflineItems(row);
    if (items.length === 0) {
      failed += 1;
      const message = "Đơn offline không có sản phẩm hợp lệ.";
      errors.push(`${row.customerName}: ${message}`);
      await markOfflineOrderError(row.localId, message);
      continue;
    }

    const result = await createOrder({
      customerId: row.customerId,
      items,
      localId: row.localId,
    });

    if (!result.success) {
      failed += 1;
      const message = result.error ?? result.message;
      errors.push(`${row.customerName}: ${message}`);
      await markOfflineOrderError(row.localId, message);
      continue;
    }

    await markOfflineOrderSynced(row.localId);
    synced += 1;
  }

  return {
    attempted: pending.length,
    synced,
    failed,
    errors,
  };
}
