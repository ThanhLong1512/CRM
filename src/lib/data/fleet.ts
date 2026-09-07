import { prisma } from "@/lib/prisma";
import { computeFleetStatus, type FleetAlertLevel } from "@/lib/fleet-status";

export type FleetVehicleDto = {
  id: string;
  customerId: string;
  customerName: string;
  plateNumber: string;
  label: string | null;
  unit: "KM" | "HOUR";
  currentMeter: number;
  lastServiceMeter: number;
  intervalValue: number;
  notes: string | null;
  remaining: number;
  percent: number;
  level: FleetAlertLevel;
  overdue: boolean;
  createdAt: string;
  updatedAt: string;
};

export async function listFleetVehicles(): Promise<FleetVehicleDto[]> {
  const rows = await prisma.fleetVehicle.findMany({
    orderBy: { plateNumber: "asc" },
    include: {
      customer: { select: { id: true, name: true, type: true } },
    },
  });

  return rows.map((row) => {
    const status = computeFleetStatus(row);
    return {
      id: row.id,
      customerId: row.customerId,
      customerName: row.customer.name,
      plateNumber: row.plateNumber,
      label: row.label,
      unit: row.unit,
      currentMeter: row.currentMeter,
      lastServiceMeter: row.lastServiceMeter,
      intervalValue: row.intervalValue,
      notes: row.notes,
      remaining: status.remaining,
      percent: status.percent,
      level: status.level,
      overdue: status.overdue,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  });
}

export async function listFleetCustomers() {
  return prisma.customer.findMany({
    where: { type: "FLEET" },
    orderBy: { name: "asc" },
    select: { id: true, name: true, phone: true },
  });
}
