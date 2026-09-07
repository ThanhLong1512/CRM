export type FleetAlertLevel = "GREEN" | "YELLOW" | "RED";

export type FleetMeterInput = {
  currentMeter: number;
  lastServiceMeter: number;
  intervalValue: number;
};

export type FleetStatus = {
  usedSinceService: number;
  remaining: number;
  percent: number;
  level: FleetAlertLevel;
  overdue: boolean;
};

export function computeFleetStatus(vehicle: FleetMeterInput): FleetStatus {
  const interval = Math.max(1, vehicle.intervalValue);
  const usedSinceService = Math.max(
    0,
    vehicle.currentMeter - vehicle.lastServiceMeter,
  );
  const remainingRaw = interval - usedSinceService;
  const remaining = remainingRaw;
  const percent = Math.max(0, Math.min(100, (remainingRaw / interval) * 100));
  const overdue = remainingRaw <= 0;

  let level: FleetAlertLevel = "GREEN";
  if (percent <= 10 || overdue) {
    level = "RED";
  } else if (percent <= 25) {
    level = "YELLOW";
  }

  return {
    usedSinceService,
    remaining,
    percent,
    level,
    overdue,
  };
}

export function fleetLevelLabel(level: FleetAlertLevel): string {
  switch (level) {
    case "RED":
      return "Đỏ — cần thay nhớt";
    case "YELLOW":
      return "Vàng — sắp đến hạn";
    default:
      return "Xanh — ổn định";
  }
}
