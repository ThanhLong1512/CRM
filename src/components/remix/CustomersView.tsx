"use client";

import { useMemo, useState, useEffect, type FormEvent } from "react";
import { Customer, CustomerType } from "../types";
import { formatVND } from "@/lib/remix/mappers";
import {
  Users,
  Search,
  Building2,
  Wrench,
  Truck,
  MapPin,
  ShieldAlert,
  ArrowRight,
  Plus,
  Phone,
  Calendar,
  Package,
  Sliders,
  Pencil,
  Trash2,
  X,
  Navigation,
  AlertCircle,
  CheckCircle2,
  Receipt,
  FileSpreadsheet,
  MessageCircle,
  Lock,
  AlertOctagon,
  Send,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import CollectDebtModal from "./CollectDebtModal";
import ZaloShareModal from "./ZaloShareModal";
import { exportCustomerDebtReport } from "@/lib/exportUtils";
import type { CreditOverrideRequest } from "../types";
import type { AuthUserProfile } from "@/components/auth/authData";
import { soundFX } from "@/components/utils/audio";
import { ActionMenu, PageActionMenu, type ActionMenuItem } from "@/components/common/ActionMenu";
import { Pagination } from "@/components/common/Pagination";
import { usePagination } from "@/hooks/usePagination";
import {
  VisitDatesEditor,
  type VisitPlanItem,
} from "@/components/customers/VisitDatesEditor";

export type CustomerFormInput = {
  name: string;
  phone: string;
  address: string;
  type: "GARAGE" | "FLEET";
  creditLimit: number;
  creditTermDays?: number;
  lat: string;
  lng: string;
};

interface CustomersViewProps {
  customers: Customer[];
  onUpdateCreditLimit: (customerId: string, newLimit: number) => void;
  onNavigateToSales: (customerId: string) => void;
  onCreateCustomer: (input: CustomerFormInput) => void;
  onUpdateCustomer: (customerId: string, input: CustomerFormInput) => void;
  onVisitPlansUpdated?: (customerId: string, plans: VisitPlanItem[]) => void;
  onDeleteCustomer: (customerId: string) => void;
  onPayDebt?: (customerId: string, amount: number) => void;
  sessionUser?: AuthUserProfile | null;
  creditOverrideRequests?: CreditOverrideRequest[];
  onRequestCreditOverride?: (customerId: string, reason: string, amount: number) => void;
  onApproveCreditOverride?: (customerId: string) => void;
  onRejectCreditOverride?: (customerId: string, reason?: string) => void;
}

function remixTypeToPrisma(type: CustomerType): "GARAGE" | "FLEET" {
  return type === "Đội xe" ? "FLEET" : "GARAGE";
}

function emptyForm(): CustomerFormInput {
  return {
    name: "",
    phone: "",
    address: "",
    type: "GARAGE",
    creditLimit: 10_000_000,
    creditTermDays: 30,
    lat: "",
    lng: "",
  };
}

export default function CustomersView({
  customers,
  onUpdateCreditLimit,
  onNavigateToSales,
  onCreateCustomer,
  onUpdateCustomer,
  onVisitPlansUpdated,
  onDeleteCustomer,
  onPayDebt,
  sessionUser,
  creditOverrideRequests = [],
  onRequestCreditOverride,
  onApproveCreditOverride,
  onRejectCreditOverride,
}: CustomersViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");

  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [newLimitInput, setNewLimitInput] = useState(0);

  const [selectedCollectCustomer, setSelectedCollectCustomer] = useState<Customer | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [formCustomerId, setFormCustomerId] = useState<string | null>(null);
  const [form, setForm] = useState<CustomerFormInput>(emptyForm);
  const [editVisitPlans, setEditVisitPlans] = useState<VisitPlanItem[]>([]);
  const [zaloCustomer, setZaloCustomer] = useState<Customer | null>(null);

  // Credit Hard-lock & Override Modal State
  const [selectedLockedCustomer, setSelectedLockedCustomer] = useState<Customer | null>(null);
  const [showCreditLockModal, setShowCreditLockModal] = useState(false);
  const [overrideReason, setOverrideReason] = useState(
    "Khách VIP lâu năm, đang cần nhớt gấp bảo dưỡng dàn xe chạy tour, cam kết thanh toán 50% vào thứ Sáu tuần này."
  );
  const [overrideAmount, setOverrideAmount] = useState<number>(31_200_000);

  const getTypeMeta = (type: CustomerType) => {
    switch (type) {
      case "Đại lý":
        return {
          label: "GARAGE / Đại Lý",
          icon: Building2,
          badgeBg: "bg-amber-100 text-amber-900 border-amber-300",
          avatarBg: "bg-amber-500 text-slate-950",
        };
      case "Đội xe":
        return {
          label: "FLEET / Đội Xe",
          icon: Truck,
          badgeBg: "bg-blue-100 text-blue-900 border-blue-300",
          avatarBg: "bg-blue-600 text-white",
        };
      default:
        return {
          label: "GARAGE / Thợ Máy",
          icon: Wrench,
          badgeBg: "bg-purple-100 text-purple-900 border-purple-300",
          avatarBg: "bg-purple-600 text-white",
        };
    }
  };

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const matchSearch =
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.code && c.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.address || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.phone && c.phone.includes(searchTerm));
      const matchType = selectedType === "all" || c.type === selectedType;
      return matchSearch && matchType;
    });
  }, [customers, searchTerm, selectedType]);

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalPages,
    totalItems,
    startIndex,
    endIndex,
    paginatedItems: paginatedCustomers,
    resetPage,
  } = usePagination(filteredCustomers, { initialPageSize: 10 });

  useEffect(() => {
    resetPage();
  }, [searchTerm, selectedType, resetPage]);

  const totalCreditLimit = customers.reduce((sum, c) => sum + c.creditLimit, 0);
  const totalCurrentDebt = customers.reduce((sum, c) => sum + c.currentDebt, 0);
  const overallUtilization = Math.round(
    (totalCurrentDebt / (totalCreditLimit || 1)) * 100,
  );
  const overLimitCount = customers.filter(
    (c) =>
      c.currentDebt > c.creditLimit ||
      c.currentDebt / (c.creditLimit || 1) >= 0.85,
  ).length;

  const openCreate = () => {
    setFormMode("create");
    setFormCustomerId(null);
    setForm(emptyForm());
    setFormOpen(true);
  };

  const openEdit = (c: Customer) => {
    setFormMode("edit");
    setFormCustomerId(c.id);
    setForm({
      name: c.name,
      phone: c.phone ?? "",
      address: c.address ?? "",
      type: remixTypeToPrisma(c.type),
      creditLimit: c.creditLimit,
      creditTermDays: c.creditTermDays ?? 30,
      lat: c.hasGps && c.lat ? String(c.lat) : "",
      lng: c.hasGps && c.lng ? String(c.lng) : "",
    });
    setEditVisitPlans(c.visitPlans ?? []);
    setFormOpen(true);
  };

  const handleSubmitForm = (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    if (formMode === "create") {
      onCreateCustomer(form);
    } else if (formCustomerId) {
      onUpdateCustomer(formCustomerId, form);
    }
    setFormOpen(false);
  };

  const handleOpenLimitModal = (c: Customer) => {
    setEditingCustomer(c);
    setNewLimitInput(c.creditLimit);
  };

  const handleSaveLimit = () => {
    if (!editingCustomer) return;
    onUpdateCreditLimit(editingCustomer.id, newLimitInput);
    setEditingCustomer(null);
  };

  return (
    <div id="customers-view" className="w-full space-y-6">
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:flex-row sm:items-center">
        <div className="flex items-center gap-2.5">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600">
            <Users className="size-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
                Quản Lý Khách Hàng &amp; Hạn Mức Công Nợ
              </h2>
              <span className="rounded-full border border-emerald-300 bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                Credit Limit Guard
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              Garage / Fleet, GPS và công nợ — {filteredCustomers.length}/
              {customers.length} khách
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <PageActionMenu
            label="Thao tác"
            items={[
              {
                label: "Xuất Excel Sổ Nợ & Vỏ Phuy",
                icon: FileSpreadsheet,
                onClick: () => exportCustomerDebtReport(customers),
              },
            ]}
          />
          <button
            type="button"
            onClick={openCreate}
            className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-amber-500 px-3.5 py-2 text-xs font-bold text-slate-950 shadow-xs hover:bg-amber-400"
          >
            <Plus className="size-4" />
            <span>Thêm khách hàng</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        <div className="col-span-2 sm:col-span-1 rounded-2xl border border-slate-200 bg-white p-3.5 sm:p-4 shadow-xs">
          <div className="text-xs font-medium text-slate-500">
            Tổng công nợ đang treo
          </div>
          <div className="mt-1 font-mono text-xl sm:text-2xl font-extrabold text-slate-900">
            {formatVND(totalCurrentDebt)}
          </div>
          <div className="mt-0.5 text-[10px] sm:text-[11px] text-slate-400">
            Hạn mức: <strong>{formatVND(totalCreditLimit)}</strong>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Tỷ lệ khai thác hạn mức</span>
            <span
              className={`font-mono font-bold ${
                overallUtilization > 80 ? "text-amber-600" : "text-emerald-600"
              }`}
            >
              {overallUtilization}%
            </span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full ${
                overallUtilization > 85
                  ? "bg-rose-500"
                  : overallUtilization > 60
                    ? "bg-amber-500"
                    : "bg-emerald-500"
              }`}
              style={{ width: `${Math.min(100, overallUtilization)}%` }}
            />
          </div>
          <div className="mt-1.5 text-[11px] font-semibold text-emerald-600">
            Khả dụng: {formatVND(totalCreditLimit - totalCurrentDebt)}
          </div>
        </div>
        <div
          className={`rounded-2xl border p-4 shadow-xs ${
            overLimitCount > 0
              ? "border-amber-200 bg-amber-50/70 text-amber-900"
              : "border-slate-200 bg-white text-slate-900"
          }`}
        >
          <div className="flex items-center justify-between text-xs font-medium">
            <span>Cảnh báo chạm trần &gt;85%</span>
            <ShieldAlert className="size-4 text-amber-600" />
          </div>
          <div className="mt-1 font-mono text-2xl font-extrabold text-amber-800">
            {overLimitCount} điểm bán
          </div>
        </div>
      </div>

      {/* Sequence Diagram: Credit Approval Loop - Admin Queue */}
      {creditOverrideRequests && creditOverrideRequests.some((r) => r.status === "PENDING") && (
        <div className="rounded-2xl border-2 border-amber-300 bg-amber-50/90 p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-amber-200/80 pb-2.5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-5 text-amber-700" />
              <div>
                <h3 className="font-bold text-amber-950 text-sm flex items-center gap-2">
                  <span>Hàng Đợi Phê Duyệt Vượt Trần Nợ (Credit Override Approval Queue)</span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 font-mono text-[10px] font-extrabold">
                    {creditOverrideRequests.filter((r) => r.status === "PENDING").length} đề xuất chờ duyệt
                  </span>
                </h3>
                <p className="text-xs text-amber-800/90">
                  Phê duyệt nợ ngoại lệ dành cho Ban Giám Đốc (ADMIN) khi Sales tạo đơn cho khách quá hạn
                </p>
              </div>
            </div>
            <div className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-amber-900 bg-white/80 px-2.5 py-1 rounded-lg border border-amber-300">
              <UserCheck className="size-3.5 text-amber-700" />
              <span>Quyền ADMIN</span>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-1 lg:grid-cols-2">
            {creditOverrideRequests
              .filter((r) => r.status === "PENDING")
              .map((req) => (
                <div
                  key={req.id}
                  className="rounded-xl border border-amber-200 bg-white p-3.5 shadow-2xs space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-slate-900 text-xs sm:text-sm">
                        {req.customerName}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        Nợ hiện tại: <strong>{formatVND(req.currentDebt)}</strong> / HM: {formatVND(req.creditLimit)}
                      </div>
                    </div>
                    <span className="shrink-0 px-2 py-0.5 rounded-md bg-rose-100 border border-rose-300 text-rose-700 text-[10px] font-extrabold font-mono">
                      Quá hạn {req.overdueDays}d
                    </span>
                  </div>

                  <div className="rounded-lg bg-amber-50/60 p-2.5 border border-amber-100 text-xs text-slate-700 space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Sales đề xuất: <strong>{req.requestedBy}</strong></span>
                      <span className="font-mono">{req.requestedAt}</span>
                    </div>
                    <p className="italic text-slate-800">"{req.reason}"</p>
                    <div className="pt-1 text-[11px] text-amber-950 font-bold flex justify-between">
                      <span>Số tiền xin bảo lãnh cấp đơn:</span>
                      <span className="font-mono text-amber-800 text-xs font-black">{formatVND(req.requestedAmount)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => onRejectCreditOverride && onRejectCreditOverride(req.customerId)}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer"
                    >
                      Từ chối
                    </button>
                    <button
                      type="button"
                      onClick={() => onApproveCreditOverride && onApproveCreditOverride(req.customerId)}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xs flex items-center gap-1 cursor-pointer"
                    >
                      <CheckCircle2 className="size-3.5" />
                      <span>Phê Duyệt Vượt Trần</span>
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs">
        <div className="relative min-w-[240px] flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm tên, mã, SĐT, địa chỉ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-200 py-2 pr-3 pl-9 text-xs focus:border-amber-500 focus:outline-none"
          />
        </div>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="cursor-pointer rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs font-medium text-slate-700"
        >
          <option value="all">Tất cả phân loại</option>
          <option value="Đại lý">Đại lý / Garage</option>
          <option value="Đội xe">Đội xe (FLEET)</option>
        </select>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredCustomers.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-dashed border-slate-200 py-12 text-center text-sm text-slate-500">
            Không có khách hàng phù hợp. Bấm “Thêm khách hàng” để tạo mới.
          </div>
        ) : (
          paginatedCustomers.map((c) => {
            const typeMeta = getTypeMeta(c.type);
            const Icon = typeMeta.icon;
            const ratio = Math.round(
              (c.currentDebt / (c.creditLimit || 1)) * 100,
            );
            const remainingCredit = Math.max(0, c.creditLimit - c.currentDebt);
            const isOverdue = (c.debtAging?.maxOverdueDays ?? 0) > 0 || c.debtAging?.status === "critical";
            const isOverLimit = c.currentDebt >= c.creditLimit;
            // Customer is hard-locked from ordering if they have overdue debt or exceed credit limit,
            // UNLESS the Admin has approved a credit override exception (creditOverridden === true)!
            const isHardLocked = !c.creditOverridden && (isOverdue || isOverLimit);
            const isWarning = (ratio >= 85 || isOverdue) && !isHardLocked && !c.creditOverridden;

            return (
              <div
                key={c.id}
                className={`flex flex-col justify-between rounded-2xl border bg-white p-4 shadow-xs transition-all hover:shadow-md ${
                  isHardLocked ? "border-rose-300 bg-rose-50/10" : "border-slate-200"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <div
                        className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${typeMeta.avatarBg}`}
                      >
                        <Icon className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-bold text-slate-900">
                          {c.name}
                        </h3>
                        <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                          <span
                            className={`rounded border px-1.5 py-0.5 text-[10px] font-bold ${typeMeta.badgeBg}`}
                          >
                            {typeMeta.label}
                          </span>
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                              c.hasGps
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {c.hasGps ? "Đã cắm GPS" : "Chưa có GPS"}
                          </span>
                          {c.creditOverridden && (
                            <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-extrabold text-emerald-800 border border-emerald-300">
                              <ShieldCheck className="size-3 text-emerald-700" />
                              <span>Admin duyệt ngoại lệ</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 space-y-1 text-xs text-slate-500">
                    {c.phone ? (
                      <a
                        href={`tel:${c.phone}`}
                        className="inline-flex items-center gap-1.5 font-medium text-slate-700 hover:text-amber-600 transition-colors"
                        title="Bấm để gọi trực tiếp"
                      >
                        <Phone className="size-3.5 text-amber-600" />
                        <span>{c.phone}</span>
                      </a>
                    ) : null}
                    <div className="hidden sm:flex items-start gap-1.5">
                      <MapPin className="mt-0.5 size-3.5 shrink-0 text-slate-400" />
                      <span className="line-clamp-1">
                        {c.address || "Chưa có địa chỉ"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 space-y-1.5 rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-xs">
                    <div className="flex justify-between font-semibold text-slate-700">
                      <span>Công nợ</span>
                      <span className="font-mono">
                        {formatVND(c.currentDebt)}
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className={`h-full rounded-full ${
                          isHardLocked || isOverLimit || isOverdue
                            ? "bg-rose-500"
                            : isWarning
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                        }`}
                        style={{ width: `${Math.min(100, ratio)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>
                        HM: {formatVND(c.creditLimit)} · {ratio}%
                      </span>
                      <span>Còn {formatVND(remainingCredit)}</span>
                    </div>

                    {c.currentDebt > 0 && (
                      <div className="flex items-center justify-between border-t border-slate-200/60 pt-1 text-[11px]">
                        <span className="text-slate-500">
                          Tuổi nợ ({c.creditTermDays || 30}d):
                        </span>
                        {c.debtAging?.status === "critical" ? (
                          <span className="flex items-center gap-1 font-bold text-rose-600">
                            <AlertCircle className="size-3 shrink-0 text-rose-600" />
                            Quá hạn {c.debtAging.maxOverdueDays}d
                          </span>
                        ) : c.debtAging?.status === "warning" ? (
                          <span className="flex items-center gap-1 font-bold text-amber-600">
                            <AlertCircle className="size-3 shrink-0 text-amber-600" />
                            Quá hạn {c.debtAging.maxOverdueDays}d
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 font-bold text-emerald-600">
                            <CheckCircle2 className="size-3 shrink-0 text-emerald-600" />
                            Trong hạn
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="hidden sm:grid mt-2 grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-2">
                      <span className="flex items-center gap-1 text-[11px] text-slate-500">
                        <Package className="size-3.5 text-cyan-600" />
                        Vỏ
                      </span>
                      <span className="font-mono font-bold text-cyan-900">
                        {c.emptyDrums || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-2">
                      <span className="flex items-center gap-1 text-[11px] text-slate-500">
                        <Calendar className="size-3.5 text-amber-600" />
                        Mua
                      </span>
                      <span className="font-mono font-bold text-slate-800">
                        {c.lastPurchaseDaysAgo < 900
                          ? `${c.lastPurchaseDaysAgo}d`
                          : "—"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
                  <ActionMenu
                    label="Thao tác"
                    variant="outline"
                    align="start"
                    size="default"
                    items={[
                      {
                        label: "Chỉnh sửa thông tin",
                        icon: Pencil,
                        onClick: () => openEdit(c),
                      },
                      {
                        label: "Cài đặt hạn mức & công nợ",
                        icon: Sliders,
                        onClick: () => handleOpenLimitModal(c),
                      },
                      ...(c.currentDebt > 0
                        ? [
                            {
                              label: "Lập phiếu thu nợ",
                              icon: Receipt,
                              badge: formatVND(c.currentDebt),
                              onClick: () => setSelectedCollectCustomer(c),
                            } as ActionMenuItem,
                          ]
                        : []),
                      {
                        label: "Gửi đối soát Zalo",
                        icon: MessageCircle,
                        onClick: () => setZaloCustomer(c),
                      },
                      ...(isHardLocked && onApproveCreditOverride
                        ? [
                            {
                              label: "Duyệt ngoại lệ Admin",
                              icon: ShieldCheck,
                              onClick: () => onApproveCreditOverride(c.id),
                            } as ActionMenuItem,
                          ]
                        : []),
                      "separator",
                      {
                        label: "Xóa khách hàng",
                        icon: Trash2,
                        variant: "destructive",
                        onClick: () => {
                          if (
                            confirm(
                              `Xóa khách hàng “${c.name}”? Thao tác không hoàn tác.`,
                            )
                          ) {
                            onDeleteCustomer(c.id);
                          }
                        },
                      },
                    ]}
                  />

                  <button
                    type="button"
                    onClick={() => {
                      if (isHardLocked) {
                        setSelectedLockedCustomer(c);
                        setShowCreditLockModal(true);
                      } else {
                        onNavigateToSales(c.id);
                      }
                    }}
                    className={`flex h-8 cursor-pointer items-center gap-1.5 rounded-xl px-3.5 text-xs font-bold transition shadow-2xs ${
                      isHardLocked
                        ? "bg-rose-100 text-rose-800 border border-rose-300 hover:bg-rose-200"
                        : c.creditOverridden
                          ? "bg-emerald-500 text-white hover:bg-emerald-600"
                          : "bg-amber-500 text-slate-950 hover:bg-amber-400"
                    }`}
                    title={
                      isHardLocked
                        ? `Quá hạn ${c.debtAging?.maxOverdueDays || 122}d - Khóa cứng lên đơn (Cần ADMIN duyệt)`
                        : c.creditOverridden
                          ? "Đã duyệt ngoại lệ - Lên đơn"
                          : "Lên đơn"
                    }
                  >
                    {isHardLocked && <Lock className="size-3.5 text-rose-700" />}
                    <span>{isHardLocked ? "Khóa Nợ" : "Lên đơn"}</span>
                    <ArrowRight className="size-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        startIndex={startIndex}
        endIndex={endIndex}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
        itemLabel="khách hàng"
      />

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <form
            onSubmit={handleSubmitForm}
            className="w-full max-w-md space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="text-base font-bold text-slate-900">
                {formMode === "create" ? "Thêm khách hàng" : "Sửa khách hàng"}
              </h4>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="text-slate-400"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Tên *
                </label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    SĐT
                  </label>
                  <input
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Loại
                  </label>
                  <select
                    value={form.type}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        type: e.target.value as "GARAGE" | "FLEET",
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                  >
                    <option value="GARAGE">Garage / Đại lý</option>
                    <option value="FLEET">Đội xe</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Địa chỉ
                </label>
                <input
                  value={form.address}
                  onChange={(e) =>
                    setForm({ ...form, address: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Hạn mức nợ (VNĐ)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.creditLimit}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        creditLimit: Number(e.target.value) || 0,
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 font-mono text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Hạn nợ tối đa (Ngày)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={form.creditTermDays ?? 30}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        creditTermDays: Number(e.target.value) || 30,
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 font-mono text-xs font-bold"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 flex items-center gap-1 text-xs font-semibold text-slate-700">
                    <Navigation className="size-3" /> Lat
                  </label>
                  <input
                    value={form.lat}
                    onChange={(e) => setForm({ ...form, lat: e.target.value })}
                    placeholder="10.77"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Lng
                  </label>
                  <input
                    value={form.lng}
                    onChange={(e) => setForm({ ...form, lng: e.target.value })}
                    placeholder="106.70"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 font-mono text-xs"
                  />
                </div>
              </div>
              {formMode === "edit" && formCustomerId ? (
                <VisitDatesEditor
                  customerId={formCustomerId}
                  plans={editVisitPlans}
                  onPlansChange={(plans) => {
                    setEditVisitPlans(plans);
                    onVisitPlansUpdated?.(formCustomerId, plans);
                  }}
                />
              ) : (
                <p className="text-xs text-slate-500 italic rounded-xl border border-dashed border-slate-200 px-3 py-2">
                  Sau khi tạo khách hàng, mở Sửa để thêm các ngày ghé cụ thể trên
                  lịch.
                </p>
              )}
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="rounded-xl bg-amber-500 px-5 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400"
              >
                {formMode === "create" ? "Tạo khách" : "Lưu"}
              </button>
            </div>
          </form>
        </div>
      )}

      {editingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
            <h4 className="text-base font-bold text-slate-900">
              Điều chỉnh hạn mức — {editingCustomer.name}
            </h4>
            <input
              type="number"
              min={0}
              value={newLimitInput}
              onChange={(e) => setNewLimitInput(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono text-sm font-bold"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingCustomer(null)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSaveLimit}
                className="rounded-xl bg-amber-500 px-5 py-2 text-xs font-bold text-slate-950"
              >
                Lưu hạn mức
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedCollectCustomer && (
        <CollectDebtModal
          customer={selectedCollectCustomer}
          isOpen={Boolean(selectedCollectCustomer)}
          onClose={() => setSelectedCollectCustomer(null)}
          onSuccess={(customerId, amount) => {
            onPayDebt?.(customerId, amount);
          }}
        />
      )}

      {/* 1-Click Zalo Direct Chat Notification Modal */}
      <ZaloShareModal
        isOpen={Boolean(zaloCustomer)}
        onClose={() => setZaloCustomer(null)}
        customer={zaloCustomer}
        initialTemplate="debt"
      />

      {/* Sequence Diagram: Credit Hard-Lock Modal for Overdue / Over-limit Customers */}
      {showCreditLockModal && selectedLockedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg space-y-4 rounded-2xl border border-rose-300 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b border-rose-100 pb-3">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-rose-100 p-2.5 text-rose-700">
                  <AlertOctagon className="size-6" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-extrabold uppercase">
                    Chính sách tín dụng B2B
                  </div>
                  <h3 className="font-display text-base sm:text-lg font-black text-rose-950 mt-0.5">
                    CẢNH BÁO NỢ QUÁ HẠN — KHÓA CỨNG LÊN ĐƠN
                  </h3>
                  <p className="text-xs text-rose-700">
                    Khách hàng: <strong>{selectedLockedCustomer.name}</strong> ({selectedLockedCustomer.phone || "Chưa có SĐT"})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowCreditLockModal(false);
                  setSelectedLockedCustomer(null);
                }}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Chi tiết vi phạm công nợ */}
            <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-4 space-y-2.5 text-xs text-rose-900">
              <div className="flex justify-between">
                <span>Dư nợ hiện tại:</span>
                <strong className="font-mono text-sm text-rose-950 font-black">
                  {formatVND(selectedLockedCustomer.currentDebt)}
                </strong>
              </div>
              <div className="flex justify-between">
                <span>Hạn mức tín dụng được cấp:</span>
                <span className="font-mono font-semibold">
                  {formatVND(selectedLockedCustomer.creditLimit)}
                </span>
              </div>
              <div className="flex justify-between border-t border-rose-200 pt-2 font-bold text-rose-950">
                <span>Tình trạng tuổi nợ:</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-600 text-white font-mono font-black text-xs">
                  Quá hạn {selectedLockedCustomer.debtAging?.maxOverdueDays || 122} ngày
                </span>
              </div>
            </div>

            <div className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <p className="font-bold text-slate-800 mb-1">Quy định phê duyệt nợ (Credit Approval Loop):</p>
              <p>
                Hệ thống tự động khóa tính năng lên đơn mới trên PWA và Desktop nhằm phòng ngừa nợ xấu.
                Để tiếp tục lên đơn, Sales phải gửi yêu cầu <strong>Phê Duyệt Vượt Trần (Credit Override)</strong> tới <strong>Ban Giám Đốc (ADMIN)</strong>.
              </p>
            </div>

            {/* Form xin duyệt vượt trần */}
            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Lý do xin bảo lãnh / vượt trần ngoại lệ:
                </label>
                <textarea
                  rows={2}
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="Nhập cam kết thanh toán hoặc lý do cấp bách của khách..."
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Số tiền đơn hàng dự kiến xin duyệt (VNĐ):
                </label>
                <input
                  type="number"
                  value={overrideAmount}
                  onChange={(e) => setOverrideAmount(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-300 p-2 font-mono font-bold text-xs text-slate-900 focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setShowCreditLockModal(false);
                  setSelectedLockedCustomer(null);
                }}
                className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onRequestCreditOverride) {
                    onRequestCreditOverride(
                      selectedLockedCustomer.id,
                      overrideReason,
                      overrideAmount
                    );
                  }
                  soundFX.playSuccess();
                  setShowCreditLockModal(false);
                  setSelectedLockedCustomer(null);
                }}
                className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 shadow-xs cursor-pointer"
              >
                <Send className="size-3.5" />
                <span>Gửi Yêu Cầu Duyệt Vượt Trần Tới ADMIN</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onApproveCreditOverride) {
                    onApproveCreditOverride(selectedLockedCustomer.id);
                  }
                  setShowCreditLockModal(false);
                  setSelectedLockedCustomer(null);
                }}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 shadow-xs cursor-pointer"
              >
                <ShieldCheck className="size-3.5" />
                <span>Admin Duyệt Ngay</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
