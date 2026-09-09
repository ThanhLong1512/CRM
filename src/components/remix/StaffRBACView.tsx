"use client";

import { useEffect, useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { RemixStaffUser } from "@/lib/remix/load-bootstrap";
import type { UserRole } from "@prisma/client";
import {
  Shield,
  Users,
  Plus,
  Pencil,
  Trash2,
  Key,
  Search,
  Phone,
  Mail,
  CheckCircle2,
  AlertCircle,
  X,
  Briefcase,
  UserCheck,
  ShieldCheck,
  Building,
  Truck,
  DollarSign,
  UserX,
} from "lucide-react";
import { toast } from "sonner";
import { usePagination } from "../../hooks/usePagination";
import Pagination from "../common/Pagination";
import {
  createStaffUser,
  updateStaffUser,
  updateUserRole,
  deleteStaffUser,
  resetStaffPassword,
} from "@/app/(private)/nhan-su/actions";
import { soundFX } from "../utils/audio";

const ROLES: Array<{
  value: UserRole;
  label: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  desc: string;
}> = [
  {
    value: "ADMIN",
    label: "Quản trị viên (ADMIN)",
    badgeBg: "bg-purple-100",
    badgeText: "text-purple-800",
    badgeBorder: "border-purple-200",
    desc: "Toàn quyền quản lý hệ thống, phân quyền, cấu hình & duyệt hạn mức",
  },
  {
    value: "SALES",
    label: "Kinh doanh (SALES)",
    badgeBg: "bg-amber-100",
    badgeText: "text-amber-900",
    badgeBorder: "border-amber-200",
    desc: "Bán hàng thực địa, check-in GPS tuyến bán, mở đơn, kiểm tra hạn mức",
  },
  {
    value: "ACCOUNTANT",
    label: "Kế toán (ACCOUNTANT)",
    badgeBg: "bg-cyan-100",
    badgeText: "text-cyan-900",
    badgeBorder: "border-cyan-200",
    desc: "Theo dõi công nợ, thu tiền cấn trừ, đối soát vỏ phuy & xuất hóa đơn",
  },
  {
    value: "FLEET",
    label: "Vận tải (FLEET)",
    badgeBg: "bg-emerald-100",
    badgeText: "text-emerald-900",
    badgeBorder: "border-emerald-200",
    desc: "Giao nhận hàng hóa, theo dõi bảo dưỡng xe tải & thu hồi vỏ phuy",
  },
  {
    value: "DEALER",
    label: "Đại lý (DEALER)",
    badgeBg: "bg-blue-100",
    badgeText: "text-blue-900",
    badgeBorder: "border-blue-200",
    desc: "Khách hàng cấp 1, đặt hàng trực tuyến, tra cứu lịch sử và tích điểm",
  },
];

type StaffRBACViewProps = {
  staffUsers: RemixStaffUser[];
  onUpdateRole?: (userId: string, role: UserRole) => void;
};

export default function StaffRBACView({
  staffUsers,
  onUpdateRole,
}: StaffRBACViewProps) {
  const router = useRouter();
  const [localUsers, setLocalUsers] = useState<RemixStaffUser[]>(staffUsers);
  const [isPending, startTransition] = useTransition();

  // Search and Role Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>("ALL");

  // Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<RemixStaffUser | null>(null);
  const [resettingUser, setResettingUser] = useState<RemixStaffUser | null>(null);
  const [deletingUser, setDeletingUser] = useState<RemixStaffUser | null>(null);

  // Form Inputs for Create
  const [createName, setCreateName] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createPhone, setCreatePhone] = useState("");
  const [createRole, setCreateRole] = useState<UserRole>("SALES");
  const [createPassword, setCreatePassword] = useState("123456");

  // Form Inputs for Edit
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editRole, setEditRole] = useState<UserRole>("SALES");

  // Form Input for Reset Password
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    setLocalUsers(staffUsers);
  }, [staffUsers]);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return localUsers.filter((user) => {
      const matchesSearch =
        (user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.phone?.includes(searchQuery) ?? false);

      const matchesRole =
        selectedRoleFilter === "ALL" || user.role === selectedRoleFilter;

      return matchesSearch && matchesRole;
    });
  }, [localUsers, searchQuery, selectedRoleFilter]);

  // Pagination
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
    items: filteredUsers,
    initialPageSize: 8,
    pageSizeOptions: [8, 16, 32],
  });

  // KPI Statistics
  const totalStaff = localUsers.length;
  const salesCount = localUsers.filter((u) => u.role === "SALES").length;
  const accountantCount = localUsers.filter((u) => u.role === "ACCOUNTANT").length;
  const adminCount = localUsers.filter((u) => u.role === "ADMIN").length;

  // Handler: Open Edit Modal
  const handleOpenEdit = (user: RemixStaffUser) => {
    setEditingUser(user);
    setEditName(user.name || "");
    setEditPhone(user.phone || "");
    setEditRole(user.role);
  };

  // Handler: Submit Create Staff
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName.trim() || !createEmail.trim()) {
      toast.error("Vui lòng điền đầy đủ Họ tên và Email.");
      return;
    }

    const formData = new FormData();
    formData.set("name", createName);
    formData.set("email", createEmail);
    formData.set("phone", createPhone);
    formData.set("role", createRole);
    formData.set("password", createPassword);

    startTransition(async () => {
      const res = await createStaffUser(formData);
      if (!res.success) {
        toast.error(res.error || res.message);
        return;
      }

      soundFX.playSuccess();
      toast.success(res.message);

      if (res.user) {
        setLocalUsers((prev) => [res.user!, ...prev]);
      }

      setShowCreateModal(false);
      setCreateName("");
      setCreateEmail("");
      setCreatePhone("");
      setCreateRole("SALES");
      setCreatePassword("123456");
      router.refresh();
    });
  };

  // Handler: Submit Edit Staff
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || !editName.trim()) {
      toast.error("Vui lòng nhập họ và tên.");
      return;
    }

    const formData = new FormData();
    formData.set("name", editName);
    formData.set("phone", editPhone);
    formData.set("role", editRole);

    startTransition(async () => {
      const res = await updateStaffUser(editingUser.id, formData);
      if (!res.success) {
        toast.error(res.error || res.message);
        return;
      }

      soundFX.playSuccess();
      toast.success(res.message);

      setLocalUsers((prev) =>
        prev.map((u) =>
          u.id === editingUser.id
            ? { ...u, name: editName, phone: editPhone, role: editRole }
            : u
        )
      );

      setEditingUser(null);
      router.refresh();
    });
  };

  // Handler: Confirm Delete Staff
  const handleDeleteConfirm = () => {
    if (!deletingUser) return;

    startTransition(async () => {
      const res = await deleteStaffUser(deletingUser.id);
      if (!res.success) {
        toast.error(res.error || res.message);
        setDeletingUser(null);
        return;
      }

      soundFX.playSuccess();
      toast.success(res.message);
      setLocalUsers((prev) => prev.filter((u) => u.id !== deletingUser.id));
      setDeletingUser(null);
      router.refresh();
    });
  };

  // Handler: Submit Reset Password
  const handleResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resettingUser || !newPassword.trim() || newPassword.length < 6) {
      toast.error("Mật khẩu mới phải từ 6 ký tự trở lên.");
      return;
    }

    startTransition(async () => {
      const res = await resetStaffPassword(resettingUser.id, newPassword);
      if (!res.success) {
        toast.error(res.error || res.message);
        return;
      }

      soundFX.playSuccess();
      toast.success(res.message);
      setResettingUser(null);
      setNewPassword("");
    });
  };

  // Helper for Role metadata
  const getRoleMeta = (role: UserRole) => {
    return (
      ROLES.find((r) => r.value === role) || {
        value: role,
        label: role,
        badgeBg: "bg-slate-100",
        badgeText: "text-slate-800",
        badgeBorder: "border-slate-200",
        desc: "",
      }
    );
  };

  return (
    <div id="staff-rbac-view" className="w-full space-y-6">
      {/* 1. Header Banner */}
      <div className="flex flex-col justify-between gap-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-amber-500 to-amber-600 text-slate-950 shadow-md">
            <Users className="size-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
                Nhân Sự &amp; Phân Quyền Hệ Thống
              </h2>
              <span className="rounded-lg bg-slate-900 px-2.5 py-0.5 font-mono text-xs font-black text-amber-400">
                RBAC v2.5
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Quản lý hồ sơ nhân viên, phân quyền truy cập tính năng &amp; tài khoản đăng nhập CRM
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 px-4 py-2.5 text-xs sm:text-sm font-black text-slate-950 shadow-sm transition-all cursor-pointer font-sans"
        >
          <Plus className="size-4.5" />
          <span>Thêm Nhân Viên Mới</span>
        </button>
      </div>

      {/* 2. KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-semibold">Tổng Nhân Sự</div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-slate-900 mt-1">
              {totalStaff}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Tài khoản hoạt động</div>
          </div>
          <div className="size-11 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <Users className="size-5" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-semibold">Sales Thực Địa</div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-amber-600 mt-1">
              {salesCount}
            </div>
            <div className="text-[11px] text-amber-700/80 mt-0.5">Viếng thăm &amp; lên đơn</div>
          </div>
          <div className="size-11 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center">
            <Briefcase className="size-5" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-semibold">Kế Toán &amp; Kho</div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-cyan-600 mt-1">
              {accountantCount}
            </div>
            <div className="text-[11px] text-cyan-700/80 mt-0.5">Công nợ &amp; vỏ phuy</div>
          </div>
          <div className="size-11 rounded-2xl bg-cyan-100 text-cyan-800 flex items-center justify-center">
            <DollarSign className="size-5" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-semibold">Quản Trị Viên</div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-purple-600 mt-1">
              {adminCount}
            </div>
            <div className="text-[11px] text-purple-700/80 mt-0.5">Toàn quyền hệ thống</div>
          </div>
          <div className="size-11 rounded-2xl bg-purple-100 text-purple-800 flex items-center justify-center">
            <ShieldCheck className="size-5" />
          </div>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo tên nhân viên, email, số điện thoại..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:outline-none focus:border-amber-500 bg-slate-50/50"
            />
          </div>

          {/* Role Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 shrink-0">
            <button
              type="button"
              onClick={() => setSelectedRoleFilter("ALL")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                selectedRoleFilter === "ALL"
                  ? "bg-slate-900 text-white font-black shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Tất cả ({totalStaff})
            </button>
            {ROLES.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setSelectedRoleFilter(r.value)}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                  selectedRoleFilter === r.value
                    ? "bg-amber-500 text-slate-950 font-black shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {r.value} ({localUsers.filter((u) => u.role === r.value).length})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Desktop Staff Table */}
      <div className="hidden sm:block overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xs">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead className="border-b border-slate-100 bg-slate-50/80 text-xs text-slate-500 uppercase font-extrabold tracking-wider">
            <tr>
              <th className="px-5 py-3.5">Nhân viên</th>
              <th className="px-4 py-3.5">Liên hệ</th>
              <th className="px-4 py-3.5">Vai trò &amp; Quyền hạn</th>
              <th className="px-4 py-3.5">Ngày tham gia</th>
              <th className="px-5 py-3.5 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-slate-500">
                  <UserX className="size-8 mx-auto text-slate-300 mb-2" />
                  <p className="font-bold text-slate-700">Không tìm thấy nhân sự phù hợp</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Thử thay đổi từ khóa tìm kiếm hoặc bỏ lọc vai trò
                  </p>
                </td>
              </tr>
            ) : (
              paginatedUsers.map((user) => {
                const meta = getRoleMeta(user.role);
                const initials = (user.name || user.email)
                  .split(" ")
                  .map((w) => w[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase();

                return (
                  <tr key={user.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-linear-to-br from-slate-100 to-slate-200 border border-slate-300 text-slate-800 font-mono font-black text-xs flex items-center justify-center shrink-0 shadow-2xs">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <div className="font-black text-slate-900 text-sm truncate flex items-center gap-1.5">
                            <span>{user.name || "Chưa đặt tên"}</span>
                          </div>
                          <div className="text-xs text-slate-400 font-mono mt-0.5">
                            ID: {user.id.slice(-6).toUpperCase()}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-slate-700">
                          <Mail className="size-3.5 text-slate-400 shrink-0" />
                          <span className="font-medium truncate max-w-[200px]">{user.email}</span>
                        </div>
                        {user.phone && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-mono">
                            <Phone className="size-3.5 text-slate-400 shrink-0" />
                            <span>{user.phone}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border ${meta.badgeBg} ${meta.badgeText} ${meta.badgeBorder}`}
                      >
                        <Shield className="size-3" />
                        <span>{user.role}</span>
                      </span>
                    </td>

                    <td className="px-4 py-4 text-xs font-mono text-slate-500">
                      {new Date(user.createdAt).toLocaleDateString("vi-VN")}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(user)}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1 shadow-2xs cursor-pointer transition-all"
                          title="Sửa thông tin"
                        >
                          <Pencil className="size-3 text-slate-500" />
                          <span>Sửa</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setResettingUser(user);
                            setNewPassword("123456");
                          }}
                          className="p-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-amber-600 text-xs font-bold shadow-2xs cursor-pointer transition-all"
                          title="Đặt lại mật khẩu"
                        >
                          <Key className="size-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeletingUser(user)}
                          className="p-1.5 rounded-lg border border-rose-200 hover:border-rose-300 bg-rose-50/50 hover:bg-rose-100 text-rose-600 text-xs font-bold shadow-2xs cursor-pointer transition-all"
                          title="Xóa nhân viên"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Pagination bar */}
        <div className="p-4 border-t border-slate-100">
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
            compact
          />
        </div>
      </div>

      {/* 5. Mobile Cards View */}
      <div className="sm:hidden space-y-3">
        {paginatedUsers.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-xs text-slate-500">
            Không tìm thấy nhân sự phù hợp.
          </div>
        ) : (
          paginatedUsers.map((user) => {
            const meta = getRoleMeta(user.role);
            return (
              <div
                key={user.id}
                className="space-y-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-black text-slate-900 truncate">
                      {user.name || "Chưa đặt tên"}
                    </h4>
                    <p className="text-xs text-slate-500 font-mono">{user.email}</p>
                    {user.phone && (
                      <p className="text-xs text-slate-500 font-mono mt-0.5">{user.phone}</p>
                    )}
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border ${meta.badgeBg} ${meta.badgeText} ${meta.badgeBorder}`}
                  >
                    {user.role}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-[10px] font-mono text-slate-400">
                    Gia nhập: {new Date(user.createdAt).toLocaleDateString("vi-VN")}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(user)}
                      className="px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 text-xs font-bold"
                    >
                      Sửa
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setResettingUser(user);
                        setNewPassword("123456");
                      }}
                      className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 text-amber-600 text-xs"
                    >
                      <Key className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingUser(user)}
                      className="p-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-600 text-xs"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}

        <div className="pt-2">
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
            compact
          />
        </div>
      </div>

      {/* 6. CREATE STAFF MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Plus className="size-5 text-amber-500" />
                  <span>Thêm Nhân Viên Mới Vào Hệ Thống</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tạo hồ sơ và tài khoản đăng nhập CRM cho nhân sự
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Họ và tên nhân viên <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Nguyễn Văn An"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-medium focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email đăng nhập <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="sales.anv@remixoil.vn"
                    value={createEmail}
                    onChange={(e) => setCreateEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-mono focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Số điện thoại liên hệ
                  </label>
                  <input
                    type="tel"
                    placeholder="0901234567"
                    value={createPhone}
                    onChange={(e) => setCreatePhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-mono focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mật khẩu khởi tạo
                </label>
                <input
                  type="text"
                  placeholder="123456"
                  value={createPassword}
                  onChange={(e) => setCreatePassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-mono focus:border-amber-500 focus:outline-none"
                />
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  Mặc định: 123456 (Nhân viên có thể đổi sau khi đăng nhập)
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Phân quyền vai trò (RBAC) <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {ROLES.map((r) => (
                    <label
                      key={r.value}
                      className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-colors ${
                        createRole === r.value
                          ? "border-amber-400 bg-amber-50/60"
                          : "border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value={r.value}
                        checked={createRole === r.value}
                        onChange={() => setCreateRole(r.value)}
                        className="mt-1 accent-amber-500"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                          <span>{r.label}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                          {r.desc}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-sm cursor-pointer disabled:opacity-60"
                >
                  {isPending ? "Đang lưu..." : "Xác Nhận Tạo Nhân Viên"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. EDIT STAFF MODAL */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Pencil className="size-5 text-slate-600" />
                  <span>Sửa Thông Tin Nhân Viên</span>
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  {editingUser.email}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Họ và tên nhân viên
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-medium focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Số điện thoại liên hệ
                </label>
                <input
                  type="tel"
                  placeholder="0901234567"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-mono focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Phân quyền vai trò
                </label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as UserRole)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-bold bg-white focus:border-amber-500 focus:outline-none"
                >
                  {ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black shadow-sm cursor-pointer disabled:opacity-60"
                >
                  {isPending ? "Đang lưu..." : "Cập Nhật Hồ Sơ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. RESET PASSWORD MODAL */}
      {resettingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Key className="size-5 text-amber-500" />
                  <span>Đặt Lại Mật Khẩu Đăng Nhập</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Thiết lập mật khẩu mới cho {resettingUser.name || resettingUser.email}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setResettingUser(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleResetPasswordSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mật khẩu mới (tối thiểu 6 ký tự)
                </label>
                <input
                  type="text"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nhập mật khẩu mới..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-mono focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setResettingUser(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-sm cursor-pointer disabled:opacity-60"
                >
                  {isPending ? "Đang xử lý..." : "Lưu Mật Khẩu Mới"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 9. DELETE CONFIRMATION DIALOG */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="size-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertCircle className="size-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Xác nhận xóa nhân viên?
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Bạn có chắc chắn muốn xóa tài khoản của{" "}
                  <strong>{deletingUser.name || deletingUser.email}</strong>? Hành động này sẽ
                  thu hồi toàn bộ quyền truy cập của nhân viên này trên hệ thống.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isPending}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-60"
              >
                {isPending ? "Đang xóa..." : "Xác Nhận Xóa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
