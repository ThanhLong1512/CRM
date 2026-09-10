import { cache } from "react";
import type { User as AuthUser } from "@supabase/supabase-js";
import type { User, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";

export type SessionDbUser = Pick<User, "id" | "email" | "name" | "role">;

export type SessionContext = {
  authUser: AuthUser | null;
  dbUser: SessionDbUser | null;
};

export const getSessionDbUser = cache(async (): Promise<SessionContext> => {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser?.email) {
    return { authUser: authUser ?? null, dbUser: null };
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: authUser.email },
    select: { id: true, email: true, name: true, role: true },
  });

  return { authUser, dbUser };
});

export function resolveUserRole(dbUser: SessionDbUser | null): UserRole {
  return dbUser?.role ?? "SALES";
}

export function isAdminRole(role: string): boolean {
  return role === "ADMIN";
}

/**
 * Ensures user is authenticated and has a valid Prisma User record.
 * Throws Error if not logged in.
 */
export async function requireAuthUser(): Promise<SessionDbUser> {
  const { dbUser } = await getSessionDbUser();
  if (!dbUser) {
    throw new Error("Bạn cần đăng nhập để thực hiện thao tác này.");
  }
  return dbUser;
}

/**
 * Ensures user is authenticated and holds one of the specified roles.
 * Throws Error with descriptive message if unauthorized.
 */
export async function requireRoles(allowedRoles: UserRole[]): Promise<SessionDbUser> {
  const dbUser = await requireAuthUser();
  if (!allowedRoles.includes(dbUser.role)) {
    const roleLabels: Record<UserRole, string> = {
      ADMIN: "Quản trị viên (ADMIN)",
      ACCOUNTANT: "Kế toán (ACCOUNTANT)",
      SALES: "Nhân viên kinh doanh (SALES)",
      FLEET: "Đội xe / Vận tải (FLEET)",
      DEALER: "Đại lý (DEALER)",
    };
    const allowedText = allowedRoles.map((r) => roleLabels[r] || r).join(", ");
    throw new Error(
      `Từ chối truy cập: Tài khoản của bạn (${roleLabels[dbUser.role] || dbUser.role}) không có quyền thực hiện hành động này. Quyền yêu cầu: ${allowedText}.`,
    );
  }
  return dbUser;
}

export function hasRolePermission(userRole: UserRole | string, allowedRoles: (UserRole | string)[]): boolean {
  return allowedRoles.includes(userRole);
}

