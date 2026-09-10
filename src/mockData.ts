/**
 * ==============================================================================
 * DỮ LIỆU ĐÃ ĐƯỢC CHUYỂN ĐỔI 100% SANG POSTGRESQL DATABASE (PRISMA ORM)
 * ==============================================================================
 * Toàn bộ dữ liệu nghiệp vụ (Sản phẩm, Khách hàng, Đội xe, Đơn hàng, Sổ phuy,
 * Nhân sự) hiện được nạp động từ Cơ sở dữ liệu và lưu trữ bền vững (persist DB).
 * Các mảng mock dữ liệu gán cứng bên dưới đã được loại bỏ hoàn toàn.
 */

import { Product, Customer, FleetVehicle, Order, DrumTransaction, SalesStaff } from './types';
import { haversineMeters } from '@/lib/geo';
import { formatVND as formatVNDHelper } from '@/lib/remix/mappers';

/** @deprecated Dữ liệu sản phẩm hiện được nạp 100% từ bảng Product trong DB */
export const INITIAL_PRODUCTS: Product[] = [];

/** @deprecated Dữ liệu khách hàng hiện được nạp 100% từ bảng Customer trong DB */
export const INITIAL_CUSTOMERS: Customer[] = [];

/** @deprecated Dữ liệu phương tiện hiện được nạp 100% từ bảng FleetVehicle trong DB */
export const INITIAL_FLEET_VEHICLES: FleetVehicle[] = [];

/** @deprecated Dữ liệu đơn hàng hiện được nạp 100% từ bảng Order trong DB */
export const INITIAL_ORDERS: Order[] = [];

/** @deprecated Dữ liệu giao dịch phuy hiện được nạp 100% từ bảng DrumTransaction trong DB */
export const INITIAL_DRUM_TRANSACTIONS: DrumTransaction[] = [];

/** @deprecated Dữ liệu nhân sự hiện được nạp 100% từ bảng User trong DB */
export const INITIAL_SALES_STAFF: SalesStaff[] = [];

/**
 * Công thức Haversine tính khoảng cách giữa 2 tọa độ GPS theo mét
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  return haversineMeters(lat1, lon1, lat2, lon2);
}

/**
 * Định dạng tiền tệ VNĐ chuẩn với dấu chấm phân cách hàng nghìn
 */
export function formatVND(amount: number | string | null | undefined): string {
  return formatVNDHelper(amount);
}
