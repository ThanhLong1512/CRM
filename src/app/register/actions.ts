"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";

export type SignupState = {
  error: string | null;
};

export async function signup(
  _prevState: SignupState,
  formData: FormData,
): Promise<SignupState> {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!fullName || !email || !password) {
    return { error: "Vui lòng điền đầy đủ họ tên, email và mật khẩu." };
  }

  if (password.length < 6) {
    return { error: "Mật khẩu phải có ít nhất 6 ký tự." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
    },
  });

  if (error) {
    return { error: error.message };
  }

  try {
    await prisma.user.upsert({
      where: { email },
      update: { name: fullName },
      create: {
        email,
        name: fullName,
        role: "SALES",
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

  redirect("/dashboard");
}
