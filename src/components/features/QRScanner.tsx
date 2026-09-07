"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, CameraOff } from "lucide-react";
import { Button } from "@/components/ui/button";

type QRScannerProps = {
  onScan: (text: string) => void;
  disabled?: boolean;
};

const REGION_ID = "loyalty-qr-reader";

export function QRScanner({ onScan, disabled = false }: QRScannerProps) {
  const [active, setActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastScanRef = useRef<string>("");
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  useEffect(() => {
    return () => {
      const scanner = scannerRef.current;
      if (scanner?.isScanning) {
        void scanner.stop().catch(() => undefined);
      }
      scannerRef.current = null;
    };
  }, []);

  async function start() {
    setError(null);
    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(REGION_ID);
      }
      const scanner = scannerRef.current;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 8, qrbox: { width: 240, height: 240 } },
        (decoded) => {
          const text = decoded.trim();
          if (!text || text === lastScanRef.current) return;
          lastScanRef.current = text;
          onScanRef.current(text);
          window.setTimeout(() => {
            if (lastScanRef.current === text) lastScanRef.current = "";
          }, 2500);
        },
        () => undefined,
      );
      setActive(true);
    } catch (err) {
      setActive(false);
      setError(
        err instanceof Error
          ? err.message
          : "Không mở được camera. Hãy dùng nhập mã tay.",
      );
    }
  }

  async function stop() {
    const scanner = scannerRef.current;
    if (scanner?.isScanning) {
      try {
        await scanner.stop();
      } catch {
        // ignore
      }
    }
    setActive(false);
  }

  return (
    <div className="space-y-3">
      <div
        id={REGION_ID}
        className="overflow-hidden rounded-lg border border-border bg-muted/20 [&_video]:max-h-[320px] [&_video]:w-full [&_video]:object-cover"
      />
      <div className="flex flex-wrap gap-2">
        {!active ? (
          <Button
            type="button"
            className="gap-1.5"
            disabled={disabled}
            onClick={() => void start()}
          >
            <Camera className="size-4" aria-hidden />
            Bật camera quét QR
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            className="gap-1.5"
            onClick={() => void stop()}
          >
            <CameraOff className="size-4" aria-hidden />
            Tắt camera
          </Button>
        )}
      </div>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          Định dạng mã: <code className="rounded bg-muted px-1">LOYALTY:BOTTLE-001</code>{" "}
          hoặc <code className="rounded bg-muted px-1">BOTTLE-001</code>
        </p>
      )}
    </div>
  );
}
