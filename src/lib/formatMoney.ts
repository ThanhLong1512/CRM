/**
 * Utility chuẩn hóa định dạng tiền tệ trong toàn bộ hệ thống
 * Đảm bảo phân cách hàng nghìn luôn là dấu chấm '.' (Ví dụ: 1.000.000)
 * Hoạt động độc lập và nhất quán 100% trên mọi trình duyệt và hệ điều hành.
 */

/**
 * Format số tiền thành dạng chuỗi phân cách hàng nghìn bằng dấu chấm (Ví dụ: 1.000.000)
 */
export function formatMoney(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || amount === "") return "0";
  const num = Math.round(Number(amount));
  if (isNaN(num)) return "0";
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/**
 * Format số tiền có hậu tố đơn vị (Mặc định: 1.000.000 đ)
 */
export function formatVND(
  amount: number | string | null | undefined,
  includeUnit: boolean = true
): string {
  const formatted = formatMoney(amount);
  return includeUnit ? `${formatted} đ` : formatted;
}

/**
 * Bộ formatter tương thích với Intl.NumberFormat
 */
export const vndFormatter = {
  format: (amount: number | string | null | undefined) => formatVND(amount),
};
