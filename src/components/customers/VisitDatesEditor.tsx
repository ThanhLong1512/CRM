"use client";

import { useState, useTransition } from "react";
import { Calendar, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  addCustomerVisitDate,
  removeCustomerVisitDate,
} from "@/app/(private)/khach-hang/visit-plan-actions";
import { formatVisitDateLabel } from "@/lib/visit-plan";

export type VisitPlanItem = {
  id: string;
  visitDate: string;
  note?: string | null;
};

type VisitDatesEditorProps = {
  customerId: string;
  plans: VisitPlanItem[];
  onPlansChange: (plans: VisitPlanItem[]) => void;
  disabled?: boolean;
};

export function VisitDatesEditor({
  customerId,
  plans,
  onPlansChange,
  disabled = false,
}: VisitDatesEditorProps) {
  const [newDate, setNewDate] = useState("");
  const [pending, startTransition] = useTransition();

  const sortedPlans = [...plans].sort((a, b) =>
    a.visitDate.localeCompare(b.visitDate),
  );

  const handleAdd = () => {
    if (!newDate || !customerId) return;
    startTransition(async () => {
      const result = await addCustomerVisitDate({
        customerId,
        visitDate: newDate,
      });
      if (!result.success || !result.planId || !result.visitDate) {
        toast.error(result.error ?? result.message);
        return;
      }
      toast.success(result.message);
      onPlansChange(
        [...plans, { id: result.planId, visitDate: result.visitDate }].sort(
          (a, b) => a.visitDate.localeCompare(b.visitDate),
        ),
      );
      setNewDate("");
    });
  };

  const handleRemove = (plan: VisitPlanItem) => {
    startTransition(async () => {
      const result = await removeCustomerVisitDate({ planId: plan.id });
      if (!result.success) {
        toast.error(result.error ?? result.message);
        return;
      }
      toast.success(result.message);
      onPlansChange(plans.filter((p) => p.id !== plan.id));
    });
  };

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/80 p-3">
      <div className="flex items-center gap-2">
        <Calendar className="size-4 text-amber-500" />
        <span className="text-xs font-black uppercase tracking-wide text-slate-700">
          Lịch ghé (ngày cụ thể)
        </span>
      </div>

      <div className="flex gap-2">
        <input
          type="date"
          value={newDate}
          onChange={(e) => setNewDate(e.target.value)}
          disabled={disabled || pending || !customerId}
          className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-mono"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={disabled || pending || !customerId || !newDate}
          className="inline-flex items-center gap-1 rounded-lg bg-amber-500 px-3 py-2 text-xs font-bold text-slate-950 disabled:opacity-50"
        >
          <Plus className="size-3.5" />
          Thêm
        </button>
      </div>

      {sortedPlans.length === 0 ? (
        <p className="text-xs text-slate-500 italic">
          Chưa có ngày ghé — thêm ngày cụ thể (vd. tuần này 10/09, tuần sau
          17/09).
        </p>
      ) : (
        <ul className="space-y-1.5">
          {sortedPlans.map((plan) => (
            <li
              key={plan.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2"
            >
              <div className="min-w-0">
                <span className="text-xs font-bold font-mono text-slate-900">
                  {formatVisitDateLabel(plan.visitDate)}
                </span>
                <span className="ml-2 text-[11px] text-slate-400">
                  {plan.visitDate}
                </span>
                {plan.note ? (
                  <p className="text-[11px] text-slate-500 truncate">{plan.note}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => handleRemove(plan)}
                disabled={disabled || pending}
                className="shrink-0 rounded-md p-1.5 text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                title="Xóa ngày ghé"
              >
                <Trash2 className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
