"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type ProductActionResult = {
  success: boolean;
  message: string;
  error?: string;
};

type ParsedProductInput = {
  sku: string;
  name: string;
  viscosity: string | null;
  standard: string | null;
  volume: string | null;
  unitPrice: number;
  stock: number;
  isDrum: boolean;
};

function parseProductFormData(
  formData: FormData,
): { data: ParsedProductInput } | { error: string } {
  const sku = String(formData.get("code") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const viscosity = String(formData.get("viscosity") ?? "").trim();
  const standard = String(formData.get("standard") ?? "").trim();
  const volumeRaw = String(formData.get("volume") ?? "").trim();
  const priceRaw = String(formData.get("price") ?? "").trim();
  const stockRaw = String(formData.get("stock") ?? "").trim();

  if (!sku) {
    return { error: "Vui lòng nhập mã sản phẩm." };
  }
  if (!name) {
    return { error: "Vui lòng nhập tên sản phẩm." };
  }

  const volumeNum = volumeRaw === "" ? 0 : Number(volumeRaw);
  if (!Number.isFinite(volumeNum) || volumeNum < 0) {
    return { error: "Dung tích không hợp lệ." };
  }

  const unitPrice = Number(priceRaw || "0");
  if (!Number.isFinite(unitPrice) || unitPrice < 0) {
    return { error: "Giá bán không hợp lệ." };
  }

  const stock = Number.parseInt(stockRaw || "0", 10);
  if (!Number.isFinite(stock) || stock < 0) {
    return { error: "Tồn kho không hợp lệ." };
  }

  const isDrumRaw = formData.get("isDrum");
  const isDrum =
    isDrumRaw === "on" || isDrumRaw === "true" || isDrumRaw === "1";

  return {
    data: {
      sku,
      name,
      viscosity: viscosity || null,
      standard: standard || null,
      volume: volumeRaw === "" ? null : String(volumeNum),
      unitPrice,
      stock,
      isDrum,
    },
  };
}

function mapPrismaError(error: unknown): string {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return "Mã SP đã tồn tại.";
    }
    if (error.code === "P2003" || error.code === "P2014") {
      return "Không thể xóa sản phẩm vì đang được dùng trong đơn hàng.";
    }
  }
  return error instanceof Error
    ? error.message
    : "Đã xảy ra lỗi. Vui lòng thử lại.";
}

function fail(message: string): ProductActionResult {
  return { success: false, message, error: message };
}

function ok(message: string): ProductActionResult {
  return { success: true, message };
}

export async function createProduct(
  formData: FormData,
): Promise<ProductActionResult> {
  const parsed = parseProductFormData(formData);
  if ("error" in parsed) {
    return fail(parsed.error);
  }

  try {
    await prisma.product.create({ data: parsed.data });
  } catch (error) {
    return fail(mapPrismaError(error));
  }

  revalidatePath("/san-pham");
  return ok("Đã thêm sản phẩm thành công.");
}

export async function updateProduct(
  id: string,
  formData: FormData,
): Promise<ProductActionResult> {
  if (!id) {
    return fail("Thiếu mã sản phẩm.");
  }

  const parsed = parseProductFormData(formData);
  if ("error" in parsed) {
    return fail(parsed.error);
  }

  try {
    await prisma.product.update({
      where: { id },
      data: parsed.data,
    });
  } catch (error) {
    return fail(mapPrismaError(error));
  }

  revalidatePath("/san-pham");
  return ok("Đã cập nhật sản phẩm thành công.");
}

export async function deleteProduct(id: string): Promise<ProductActionResult> {
  if (!id) {
    return fail("Thiếu mã sản phẩm.");
  }

  try {
    await prisma.product.delete({ where: { id } });
  } catch (error) {
    return fail(mapPrismaError(error));
  }

  revalidatePath("/san-pham");
  return ok("Đã xóa sản phẩm thành công.");
}
