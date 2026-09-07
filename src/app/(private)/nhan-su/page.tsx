import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getSessionDbUser, isAdminRole, resolveUserRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StaffRoleSelect } from "@/app/(private)/nhan-su/StaffRoleSelect";

export const dynamic = "force-dynamic";

function roleBadgeVariant(
  role: string,
): "default" | "secondary" | "outline" | "destructive" {
  switch (role) {
    case "ADMIN":
      return "default";
    case "SALES":
      return "secondary";
    case "ACCOUNTANT":
      return "destructive";
    case "FLEET":
      return "outline";
    default:
      return "outline";
  }
}

export default async function NhanSuPage() {
  const { dbUser } = await getSessionDbUser();
  const role = resolveUserRole(dbUser);

  if (!isAdminRole(role)) {
    redirect("/dashboard");
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Nhân sự & Phân quyền
        </h1>
        <p className="text-sm text-muted-foreground">
          Quản lý tài khoản nhân viên và vai trò — {users.length} người dùng
        </p>
      </div>

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Họ Tên</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Vai trò</TableHead>
              <TableHead>Ngày tạo</TableHead>
              <TableHead className="text-right">Đổi quyền</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-24 text-center text-muted-foreground"
                >
                  Chưa có nhân viên trong hệ thống.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    <div className="flex flex-wrap items-center gap-2">
                      <span>{user.name || "—"}</span>
                      {user.id === dbUser?.id ? (
                        <Badge variant="outline">Bạn</Badge>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.email}
                  </TableCell>
                  <TableCell>
                    <Badge variant={roleBadgeVariant(user.role)}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground tabular-nums">
                    {user.createdAt.toLocaleDateString("vi-VN")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end">
                      <StaffRoleSelect userId={user.id} role={user.role} />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
