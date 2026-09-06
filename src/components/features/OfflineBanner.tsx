"use client";

/**
 * Offline connectivity banner stub (pair with navigator.onLine / Dexie sync).
 */
export function OfflineBanner() {
  return (
    <div
      role="status"
      className="hidden w-full bg-amber-500/15 px-4 py-2 text-center text-sm text-amber-800 dark:text-amber-200"
      data-offline-banner
    >
      You are offline. Changes will sync when connection is restored.
    </div>
  );
}
