"use client";

import { useMemo, useState, type FormEvent } from "react";
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
} from "lucide-react";

export type CustomerFormInput = {
  name: string;
  phone: string;
  address: string;
  type: "GARAGE" | "FLEET";
  creditLimit: number;
  lat: string;
  lng: string;
};

interface CustomersViewProps {
  customers: Customer[];
  onUpdateCreditLimit: (customerId: string, newLimit: number) => void;
  onNavigateToSales: (customerId: string) => void;
  onCreateCustomer: (input: CustomerFormInput) => void;
  onUpdateCustomer: (customerId: string, input: CustomerFormInput) => void;
  onDeleteCustomer: (customerId: string) => void;
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
  onDeleteCustomer,
}: CustomersViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");

  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [newLimitInput, setNewLimitInput] = useState(0);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [formCustomerId, setFormCustomerId] = useState<string | null>(null);
  const [form, setForm] = useState<CustomerFormInput>(emptyForm);

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
      lat: c.hasGps && c.lat ? String(c.lat) : "",
      lng: c.hasGps && c.lng ? String(c.lng) : "",
    });
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
        <button
          type="button"
          onClick={openCreate}
          className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-amber-500 px-3.5 py-2 text-xs font-bold text-slate-950 shadow-xs hover:bg-amber-400"
        >
          <Plus className="size-4" />
          Thêm khách hàng
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="text-xs font-medium text-slate-500">
            Tổng công nợ đang treo
          </div>
          <div className="mt-1 font-mono text-2xl font-extrabold text-slate-900">
            {formatVND(totalCurrentDebt)}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
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
          filteredCustomers.map((c) => {
            const typeMeta = getTypeMeta(c.type);
            const Icon = typeMeta.icon;
            const ratio = Math.round(
              (c.currentDebt / (c.creditLimit || 1)) * 100,
            );
            const remainingCredit = Math.max(0, c.creditLimit - c.currentDebt);
            const isLocked = c.currentDebt >= c.creditLimit;
            const isWarning = ratio >= 85 && !isLocked;

            return (
              <div
                key={c.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-xs transition-all hover:shadow-md"
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
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 space-y-1 text-xs text-slate-500">
                    {c.phone ? (
                      <div className="flex items-center gap-1.5">
                        <Phone className="size-3.5" />
                        {c.phone}
                      </div>
                    ) : null}
                    <div className="flex items-start gap-1.5">
                      <MapPin className="mt-0.5 size-3.5 shrink-0" />
                      <span className="line-clamp-2">
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
                          isLocked
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
                  </div>

                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
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

                <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-3">
                  <button
                    type="button"
                    onClick={() => openEdit(c)}
                    className="flex cursor-pointer items-center gap-1 rounded-lg border border-slate-200 px-2 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <Pencil className="size-3.5" />
                    Sửa
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenLimitModal(c)}
                    className="flex cursor-pointer items-center gap-1 rounded-lg border border-slate-200 px-2 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <Sliders className="size-3.5" />
                    Hạn mức
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        confirm(
                          `Xóa khách hàng “${c.name}”? Thao tác không hoàn tác.`,
                        )
                      ) {
                        onDeleteCustomer(c.id);
                      }
                    }}
                    className="flex cursor-pointer items-center gap-1 rounded-lg border border-rose-200 px-2 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                  >
                    <Trash2 className="size-3.5" />
                    Xóa
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigateToSales(c.id)}
                    className="ml-auto flex cursor-pointer items-center gap-1 rounded-lg bg-amber-500 px-2.5 py-1.5 text-xs font-bold text-slate-950 hover:bg-amber-400"
                  >
                    Lên đơn
                    <ArrowRight className="size-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

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
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Hạn mức công nợ (VNĐ)
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
    </div>
  );
}
