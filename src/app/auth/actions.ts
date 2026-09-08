"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export type AuthActionState = {
  error: string | null;
  success?: string | null;
};

export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function requestPasswordReset(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) {
    return { error: "Vui lòng nhập email đã đăng ký." };
  }

  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  const origin =
    siteUrl ||
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3020");

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/dat-lai-mat-khau`,
  });

  if (error) {
    return { error: error.message };
  }

  return {
    error: null,
    success:
      "Đã gửi email khôi phục. Mở link trong hộp thư để đặt mật khẩu mới.",
  };
}

export async function changePassword(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!currentPassword || !newPassword) {
    return { error: "Vui lòng điền đầy đủ mật khẩu." };
  }
  if (newPassword.length < 6) {
    return { error: "Mật khẩu mới phải có tối thiểu 6 ký tự." };
  }
  if (newPassword !== confirmPassword) {
    return { error: "Mật khẩu xác nhận không khớp." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return { error: "Phiên đăng nhập đã hết hạn." };
  }

  const { error: reauthError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });
  if (reauthError) {
    return { error: "Mật khẩu hiện tại không đúng." };
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) {
    return { error: error.message };
  }

  return { error: null, success: "Đã cập nhật mật khẩu thành công." };
}
