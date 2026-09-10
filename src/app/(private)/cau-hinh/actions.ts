"use server";

import { revalidatePath } from "next/cache";
import {
  getSystemSettings,
  updateSystemSettings,
  resetSystemSettings,
  DEFAULT_SYSTEM_SETTINGS,
  type SystemSettingDto,
} from "@/lib/data/settings";
import { getSessionDbUser, requireRoles } from "@/lib/auth";

export async function fetchSystemSettingsAction(): Promise<{
  success: boolean;
  data?: SystemSettingDto;
  error?: string;
}> {
  try {
    const data = await getSystemSettings();
    return { success: true, data };
  } catch (err: any) {
    console.error("[fetchSystemSettingsAction error]:", err);
    return { success: false, error: err.message || "Không thể tải cấu hình hệ thống." };
  }
}

export async function saveSystemSettingsAction(
  input: Partial<typeof DEFAULT_SYSTEM_SETTINGS>
): Promise<{
  success: boolean;
  data?: SystemSettingDto;
  message?: string;
  error?: string;
}> {
  try {
    const dbUser = await requireRoles(["ADMIN"]);
    const updatedBy = `${dbUser.name} (${dbUser.email})`;

    const data = await updateSystemSettings(input, updatedBy);
    revalidatePath("/cau-hinh");
    revalidatePath("/");

    return {
      success: true,
      data,
      message: "Đã lưu cấu hình thành công vào cơ sở dữ liệu!",
    };
  } catch (err: any) {
    console.error("[saveSystemSettingsAction error]:", err);
    return {
      success: false,
      error: err.message || "Lỗi lưu cấu hình vào cơ sở dữ liệu.",
    };
  }
}

export async function resetSystemSettingsAction(): Promise<{
  success: boolean;
  data?: SystemSettingDto;
  message?: string;
  error?: string;
}> {
  try {
    const dbUser = await requireRoles(["ADMIN"]);
    const updatedBy = `${dbUser.name} (${dbUser.email})`;

    const data = await resetSystemSettings(updatedBy);
    revalidatePath("/cau-hinh");

    return {
      success: true,
      data,
      message: "Đã khôi phục cấu hình mặc định trong cơ sở dữ liệu!",
    };
  } catch (err: any) {
    console.error("[resetSystemSettingsAction error]:", err);
    return {
      success: false,
      error: err.message || "Lỗi khôi phục cấu hình mặc định.",
    };
  }
}
