"use client";

import { useEffect, useState } from "react";
import type { RemixStaffUser } from "@/lib/remix/load-bootstrap";
import type { UserRole } from "@prisma/client";
import { Shield, Users } from "lucide-react";
import { usePagination } from "../../hooks/usePagination";
import Pagination from "../common/Pagination";


const ROLES: UserRole[] = [
  "ADMIN",
  "SALES",
  "FLEET",
  "DEALER",
  "ACCOUNTANT",
];

type StaffRBACViewProps = {
  staffUsers: RemixStaffUser[];
  onUpdateRole: (userId: string, role: UserRole) => void;
};

export default function StaffRBACView({
  staffUsers,
  onUpdateRole,
}: StaffRBACViewProps) {
  const [localUsers, setLocalUsers] = useState(staffUsers);

  useEffect(() => {
    setLocalUsers(staffUsers);
  }, [staffUsers]);

  const {
    currentPage,
    pageSize,
    totalPages,
    paginatedItems: paginatedUsers,
    startIndex,
    endIndex,
    totalItems,
    goToPage,
    setPageSize,
  } = usePagination({
    items: localUsers,
    initialPageSize: 8,
    pageSizeOptions: [8, 16, 32],
  });

  return (
    <div id="staff-rbac-view" className="w-full space-y-6">
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:flex-row sm:items-center">
        <div className="flex items-center gap-2.5">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600">
            <Users className="size-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
                Nhân sự &amp; Phân quyền
              </h2>
              <span className="rounded-full bg-slate-900 px-2.5 py-0.5 font-mono text-xs font-bold text-amber-400">
                RBAC
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              Tài khoản từ DB — đổi vai trò (cần quyền ADMIN)
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700">
          <Shield className="size-3.5 text-amber-600" />
          {localUsers.length} người dùng
        </div>
      </div>

      {/* Mobile User Cards List (sm:hidden) */}
      <div className="space-y-3 sm:hidden">
        {localUsers.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-xs text-slate-500">
            Chưa có user trong DB.
          </div>
        ) : (
          paginatedUsers.map((user) => (
            <div
              key={user.id}
              className="space-y-2.5 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs"
            >
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-xs font-bold text-slate-900 truncate">
                  {user.name || "—"}
                </h4>
                <select
                  value={user.role}
                  onChange={(e) => {
                    const role = e.target.value as UserRole;
                    setLocalUsers((prev) =>
                      prev.map((u) => (u.id === user.id ? { ...u, role } : u)),
                    );
                    onUpdateRole(user.id, role);
                  }}
                  className="rounded-lg border border-slate-200 bg-amber-50/50 px-2 py-1 font-mono text-xs font-bold text-slate-800"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span className="truncate">{user.email}</span>
                <span className="shrink-0 font-mono text-[10px] text-slate-400">
                  {new Date(user.createdAt).toLocaleDateString("vi-VN")}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table View (hidden sm:block) */}
      <div className="hidden sm:block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50 text-xs text-slate-500 uppercase">
            <tr>
              <th className="px-4 py-3 font-bold">Họ tên</th>
              <th className="px-4 py-3 font-bold">Email</th>
              <th className="px-4 py-3 font-bold">Vai trò</th>
              <th className="px-4 py-3 font-bold">Ngày tạo</th>
            </tr>
          </thead>
          <tbody>
            {localUsers.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-10 text-center text-slate-500"
                >
                  Chưa có user trong DB.
                </td>
              </tr>
            ) : (
              paginatedUsers.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-slate-50 last:border-0"
                >
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {user.name || "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{user.email}</td>
                  <td className="px-4 py-3">
                    <select
                      value={user.role}
                      onChange={(e) => {
                        const role = e.target.value as UserRole;
                        setLocalUsers((prev) =>
                          prev.map((u) =>
                            u.id === user.id ? { ...u, role } : u,
                          ),
                        );
                        onUpdateRole(user.id, role);
                      }}
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-bold"
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">
                    {new Date(user.createdAt).toLocaleDateString("vi-VN")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={totalItems}
          startIndex={startIndex}
          endIndex={endIndex}
          onPageChange={goToPage}
          onPageSizeChange={setPageSize}
          pageSizeOptions={[8, 16, 32]}
        />
      </div>
    </div>
  );
}
