import { prisma } from "@/lib/prisma";
import {
  DEMO_USER_TEMPLATES,
  QUICK_LOGIN_DEMO_EMAILS,
  mapPrismaRoleToAuthDemo,
  type QuickLoginUserDto,
} from "@/components/auth/authData";

function roleLabel(role: QuickLoginUserDto["role"]): string {
  if (role === "sales") return "Sales";
  if (role === "accountant") return "Kế Toán";
  if (role === "fleet") return "Đội Xe / Vận Tải";
  if (role === "dealer") return "Đại Lý Cấp 1";
  return "GĐ Kinh Doanh";
}

/**
 * Returns demo quick-login cards only for users that already exist in Prisma.
 */
export async function listQuickLoginUsers(): Promise<QuickLoginUserDto[]> {
  const emails = [...QUICK_LOGIN_DEMO_EMAILS];
  const rows = await prisma.user.findMany({
    where: { email: { in: emails } },
    select: { id: true, email: true, name: true, role: true },
    orderBy: { email: "asc" },
  });

  const byEmail = new Map(rows.map((r) => [r.email.toLowerCase(), r]));

  // Preserve template order; skip missing DB rows
  const result: QuickLoginUserDto[] = [];
  for (const template of DEMO_USER_TEMPLATES) {
    const row = byEmail.get(template.email.toLowerCase());
    if (!row) continue;
    const role = mapPrismaRoleToAuthDemo(row.role);
    result.push({
      id: row.id,
      name: row.name || template.name,
      email: row.email,
      role,
      roleLabel: roleLabel(role),
    });
  }
  return result;
}
