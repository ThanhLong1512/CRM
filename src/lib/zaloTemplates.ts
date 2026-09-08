import { Customer, Order } from "@/types";
import { formatVND } from "@/lib/remix/mappers";

/**
 * Clean phone number for Zalo direct chat link (https://zalo.me/09xxxxxxx)
 */
export function getZaloChatUrl(phone?: string): string {
  if (!phone) return "https://zalo.me";
  const cleaned = phone.replace(/[^0-9]/g, "");
  return `https://zalo.me/${cleaned}`;
}

/**
 * Template 1: Order Confirmation & Delivery Notice
 */
export function formatOrderConfirmationZalo(order: Order, customer?: Customer): string {
  const customerName = customer?.name || order.customer;
  const totalLiters =
    order.totalLiters ||
    order.items?.reduce((sum, item) => {
      const vol =
        item.packageType === "Phuy 200L"
          ? 200
          : item.packageType === "Thùng 18L"
          ? 18
          : item.packageType === "Xô 4L"
          ? 4
          : 1;
      return sum + item.quantity * vol;
    }, 0) || 0;

  const itemSummary = (order.items || [])
    .map(
      (it, idx) =>
        `${idx + 1}. ${it.productName} (${it.packageType || "Thùng"}): ${it.quantity} x ${formatVND(it.unitPrice)}`
    )
    .join("\n");

  const drumDelivered = order.drumExchange?.delivered || 0;
  const drumReturned = order.drumExchange?.returned || 0;

  return `Kính gửi Quý khách ${customerName},
NPP Dầu Nhớt trân trọng xác nhận Đơn hàng #${order.id.slice(-6)}:

📦 DANH SÁCH MẶT HÀNG:
${itemSummary}

💰 TỔNG CỘNG: ${formatVND(order.total)} (${totalLiters} Lít)
${order.discountAmount ? `🎁 Đã chiết khấu: -${formatVND(order.discountAmount)}\n` : ""}🛢️ Giao phuy: ${drumDelivered} cái | Thu vỏ: ${drumReturned} cái
${order.promotionNotes ? `🎉 Quà tặng kèm: ${order.promotionNotes}\n` : ""}
Xe tải bên em sẽ giao tới Garage của Quý khách trong ngày. Quý khách vui lòng chuẩn bị sẵn vỏ phuy rỗng (nếu có) để tài xế thu hồi.
Trân trọng cảm ơn Quý khách!`;
}

/**
 * Template 2: Debt & Drum Holdings Statement
 */
export function formatDebtReminderZalo(customer: Customer): string {
  const drumCount = customer.drumBalance ?? customer.emptyDrums ?? 0;
  return `Kính gửi Quý garage ${customer.name},
NPP Dầu Nhớt gửi Quý khách bảng đối soát công nợ & sổ vỏ phuy định kỳ:

📊 TÌNH TRẠNG CÔNG NỢ:
- Dư nợ hiện tại: ${formatVND(customer.currentDebt)}
- Hạn mức tín dụng: ${formatVND(customer.creditLimit)}
- Hạn nợ quy định: ${customer.creditTermDays || 30} ngày

🛢️ TỒN VỎ PHUY THÉP ĐANG KÝ GỬI:
- Số lượng vỏ phuy đang ở tiệm: ${drumCount} vỏ
- Giá trị cọc vỏ tương ứng: ${formatVND(drumCount * 300000)}

Quý khách vui lòng thu xếp thanh toán hoặc gom sẵn vỏ phuy rỗng khi xe tải giao hàng tới đổi nhé ạ.
Trân trọng cảm ơn Quý khách!`;
}

/**
 * Template 3: Promotional Gift & Display Stand Notice
 */
export function formatPromoGiftZalo(customer: Customer, promoText?: string): string {
  return `Kính gửi Quý garage ${customer.name},
NPP Dầu Nhớt gửi Quý khách chương trình quà tặng tri ân khách hàng tháng này:

🎁 CHƯƠNG TRÌNH KHUYẾN MẠI ĐẶC BIỆT:
${promoText || `- Tặng ngay 01 Áo mưa cao cấp + 01 Nón bảo hiểm khi nhập từ 02 thùng nhớt 18L.
- Tặng 01 Kệ sắt trưng bày dầu nhớt chuyên nghiệp hoặc Bảng hiệu tiệm sửa xe khi nhập từ 02 Phuy 200L.
- Tích lũy điểm thưởng đổi quà cuối năm.`}

Chương trình áp dụng số lượng có hạn. Quý khách phản hồi tin nhắn này hoặc liên hệ nhân viên phụ trách tuyến để giữ phần quà nhé!`;
}

/**
 * Template 4: Hunger Alert - Oil Depletion Reorder Reminder
 */
export function formatHungerAlertZalo(customer: Customer, favoriteSkuName?: string): string {
  return `Kính gửi Quý garage ${customer.name},
Theo dõi lịch sử chu kỳ thay dầu tại tiệm, bên em dự kiến lượng nhớt phuy ${favoriteSkuName || "15W-40 CI-4"} của garage sắp cạn trong 2-3 ngày tới.

Hôm nay xe tải bên em đang có chuyến giao hàng qua tuyến của tiệm, có hỗ trợ đổi vỏ phuy rỗng luôn.
Garage có cần bổ sung thêm phuy/thùng nào không để em báo kho xếp xe giao sớm cho garage luôn nhé ạ?
Chúc garage một ngày đông khách!`;
}
