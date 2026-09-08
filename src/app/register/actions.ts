"use server";

import { redirect } from "next/navigation";
import type { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";

export type SignupState = {
  error: string | null;
};

function mapRegRole(raw: string): UserRole {
  const v = raw.trim().toLowerCase();
  if (v === "accountant" || v === "ketoan") return "ACCOUNTANT";
  if (v === "director" || v === "admin") return "ADMIN";
  return "SALES";
}

export async function signup(
  _prevState: SignupState,
  formData: FormData,
): Promise<SignupState> {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const phone = String(formData.get("phone") ?? "").trim();
  const role = mapRegRole(String(formData.get("role") ?? "sales"));

  if (!fullName || !email || !password) {
    return { error: "Vui lòng điền đầy đủ họ tên, email và mật khẩu." };
  }

  if (password.length < 6) {
    return { error: "Mật khẩu phải có ít nhất 6 ký tự." };
  }

  const confirm = String(formData.get("confirmPassword") ?? "");
  if (confirm && confirm !== password) {
    return { error: "Mật khẩu xác nhận không khớp." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, phone },
    },
  });

  if (error) {
    return { error: error.message };
  }

  try {
    await prisma.user.upsert({
      where: { email },
      update: { name: fullName, role },
      create: {
        email,
        name: fullName,
        role,
      },
    });
  } catch (prismaError) {
    return {
      error:
        prismaError instanceof Error
          ? prismaError.message
          : "Không thể tạo hồ sơ người dùng trong hệ thống.",
    };
  }

  redirect("/dashboard?login=success");
}
