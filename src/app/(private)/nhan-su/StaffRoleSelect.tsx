"use client";

import { useTransition } from "react";
import type { UserRole } from "@prisma/client";
import { toast } from "sonner";
import { updateUserRole } from "@/app/(private)/nhan-su/actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ROLE_OPTIONS: UserRole[] = [
  "ADMIN",
  "SALES",
  "FLEET",
  "DEALER",
  "ACCOUNTANT",
];

type StaffRoleSelectProps = {
  userId: string;
  role: UserRole;
  disabled?: boolean;
};

export function StaffRoleSelect({
  userId,
  role,
  disabled = false,
}: StaffRoleSelectProps) {
  const [pending, startTransition] = useTransition();

  function handleChange(value: string | null) {
    if (!value || value === role) return;

    startTransition(async () => {
      const result = await updateUserRole(userId, value);
      if (!result.success) {
        toast.error(result.error ?? result.message);
        return;
      }
      toast.success(result.message);
    });
  }

  return (
    <Select
      value={role}
      onValueChange={handleChange}
      disabled={disabled || pending}
    >
      <SelectTrigger className="w-[150px]" aria-label="Đổi vai trò">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ROLE_OPTIONS.map((option) => (
          <SelectItem key={option} value={option}>
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
