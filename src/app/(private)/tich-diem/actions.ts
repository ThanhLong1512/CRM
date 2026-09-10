"use server";

import { revalidatePath } from "next/cache";
import { PointLedgerReason } from "@prisma/client";
import { normalizeLoyaltyCode } from "@/lib/loyalty-code";
import { prisma } from "@/lib/prisma";
import { requireRoles } from "@/lib/auth";

export type LoyaltyActionResult = {
  success: boolean;
  message: string;
  error?: string;
  mechanicId?: string;
  points?: number;
  awarded?: number;
};

function fail(message: string): LoyaltyActionResult {
  return { success: false, message, error: message };
}

function ok(
  message: string,
  extra?: { mechanicId?: string; points?: number; awarded?: number },
): LoyaltyActionResult {
  return { success: true, message, ...extra };
}

export async function findOrCreateMechanic(input: {
  name: string;
  phone: string;
}): Promise<LoyaltyActionResult> {
  try {
    await requireRoles(["ADMIN", "SALES", "DEALER"]);
  } catch (authErr: any) {
    return fail(authErr.message);
  }

  const name = String(input.name ?? "").trim();
  const phone = String(input.phone ?? "").trim().replace(/\s+/g, "");

  if (!phone) {
    return fail("Vui lòng nhập số điện thoại thợ.");
  }
  if (!name) {
    return fail("Vui lòng nhập tên thợ.");
  }

  try {
    const existing = await prisma.mechanic.findUnique({ where: { phone } });
    if (existing) {
      const updated = await prisma.mechanic.update({
        where: { id: existing.id },
        data: { name },
      });
      revalidatePath("/tich-diem");
      return ok("Đã chọn thợ hiện có.", {
        mechanicId: updated.id,
        points: updated.points,
      });
    }

    const created = await prisma.mechanic.create({
      data: { name, phone },
    });
    revalidatePath("/tich-diem");
    return ok("Đã tạo hồ sơ thợ mới.", {
      mechanicId: created.id,
      points: created.points,
    });
  } catch (error) {
    return fail(
      error instanceof Error
        ? error.message
        : "Không thể lưu thợ. Vui lòng thử lại.",
    );
  }
}

export async function scanLoyaltyCode(input: {
  code: string;
  mechanicId: string;
}): Promise<LoyaltyActionResult> {
  try {
    await requireRoles(["ADMIN", "SALES", "DEALER"]);
  } catch (authErr: any) {
    return fail(authErr.message);
  }

  const mechanicId = String(input.mechanicId ?? "").trim();
  const code = normalizeLoyaltyCode(input.code);

  if (!mechanicId) {
    return fail("Vui lòng chọn / tạo thợ trước khi quét.");
  }
  if (!code) {
    return fail("Mã QR trống.");
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const mechanic = await tx.mechanic.findUnique({
        where: { id: mechanicId },
      });
      if (!mechanic) {
        throw new Error("Không tìm thấy thợ.");
      }

      const loyalty = await tx.loyaltyCode.findUnique({ where: { code } });
      if (!loyalty) {
        throw new Error(`Mã không hợp lệ: ${code}`);
      }
      if (loyalty.redeemedAt) {
        throw new Error(`Mã ${code} đã được sử dụng trước đó.`);
      }

      const updatedCode = await tx.loyaltyCode.update({
        where: { id: loyalty.id },
        data: {
          redeemedAt: new Date(),
          mechanicId: mechanic.id,
        },
      });

      const updatedMechanic = await tx.mechanic.update({
        where: { id: mechanic.id },
        data: { points: { increment: loyalty.points } },
      });

      await tx.pointLedger.create({
        data: {
          mechanicId: mechanic.id,
          delta: loyalty.points,
          reason: PointLedgerReason.SCAN,
          refId: updatedCode.id,
          note: `Quét mã ${code}${loyalty.productSku ? ` (${loyalty.productSku})` : ""}`,
        },
      });

      return {
        mechanic: updatedMechanic,
        awarded: loyalty.points,
        code,
      };
    });

    revalidatePath("/tich-diem");
    return ok(`Đã tích +${result.awarded} điểm từ mã ${result.code}.`, {
      mechanicId: result.mechanic.id,
      points: result.mechanic.points,
      awarded: result.awarded,
    });
  } catch (error) {
    return fail(
      error instanceof Error
        ? error.message
        : "Không thể tích điểm. Vui lòng thử lại.",
    );
  }
}

export async function redeemReward(input: {
  mechanicId: string;
  rewardId: string;
}): Promise<LoyaltyActionResult> {
  try {
    await requireRoles(["ADMIN", "SALES", "DEALER"]);
  } catch (authErr: any) {
    return fail(authErr.message);
  }

  const mechanicId = String(input.mechanicId ?? "").trim();
  const rewardId = String(input.rewardId ?? "").trim();

  if (!mechanicId) {
    return fail("Vui lòng chọn thợ.");
  }
  if (!rewardId) {
    return fail("Vui lòng chọn phần quà.");
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const mechanic = await tx.mechanic.findUnique({
        where: { id: mechanicId },
      });
      if (!mechanic) {
        throw new Error("Không tìm thấy thợ.");
      }

      const reward = await tx.loyaltyReward.findUnique({
        where: { id: rewardId },
      });
      if (!reward || !reward.active) {
        throw new Error("Phần quà không khả dụng.");
      }
      if (reward.stock <= 0) {
        throw new Error(`“${reward.name}” đã hết tồn.`);
      }
      if (mechanic.points < reward.pointsCost) {
        throw new Error(
          `Không đủ điểm (cần ${reward.pointsCost}, đang có ${mechanic.points}).`,
        );
      }

      const updatedMechanic = await tx.mechanic.update({
        where: { id: mechanic.id },
        data: { points: { decrement: reward.pointsCost } },
      });

      await tx.loyaltyReward.update({
        where: { id: reward.id },
        data: { stock: { decrement: 1 } },
      });

      const redemption = await tx.rewardRedemption.create({
        data: {
          mechanicId: mechanic.id,
          rewardId: reward.id,
          pointsSpent: reward.pointsCost,
        },
      });

      await tx.pointLedger.create({
        data: {
          mechanicId: mechanic.id,
          delta: -reward.pointsCost,
          reason: PointLedgerReason.REDEEM,
          refId: redemption.id,
          note: `Đổi quà: ${reward.name}`,
        },
      });

      return { mechanic: updatedMechanic, rewardName: reward.name };
    });

    revalidatePath("/tich-diem");
    return ok(`Đã đổi “${result.rewardName}” thành công.`, {
      mechanicId: result.mechanic.id,
      points: result.mechanic.points,
    });
  } catch (error) {
    return fail(
      error instanceof Error
        ? error.message
        : "Không thể đổi quà. Vui lòng thử lại.",
    );
  }
}
