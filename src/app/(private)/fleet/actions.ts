"use server";

import { revalidatePath } from "next/cache";
import { MeterUnit, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRoles } from "@/lib/auth";

export type FleetActionResult = {
  success: boolean;
  message: string;
  error?: string;
};

function fail(message: string): FleetActionResult {
  return { success: false, message, error: message };
}

function ok(message: string): FleetActionResult {
  return { success: true, message };
}

function parseUnit(raw: string): MeterUnit | null {
  if (raw === "KM" || raw === "HOUR") return raw;
  return null;
}

async function assertFleetCustomer(customerId: string) {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: { id: true, type: true },
  });
  if (!customer) {
    throw new Error("Không tìm thấy khách hàng.");
  }
  if (customer.type !== "FLEET") {
    throw new Error("Chỉ được gắn xe với khách hàng loại FLEET.");
  }
}

export async function createVehicle(input: {
  customerId: string;
  plateNumber: string;
  label?: string;
  unit: string;
  currentMeter: number;
  lastServiceMeter: number;
  intervalValue: number;
  notes?: string;
}): Promise<FleetActionResult> {
  try {
    await requireRoles(["ADMIN", "FLEET"]);
  } catch (authErr: any) {
    return fail(authErr.message);
  }

  const customerId = String(input.customerId ?? "").trim();
  const plateNumber = String(input.plateNumber ?? "").trim().toUpperCase();
  const label = String(input.label ?? "").trim() || null;
  const notes = String(input.notes ?? "").trim() || null;
  const unit = parseUnit(String(input.unit ?? "").trim().toUpperCase());
  const currentMeter = Number(input.currentMeter);
  const lastServiceMeter = Number(input.lastServiceMeter);
  const intervalValue = Number(input.intervalValue);

  if (!customerId) return fail("Vui lòng chọn khách hàng FLEET.");
  if (!plateNumber) return fail("Vui lòng nhập biển số.");
  if (!unit) return fail("Đơn vị phải là KM hoặc HOUR.");
  if (!Number.isFinite(intervalValue) || intervalValue <= 0) {
    return fail("Chu kỳ thay nhớt phải > 0.");
  }
  if (!Number.isFinite(currentMeter) || currentMeter < 0) {
    return fail("Số meter hiện tại không hợp lệ.");
  }
  if (!Number.isFinite(lastServiceMeter) || lastServiceMeter < 0) {
    return fail("Meter lần thay nhớt không hợp lệ.");
  }
  if (currentMeter < lastServiceMeter) {
    return fail("Meter hiện tại phải ≥ meter lần thay nhớt gần nhất.");
  }

  try {
    await assertFleetCustomer(customerId);
    await prisma.fleetVehicle.create({
      data: {
        customerId,
        plateNumber,
        label,
        unit,
        currentMeter,
        lastServiceMeter,
        intervalValue,
        notes,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return fail("Biển số đã tồn tại.");
    }
    return fail(
      error instanceof Error
        ? error.message
        : "Không thể tạo đầu xe. Vui lòng thử lại.",
    );
  }

  revalidatePath("/fleet");
  return ok("Đã thêm đầu xe thành công.");
}

export async function updateVehicle(
  id: string,
  input: {
    customerId: string;
    plateNumber: string;
    label?: string;
    unit: string;
    intervalValue: number;
    notes?: string;
  },
): Promise<FleetActionResult> {
  if (!id) return fail("Thiếu mã xe.");

  try {
    await requireRoles(["ADMIN", "FLEET"]);
  } catch (authErr: any) {
    return fail(authErr.message);
  }

  const customerId = String(input.customerId ?? "").trim();
  const plateNumber = String(input.plateNumber ?? "").trim().toUpperCase();
  const label = String(input.label ?? "").trim() || null;
  const notes = String(input.notes ?? "").trim() || null;
  const unit = parseUnit(String(input.unit ?? "").trim().toUpperCase());
  const intervalValue = Number(input.intervalValue);

  if (!customerId) return fail("Vui lòng chọn khách hàng FLEET.");
  if (!plateNumber) return fail("Vui lòng nhập biển số.");
  if (!unit) return fail("Đơn vị phải là KM hoặc HOUR.");
  if (!Number.isFinite(intervalValue) || intervalValue <= 0) {
    return fail("Chu kỳ thay nhớt phải > 0.");
  }

  try {
    await assertFleetCustomer(customerId);
    await prisma.fleetVehicle.update({
      where: { id },
      data: {
        customerId,
        plateNumber,
        label,
        unit,
        intervalValue,
        notes,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return fail("Biển số đã tồn tại.");
    }
    return fail(
      error instanceof Error
        ? error.message
        : "Không thể cập nhật đầu xe.",
    );
  }

  revalidatePath("/fleet");
  return ok("Đã cập nhật đầu xe.");
}

export async function updateMeter(
  id: string,
  currentMeter: number,
): Promise<FleetActionResult> {
  if (!id) return fail("Thiếu mã xe.");

  try {
    await requireRoles(["ADMIN", "FLEET"]);
  } catch (authErr: any) {
    return fail(authErr.message);
  }

  const meter = Number(currentMeter);
  if (!Number.isFinite(meter) || meter < 0) {
    return fail("Số meter không hợp lệ.");
  }

  try {
    const vehicle = await prisma.fleetVehicle.findUnique({ where: { id } });
    if (!vehicle) return fail("Không tìm thấy xe.");
    if (meter < vehicle.lastServiceMeter) {
      return fail("Meter hiện tại phải ≥ meter lần thay nhớt gần nhất.");
    }
    await prisma.fleetVehicle.update({
      where: { id },
      data: { currentMeter: meter },
    });
  } catch (error) {
    return fail(
      error instanceof Error ? error.message : "Không thể cập nhật meter.",
    );
  }

  revalidatePath("/fleet");
  return ok("Đã cập nhật meter.");
}

export async function recordOilChange(
  id: string,
  meter?: number,
): Promise<FleetActionResult> {
  if (!id) return fail("Thiếu mã xe.");

  try {
    await requireRoles(["ADMIN", "FLEET"]);
  } catch (authErr: any) {
    return fail(authErr.message);
  }

  try {
    const vehicle = await prisma.fleetVehicle.findUnique({ where: { id } });
    if (!vehicle) return fail("Không tìm thấy xe.");

    const serviceMeter =
      meter != null && Number.isFinite(Number(meter))
        ? Number(meter)
        : vehicle.currentMeter;

    if (serviceMeter < 0) {
      return fail("Meter thay nhớt không hợp lệ.");
    }

    await prisma.fleetVehicle.update({
      where: { id },
      data: {
        lastServiceMeter: serviceMeter,
        currentMeter: Math.max(vehicle.currentMeter, serviceMeter),
      },
    });
  } catch (error) {
    return fail(
      error instanceof Error
        ? error.message
        : "Không thể ghi nhận thay nhớt.",
    );
  }

  revalidatePath("/fleet");
  return ok("Đã ghi nhận thay nhớt — chu kỳ được làm mới.");
}

export async function deleteVehicle(id: string): Promise<FleetActionResult> {
  if (!id) return fail("Thiếu mã xe.");

  try {
    await requireRoles(["ADMIN"]);
  } catch (authErr: any) {
    return fail(authErr.message);
  }

  try {
    await prisma.fleetVehicle.delete({ where: { id } });
  } catch (error) {
    return fail(
      error instanceof Error ? error.message : "Không thể xóa đầu xe.",
    );
  }

  revalidatePath("/fleet");
  return ok("Đã xóa đầu xe.");
}
