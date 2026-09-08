"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

export function LoginSuccessToast() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const hasTriggeredRef = useRef(false);

  useEffect(() => {
    if (searchParams.get("login") !== "success") return;
    if (hasTriggeredRef.current) return;
    hasTriggeredRef.current = true;

    // Use fixed ID to prevent Sonner duplicate toast stacking
    toast.success("Đăng nhập thành công", { id: "login-success-toast" });

    // Clean up query param immediately to avoid re-triggering across renders
    const url = new URL(window.location.href);
    url.searchParams.delete("login");
    window.history.replaceState({}, "", url.pathname + (url.search ? url.search : ""));

    const next = new URLSearchParams(searchParams.toString());
    next.delete("login");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }, [searchParams, router, pathname]);

  return null;
}
