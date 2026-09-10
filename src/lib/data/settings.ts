import { prisma } from "@/lib/prisma";

export type SystemSettingDto = {
  id: string;
  companyName: string;
  hotline: string;
  centralWarehouseAddress: string;
  vatRatePercent: number;
  geofenceRadiusMeters: number;
  gpsAccuracyThresholdMeters: number;
  requirePhotoAtCheckin: boolean;
  defaultCreditLimit: number;
  overdueWarningDays: number;
  creditLockOverdueDays: number;
  drumDepositPrice: number;
  maxDrumHoldDays: number;
  loyaltyPointConversionRate: number;
  rewardPointsPerDrum: number;
  offlineAutoSyncIntervalMin: number;
  updatedBy?: string | null;
  createdAt: string;
  updatedAt: string;
};

export const DEFAULT_SYSTEM_SETTINGS = {
  companyName: "Công Ty TNHH Phân Phối Dầu Nhớt Remix Petro",
  hotline: "1900 6868",
  centralWarehouseAddress: "Kho Tổng QL1A, Huyện Bình Chánh, TP. Hồ Chí Minh",
  vatRatePercent: 8,
  geofenceRadiusMeters: 50,
  gpsAccuracyThresholdMeters: 30,
  requirePhotoAtCheckin: true,
  defaultCreditLimit: 100000000,
  overdueWarningDays: 30,
  creditLockOverdueDays: 45,
  drumDepositPrice: 400000,
  maxDrumHoldDays: 45,
  loyaltyPointConversionRate: 10000,
  rewardPointsPerDrum: 20,
  offlineAutoSyncIntervalMin: 5,
};

/**
 * Lấy cấu hình hệ thống từ Database, nếu chưa có thì tự động khởi tạo mặc định.
 */
export async function getSystemSettings(): Promise<SystemSettingDto> {
  let record = await prisma.systemSetting.findUnique({
    where: { id: "default" },
  });

  if (!record) {
    record = await prisma.systemSetting.create({
      data: {
        id: "default",
        ...DEFAULT_SYSTEM_SETTINGS,
      },
    });
  }

  return {
    id: record.id,
    companyName: record.companyName,
    hotline: record.hotline,
    centralWarehouseAddress: record.centralWarehouseAddress,
    vatRatePercent: record.vatRatePercent,
    geofenceRadiusMeters: record.geofenceRadiusMeters,
    gpsAccuracyThresholdMeters: record.gpsAccuracyThresholdMeters,
    requirePhotoAtCheckin: record.requirePhotoAtCheckin,
    defaultCreditLimit: Number(record.defaultCreditLimit),
    overdueWarningDays: record.overdueWarningDays,
    creditLockOverdueDays: record.creditLockOverdueDays,
    drumDepositPrice: Number(record.drumDepositPrice),
    maxDrumHoldDays: record.maxDrumHoldDays,
    loyaltyPointConversionRate: Number(record.loyaltyPointConversionRate),
    rewardPointsPerDrum: record.rewardPointsPerDrum,
    offlineAutoSyncIntervalMin: record.offlineAutoSyncIntervalMin,
    updatedBy: record.updatedBy,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

/**
 * Cập nhật cấu hình hệ thống vào Database (Upsert).
 */
export async function updateSystemSettings(
  input: Partial<typeof DEFAULT_SYSTEM_SETTINGS>,
  updatedBy?: string
): Promise<SystemSettingDto> {
  const record = await prisma.systemSetting.upsert({
    where: { id: "default" },
    update: {
      ...input,
      updatedBy: updatedBy || null,
    },
    create: {
      id: "default",
      ...DEFAULT_SYSTEM_SETTINGS,
      ...input,
      updatedBy: updatedBy || null,
    },
  });

  return {
    id: record.id,
    companyName: record.companyName,
    hotline: record.hotline,
    centralWarehouseAddress: record.centralWarehouseAddress,
    vatRatePercent: record.vatRatePercent,
    geofenceRadiusMeters: record.geofenceRadiusMeters,
    gpsAccuracyThresholdMeters: record.gpsAccuracyThresholdMeters,
    requirePhotoAtCheckin: record.requirePhotoAtCheckin,
    defaultCreditLimit: Number(record.defaultCreditLimit),
    overdueWarningDays: record.overdueWarningDays,
    creditLockOverdueDays: record.creditLockOverdueDays,
    drumDepositPrice: Number(record.drumDepositPrice),
    maxDrumHoldDays: record.maxDrumHoldDays,
    loyaltyPointConversionRate: Number(record.loyaltyPointConversionRate),
    rewardPointsPerDrum: record.rewardPointsPerDrum,
    offlineAutoSyncIntervalMin: record.offlineAutoSyncIntervalMin,
    updatedBy: record.updatedBy,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

/**
 * Khôi phục cấu hình hệ thống về mặc định trong Database.
 */
export async function resetSystemSettings(updatedBy?: string): Promise<SystemSettingDto> {
  return updateSystemSettings(DEFAULT_SYSTEM_SETTINGS, updatedBy);
}
