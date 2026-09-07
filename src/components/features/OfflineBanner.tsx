"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CloudUpload, WifiOff } from "lucide-react";
import { toast } from "sonner";
import { ORDERS_QUERY_KEY } from "@/app/(private)/don-hang/order-query";
import { CUSTOMERS_QUERY_KEY } from "@/app/(private)/khach-hang/customer-query";
import { PRODUCTS_QUERY_KEY } from "@/app/(private)/san-pham/product-query";
import { syncPendingOfflineOrders } from "@/lib/sync-offline-orders";
import { countPendingOfflineOrders } from "@/store/offlineDB";
import { Button } from "@/components/ui/button";

export function OfflineBanner() {
  const queryClient = useQueryClient();
  const [online, setOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, startSync] = useTransition();
  const syncingRef = useRef(false);

  const refreshPending = useCallback(async () => {
    try {
      const count = await countPendingOfflineOrders();
      setPendingCount(count);
      return count;
    } catch {
      setPendingCount(0);
      return 0;
    }
  }, []);

  const runSync = useCallback(
    (opts?: { silentEmpty?: boolean }) => {
      if (syncingRef.current) return;
      syncingRef.current = true;

      startSync(async () => {
        try {
          const result = await syncPendingOfflineOrders();
          await refreshPending();

          if (result.attempted === 0) {
            if (!opts?.silentEmpty) {
              toast.message("Không còn đơn offline cần đồng bộ.");
            }
            return;
          }

          if (result.synced > 0) {
            toast.success(`Đã đồng bộ ${result.synced} đơn offline.`);
            await Promise.all([
              queryClient.invalidateQueries({ queryKey: ORDERS_QUERY_KEY }),
              queryClient.invalidateQueries({ queryKey: CUSTOMERS_QUERY_KEY }),
              queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY }),
            ]);
          }

          if (result.failed > 0) {
            toast.error(
              `Không đồng bộ được ${result.failed} đơn. ${result.errors[0] ?? ""}`,
            );
          }
        } finally {
          syncingRef.current = false;
        }
      });
    },
    [queryClient, refreshPending],
  );

  useEffect(() => {
    const updateOnline = () => setOnline(navigator.onLine);
    updateOnline();
    void refreshPending();

    const onOnline = () => {
      setOnline(true);
      void (async () => {
        const count = await refreshPending();
        if (count > 0) runSync({ silentEmpty: true });
      })();
    };
    const onOffline = () => setOnline(false);

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        void refreshPending();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    const interval = window.setInterval(() => {
      void refreshPending();
    }, 10_000);

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      document.removeEventListener("visibilitychange", onVisibility);
      window.clearInterval(interval);
    };
  }, [refreshPending, runSync]);

  if (online && pendingCount === 0) {
    return null;
  }

  if (!online) {
    return (
      <div
        role="status"
        className="flex w-full flex-wrap items-center justify-center gap-2 bg-amber-500/15 px-4 py-2 text-center text-sm text-amber-900 dark:text-amber-100"
      >
        <WifiOff className="size-4 shrink-0" aria-hidden />
        <span>
          Bạn đang offline. Đơn mới sẽ lưu tạm trên máy
          {pendingCount > 0 ? ` (${pendingCount} chờ đồng bộ)` : ""}.
        </span>
      </div>
    );
  }

  return (
    <div
      role="status"
      className="flex w-full flex-wrap items-center justify-center gap-3 bg-sky-500/10 px-4 py-2 text-center text-sm text-sky-900 dark:text-sky-100"
    >
      <span>Có {pendingCount} đơn offline chờ đồng bộ lên server.</span>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="h-8 gap-1.5"
        disabled={syncing}
        onClick={() => runSync()}
      >
        <CloudUpload className="size-3.5" aria-hidden />
        {syncing ? "Đang đồng bộ..." : "Đồng bộ ngay"}
      </Button>
    </div>
  );
}
