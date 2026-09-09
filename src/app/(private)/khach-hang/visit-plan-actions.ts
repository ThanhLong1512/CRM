"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  formatVisitDateLocal,
  parseVisitDateLocal,
} from "@/lib/visit-plan";

export type VisitPlanActionResult = {
  success: boolean;
  message: string;
  error?: string;
  planId?: string;
  visitDate?: string;
};

function fail(message: string): VisitPlanActionResult {
  return { success: false, message, error: message };
}

function ok(
  message: string,
  extras?: { planId?: string; visitDate?: string },
): VisitPlanActionResult {
  return { success: true, message, ...extras };
}

export async function addCustomerVisitDate(input: {
  customerId: string;
  visitDate: string;
  note?: string;
}): Promise<VisitPlanActionResult> {
  const customerId = String(input.customerId ?? "").trim();
  if (!customerId) {
    return fail("Thiếu mã khách hàng.");
  }

  const parsed = parseVisitDateLocal(input.visitDate);
  if (!parsed) {
    return fail("Ngày ghé không hợp lệ (YYYY-MM-DD).");
  }

  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: { id: true, name: true },
  });
  if (!customer) {
    return fail("Không tìm thấy khách hàng.");
  }

  try {
    const plan = await prisma.customerVisitPlan.create({
      data: {
        customerId,
        visitDate: parsed,
        note: input.note?.trim() || null,
      },
    });

    revalidatePath("/khach-hang");
    revalidatePath("/sales");
    return ok(
      `Đã thêm lịch ghé ${formatVisitDateLocal(parsed)} cho “${customer.name}”.`,
      {
        planId: plan.id,
        visitDate: formatVisitDateLocal(parsed),
      },
    );
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return fail("Khách hàng đã có lịch ghé vào ngày này.");
    }
    return fail(
      error instanceof Error
        ? error.message
        : "Không thể thêm ngày ghé. Vui lòng thử lại.",
    );
  }
}

export async function removeCustomerVisitDate(input: {
  planId?: string;
  customerId?: string;
  visitDate?: string;
}): Promise<VisitPlanActionResult> {
  const planId = String(input.planId ?? "").trim();
  const customerId = String(input.customerId ?? "").trim();
  const visitDateRaw = String(input.visitDate ?? "").trim();

  try {
    if (planId) {
      await prisma.customerVisitPlan.delete({ where: { id: planId } });
    } else if (customerId && visitDateRaw) {
      const parsed = parseVisitDateLocal(visitDateRaw);
      if (!parsed) {
        return fail("Ngày ghé không hợp lệ.");
      }
      const deleted = await prisma.customerVisitPlan.deleteMany({
        where: { customerId, visitDate: parsed },
      });
      if (deleted.count === 0) {
        return fail("Không tìm thấy lịch ghé để xóa.");
      }
    } else {
      return fail("Thiếu thông tin lịch ghé cần xóa.");
    }

    revalidatePath("/khach-hang");
    revalidatePath("/sales");
    return ok("Đã xóa ngày ghé khỏi lịch.");
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return fail("Không tìm thấy lịch ghé.");
    }
    return fail(
      error instanceof Error
        ? error.message
        : "Không thể xóa ngày ghé. Vui lòng thử lại.",
    );
  }
}
