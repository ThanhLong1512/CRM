"use server";

import { revalidatePath } from "next/cache";
import { UserRole } from "@prisma/client";
import { getSessionDbUser, isAdminRole, resolveUserRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export type StaffActionResult = {
  success: boolean;
  message: string;
  error?: string;
  user?: {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
    role: UserRole;
    createdAt: string;
  };
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

function ok(message: string, user?: any): StaffActionResult {
  return { success: true, message, user };
}

export async function createStaffUser(
  formData: FormData,
): Promise<StaffActionResult> {
  const { dbUser } = await getSessionDbUser();
  const currentRole = resolveUserRole(dbUser);

  if (!isAdminRole(currentRole) || !dbUser) {
    return fail("Chỉ Quản trị viên (ADMIN) mới có quyền tạo nhân viên mới.");
  }

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim();
  const roleRaw = String(formData.get("role") ?? "SALES").trim().toUpperCase();
  const password = String(formData.get("password") ?? "").trim() || "123456";

  if (!name) {
    return fail("Vui lòng nhập họ và tên nhân viên.");
  }

  if (!email || !email.includes("@")) {
    return fail("Địa chỉ email không hợp lệ.");
  }

  if (!ASSIGNABLE_ROLES.includes(roleRaw as UserRole)) {
    return fail("Vai trò được chọn không hợp lệ.");
  }

  const role = roleRaw as UserRole;

  // Check if email is already registered in DB
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return fail(`Email "${email}" đã tồn tại trên hệ thống.`);
  }

  try {
    // 1. Create in Prisma Database
    const createdUser = await prisma.user.create({
      data: {
        name,
        email,
        phone: phone || null,
        role,
      },
    });

    // 2. Attempt to create user in Supabase Auth so staff can login immediately
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && (serviceRoleKey || anonKey)) {
      try {
        if (serviceRoleKey) {
          const adminSupabase = createSupabaseClient(supabaseUrl, serviceRoleKey, {
            auth: { autoRefreshToken: false, persistSession: false },
          });
          await adminSupabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { full_name: name, role },
          });
        } else if (anonKey) {
          const publicSupabase = createSupabaseClient(supabaseUrl, anonKey, {
            auth: { autoRefreshToken: false, persistSession: false },
          });
          await publicSupabase.auth.signUp({
            email,
            password,
            options: { data: { full_name: name, role } },
          });
        }
      } catch (authErr) {
        console.warn("Supabase Auth sync warning (Prisma user created):", authErr);
      }
    }

    revalidatePath("/nhan-su");
    return ok(`Đã thêm nhân viên "${name}" thành công. Mật khẩu khởi tạo: ${password}`, {
      id: createdUser.id,
      name: createdUser.name,
      email: createdUser.email,
      phone: createdUser.phone,
      role: createdUser.role,
      createdAt: createdUser.createdAt.toISOString(),
    });
  } catch (error) {
    return fail(
      error instanceof Error
        ? error.message
        : "Không thể thêm nhân viên mới. Vui lòng thử lại.",
    );
  }
}

export async function updateStaffUser(
  userId: string,
  formData: FormData,
): Promise<StaffActionResult> {
  if (!userId) {
    return fail("Thiếu mã nhân viên.");
  }

  const { dbUser } = await getSessionDbUser();
  const currentRole = resolveUserRole(dbUser);

  if (!isAdminRole(currentRole) || !dbUser) {
    return fail("Chỉ ADMIN mới được chỉnh sửa thông tin nhân viên.");
  }

  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const roleRaw = String(formData.get("role") ?? "").trim().toUpperCase();

  if (!name) {
    return fail("Vui lòng nhập họ và tên.");
  }

  if (!ASSIGNABLE_ROLES.includes(roleRaw as UserRole)) {
    return fail("Vai trò không hợp lệ.");
  }

  const role = roleRaw as UserRole;

  if (userId === dbUser.id && role !== UserRole.ADMIN) {
    return fail("Bạn không thể tự hạ quyền ADMIN của chính mình.");
  }

  try {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        phone: phone || null,
        role,
      },
    });

    revalidatePath("/nhan-su");
    return ok(`Đã cập nhật thông tin nhân viên "${name}" thành công.`, {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      phone: updated.phone,
      role: updated.role,
      createdAt: updated.createdAt.toISOString(),
    });
  } catch (error) {
    return fail(
      error instanceof Error
        ? error.message
        : "Không thể cập nhật nhân viên. Vui lòng thử lại.",
    );
  }
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

export async function deleteStaffUser(
  userId: string,
): Promise<StaffActionResult> {
  if (!userId) {
    return fail("Thiếu mã nhân viên.");
  }

  const { dbUser } = await getSessionDbUser();
  const currentRole = resolveUserRole(dbUser);

  if (!isAdminRole(currentRole) || !dbUser) {
    return fail("Chỉ ADMIN mới có quyền xóa nhân viên.");
  }

  if (userId === dbUser.id) {
    return fail("Bạn không thể tự xóa tài khoản ADMIN đang đăng nhập của chính mình.");
  }

  try {
    // Check if user has orders or transactions
    const [orderCount, checkInCount] = await Promise.all([
      prisma.order.count({ where: { userId } }),
      prisma.visitCheckIn.count({ where: { userId } }),
    ]);

    if (orderCount > 0 || checkInCount > 0) {
      return fail(
        `Không thể xóa nhân viên này vì đã có ${orderCount} đơn hàng và ${checkInCount} lượt check-in liên kết. Hãy đổi vai trò thay vì xóa.`
      );
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    revalidatePath("/nhan-su");
    return ok("Đã xóa tài khoản nhân viên thành công.");
  } catch (error) {
    return fail(
      error instanceof Error
        ? error.message
        : "Không thể xóa nhân viên. Vui lòng thử lại.",
    );
  }
}

export async function resetStaffPassword(
  userId: string,
  newPassword: string,
): Promise<StaffActionResult> {
  if (!userId) return fail("Thiếu mã nhân viên.");
  if (!newPassword || newPassword.length < 6) {
    return fail("Mật khẩu mới phải có ít nhất 6 ký tự.");
  }

  const { dbUser } = await getSessionDbUser();
  const currentRole = resolveUserRole(dbUser);

  if (!isAdminRole(currentRole) || !dbUser) {
    return fail("Chỉ ADMIN mới có quyền đặt lại mật khẩu nhân viên.");
  }

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true },
  });

  if (!target) return fail("Không tìm thấy nhân viên.");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && serviceRoleKey) {
    try {
      const adminSupabase = createSupabaseClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      const { data: list } = await adminSupabase.auth.admin.listUsers();
      const authU = list?.users?.find(
        (u) => u.email?.toLowerCase() === target.email.toLowerCase(),
      );
      if (authU) {
        await adminSupabase.auth.admin.updateUserById(authU.id, {
          password: newPassword,
        });
      }
    } catch (err) {
      console.warn("Auth password reset error:", err);
    }
  }

  return ok(`Đã đặt lại mật khẩu mới cho ${target.name || target.email}: ${newPassword}`);
}
