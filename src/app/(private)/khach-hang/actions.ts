"use server";

import { revalidatePath } from "next/cache";
import {
  Prisma,
  type CustomerType,
  type VisitDayOfWeek,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRoles } from "@/lib/auth";

export type CustomerActionResult = {
  success: boolean;
  message: string;
  error?: string;
};

type ParsedCustomerInput = {
  name: string;
  phone: string | null;
  address: string | null;
  type: CustomerType;
  creditLimit: number;
  creditTermDays: number;
  lat: number | null;
  lng: number | null;
  visitDay: VisitDayOfWeek | null;
  visitDays?: string | null;
};

const CUSTOMER_TYPES: CustomerType[] = ["GARAGE", "FLEET"];
const VISIT_DAYS: VisitDayOfWeek[] = ["T2", "T3", "T4", "T5", "T6", "T7"];

function parseOptionalCoord(
  raw: string,
  label: string,
): { value: number | null } | { error: string } {
  if (raw === "") {
    return { value: null };
  }
  const value = Number(raw);
  if (!Number.isFinite(value)) {
    return { error: `${label} không hợp lệ.` };
  }
  return { value };
}

function parseCustomerFormData(
  formData: FormData,
): { data: ParsedCustomerInput } | { error: string } {
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const typeRaw = String(formData.get("type") ?? "").trim().toUpperCase();
  const creditLimitRaw = String(formData.get("creditLimit") ?? "").trim();
  const creditTermDaysRaw = String(formData.get("creditTermDays") ?? "").trim();
  const latRaw = String(formData.get("lat") ?? "").trim();
  const lngRaw = String(formData.get("lng") ?? "").trim();
  const visitDayRaw = String(formData.get("visitDay") ?? "").trim().toUpperCase();
  const visitDaysRaw = String(formData.get("visitDays") ?? "").trim();

  if (!name) {
    return { error: "Vui lòng nhập tên khách hàng." };
  }

  if (!CUSTOMER_TYPES.includes(typeRaw as CustomerType)) {
    return { error: "Phân loại phải là GARAGE hoặc FLEET." };
  }

  const creditLimit = Number(creditLimitRaw || "0");
  if (!Number.isFinite(creditLimit) || creditLimit < 0) {
    return { error: "Hạn mức công nợ không hợp lệ." };
  }

  const creditTermDays = creditTermDaysRaw ? Math.max(1, Number(creditTermDaysRaw)) : 30;
  if (!Number.isFinite(creditTermDays)) {
    return { error: "Thời hạn công nợ (ngày) không hợp lệ." };
  }

  const latParsed = parseOptionalCoord(latRaw, "Vĩ độ (lat)");
  if ("error" in latParsed) {
    return latParsed;
  }

  const lngParsed = parseOptionalCoord(lngRaw, "Kinh độ (lng)");
  if ("error" in lngParsed) {
    return lngParsed;
  }

  let visitDay: VisitDayOfWeek | null = null;
  let visitDays: string | null = null;

  if (visitDaysRaw) {
    const valid = visitDaysRaw
      .split(",")
      .map((d) => d.trim().toUpperCase())
      .filter((d) => VISIT_DAYS.includes(d as VisitDayOfWeek));
    if (valid.length > 0) {
      visitDays = valid.join(",");
      visitDay = valid[0] as VisitDayOfWeek;
    }
  } else if (visitDayRaw && VISIT_DAYS.includes(visitDayRaw as VisitDayOfWeek)) {
    visitDay = visitDayRaw as VisitDayOfWeek;
    visitDays = visitDay;
  }

  return {
    data: {
      name,
      phone: phone || null,
      address: address || null,
      type: typeRaw as CustomerType,
      creditLimit,
      creditTermDays,
      lat: latParsed.value,
      lng: lngParsed.value,
      visitDay,
      visitDays,
    },
  };
}

function mapPrismaError(error: unknown): string {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2025") {
      return "Không tìm thấy khách hàng.";
    }
  }
  return error instanceof Error
    ? error.message
    : "Đã xảy ra lỗi. Vui lòng thử lại.";
}

function fail(message: string): CustomerActionResult {
  return { success: false, message, error: message };
}

function ok(message: string): CustomerActionResult {
  return { success: true, message };
}

export async function createCustomer(
  formData: FormData,
): Promise<CustomerActionResult> {
  try {
    await requireRoles(["ADMIN", "ACCOUNTANT", "SALES"]);
  } catch (authErr: any) {
    return fail(authErr.message);
  }

  const parsed = parseCustomerFormData(formData);
  if ("error" in parsed) {
    return fail(parsed.error);
  }

  try {
    await prisma.customer.create({ data: parsed.data });
  } catch (error) {
    return fail(mapPrismaError(error));
  }

  revalidatePath("/khach-hang");
  return ok("Đã thêm khách hàng thành công.");
}

export async function updateCustomer(
  id: string,
  formData: FormData,
): Promise<CustomerActionResult> {
  if (!id) {
    return fail("Thiếu mã khách hàng.");
  }

  try {
    await requireRoles(["ADMIN", "ACCOUNTANT", "SALES"]);
  } catch (authErr: any) {
    return fail(authErr.message);
  }

  const parsed = parseCustomerFormData(formData);
  if ("error" in parsed) {
    return fail(parsed.error);
  }

  try {
    await prisma.customer.update({
      where: { id },
      data: parsed.data,
    });
  } catch (error) {
    return fail(mapPrismaError(error));
  }

  revalidatePath("/khach-hang");
  return ok("Đã cập nhật khách hàng thành công.");
}

export async function deleteCustomer(
  id: string,
): Promise<CustomerActionResult> {
  if (!id) {
    return fail("Thiếu mã khách hàng.");
  }

  try {
    await requireRoles(["ADMIN"]);
  } catch (authErr: any) {
    return fail(authErr.message);
  }

  try {
    await prisma.customer.delete({ where: { id } });
  } catch (error) {
    return fail(mapPrismaError(error));
  }

  revalidatePath("/khach-hang");
  return ok("Đã xóa khách hàng thành công.");
}

export async function updateCustomerVisitDays(
  customerId: string,
  visitDays: ("T2" | "T3" | "T4" | "T5" | "T6" | "T7")[],
): Promise<CustomerActionResult> {
  if (!customerId) {
    return fail("Thiếu mã khách hàng.");
  }

  try {
    await requireRoles(["ADMIN", "SALES"]);
  } catch (authErr: any) {
    return fail(authErr.message);
  }

  try {
    const validDays = visitDays.filter((d) => VISIT_DAYS.includes(d as VisitDayOfWeek));
    const visitDaysStr = validDays.join(",");
    const primaryDay = (validDays[0] as VisitDayOfWeek) || null;

    await prisma.customer.update({
      where: { id: customerId },
      data: {
        visitDays: visitDaysStr || null,
        visitDay: primaryDay,
      },
    });

    revalidatePath("/sales");
    revalidatePath("/khach-hang");
    return ok("Đã cập nhật lịch ngày ghé thành công.");
  } catch (error) {
    return fail(mapPrismaError(error));
  }
}

