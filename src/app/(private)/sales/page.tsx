import { QRScanner } from "@/components/features/QRScanner";

export default function SalesPage() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Sales</h1>
        <p className="text-muted-foreground">
          Order capture and QR scanning placeholder.
        </p>
      </div>
      <QRScanner />
    </div>
  );
}
