"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { CHECK_IN_MAX_DISTANCE_M, haversineMeters } from "@/lib/geo";
import { getSessionDbUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type CheckInActionResult = {
  success: boolean;
  message: string;
  error?: string;
  distanceM?: number;
};

function fail(message: string): CheckInActionResult {
  return { success: false, message, error: message };
}

function ok(message: string, distanceM: number): CheckInActionResult {
  return { success: true, message, distanceM };
}

export async function createCheckIn(input: {
  customerId: string;
  lat: number;
  lng: number;
}): Promise<CheckInActionResult> {
  const { dbUser } = await getSessionDbUser();
  if (!dbUser) {
    return fail("Bạn cần đăng nhập để check-in.");
  }

  const customerId = String(input.customerId ?? "").trim();
  if (!customerId) {
    return fail("Vui lòng chọn khách hàng.");
  }

  const lat = Number(input.lat);
  const lng = Number(input.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return fail("Tọa độ GPS không hợp lệ.");
  }
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return fail("Tọa độ GPS nằm ngoài phạm vi cho phép.");
  }

  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: {
      id: true,
      name: true,
      lat: true,
      lng: true,
    },
  });

  if (!customer) {
    return fail("Không tìm thấy khách hàng.");
  }
  if (customer.lat == null || customer.lng == null) {
    return fail("Khách hàng chưa có tọa độ GPS trên hệ thống.");
  }

  const customerLat = Number(customer.lat);
  const customerLng = Number(customer.lng);
  const distanceM = haversineMeters(lat, lng, customerLat, customerLng);

  if (distanceM > CHECK_IN_MAX_DISTANCE_M) {
    return fail(
      `Quá xa điểm khách hàng (${Math.round(distanceM)}m). Cần đứng trong bán kính ${CHECK_IN_MAX_DISTANCE_M}m để check-in.`,
    );
  }

  try {
    await prisma.visitCheckIn.create({
      data: {
        customerId,
        userId: dbUser.id,
        lat: new Prisma.Decimal(lat),
        lng: new Prisma.Decimal(lng),
        distanceM,
      },
    });
  } catch (error) {
    return fail(
      error instanceof Error
        ? error.message
        : "Không thể lưu check-in. Vui lòng thử lại.",
    );
  }

  revalidatePath("/sales");
  return ok(
    `Check-in thành công tại “${customer.name}” (cách ${Math.round(distanceM)}m).`,
    distanceM,
  );
}
