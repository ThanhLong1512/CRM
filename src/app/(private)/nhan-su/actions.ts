"use server";

import { revalidatePath } from "next/cache";
import { UserRole } from "@prisma/client";
import { getSessionDbUser, isAdminRole, resolveUserRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type StaffActionResult = {
  success: boolean;
  message: string;
  error?: string;
};

const ASSIGNABLE_ROLES: UserRole[] = [
  UserRole.ADMIN,
  UserRole.SALES,
  UserRole.FLEET,
  UserRole.DEALER,
  UserRole.ACCOUNTANT,
];

function fail(message: string): StaffActionResult {
  return { success: false, message, error: message };
}

function ok(message: string): StaffActionResult {
  return { success: true, message };
}

export async function updateUserRole(
  userId: string,
  role: string,
): Promise<StaffActionResult> {
  if (!userId) {
    return fail("Thiếu mã nhân viên.");
  }

  const { dbUser } = await getSessionDbUser();
  const currentRole = resolveUserRole(dbUser);

  if (!isAdminRole(currentRole) || !dbUser) {
    return fail("Chỉ ADMIN mới được đổi vai trò.");
  }

  if (!ASSIGNABLE_ROLES.includes(role as UserRole)) {
    return fail("Vai trò không hợp lệ.");
  }

  const nextRole = role as UserRole;

  if (userId === dbUser.id && nextRole !== UserRole.ADMIN) {
    return fail("Bạn không thể tự hạ quyền ADMIN của chính mình.");
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { role: nextRole },
    });
  } catch (error) {
    return fail(
      error instanceof Error
        ? error.message
        : "Không thể cập nhật vai trò. Vui lòng thử lại.",
    );
  }

  revalidatePath("/nhan-su");
  return ok("Đã cập nhật vai trò thành công.");
}
