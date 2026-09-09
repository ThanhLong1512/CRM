import { Customer, Order } from "@/types";

/**
 * Client-side CSV exporter with UTF-8 BOM (\uFEFF)
 * Ensures 100% correct Vietnamese diacritics rendering in Microsoft Excel on Windows & Mac.
 */
export function exportToCsv(
  filename: string,
  headers: string[],
  rows: (string | number | undefined | null)[][]
) {
  const escapeCell = (cell: string | number | undefined | null): string => {
    if (cell === undefined || cell === null) return '""';
    const str = String(cell);
    // If cell contains commas, newlines, or quotes, wrap in quotes and escape internal quotes
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return `"${str}"`;
  };

  const csvRows: string[] = [];
  csvRows.push(headers.map(escapeCell).join(','));

  for (const row of rows) {
    csvRows.push(row.map(escapeCell).join(','));
  }

  const csvContent = '\uFEFF' + csvRows.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export Customer Debt & Drum Ledger to Excel-compatible CSV
 */
export function exportCustomerDebtReport(customers: Customer[]) {
  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `Bao_Cao_Cong_No_Khach_Hang_${dateStr}`;

  const headers = [
    "Mã Khách Hàng",
    "Tên Đại Lý / Garage",
    "Phân Loại Khách",
    "Số Điện Thoại",
    "Khu Vực Tuyến",
    "Thứ Viếng Thăm",
    "Hạn Mức Tín Dụng (VNĐ)",
    "Hạn Nợ (Ngày)",
    "Dư Nợ Hiện Tại (VNĐ)",
    "Trạng Thái Nợ",
    "Tồn Vỏ Phuy (Cái)",
    "Tiền Cọc Vỏ (VNĐ)",
    "Phân Khúc Khách (RFM)",
    "Ngày Mua Gần Nhất (Ngày Trước)",
  ];

  const rows = customers.map((c) => {
    const isOver = c.currentDebt > c.creditLimit;
    const debtStatus = isOver
      ? "Vượt hạn mức!"
      : c.currentDebt > 0
      ? "Trong hạn mức"
      : "Không có dư nợ";

    const drumCount = c.drumBalance ?? c.emptyDrums ?? 0;

    return [
      c.id,
      c.name,
      c.type,
      c.phone || "",
      c.route || "Tuyến trung tâm",
      c.visitDay || "",
      c.creditLimit,
      c.creditTermDays || 30,
      c.currentDebt,
      debtStatus,
      drumCount,
      drumCount * 300000,
      c.rfmSegment || "Chưa xếp hạng",
      c.lastPurchaseDaysAgo ?? 0,
    ];
  });

  exportToCsv(filename, headers, rows);
}

/**
 * Export Sales & Volume (Liters) Report to Excel-compatible CSV
 */
export function exportOrdersReport(orders: Order[]) {
  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `Bao_Cao_Don_Hang_San_Luong_${dateStr}`;

  const headers = [
    "Mã Đơn Hàng",
    "Thời Gian Tạo",
    "Khách Hàng",
    "Phân Loại",
    "Trạng Thái Đơn",
    "Sản Lượng (Lít)",
    "Tiền Hàng Gốc (VNĐ)",
    "Chiết Khấu (%)",
    "Tiền Giảm Trừ (VNĐ)",
    "Thanh Toán (VNĐ)",
    "Giao Phuy (Cái)",
    "Thu Vỏ Phuy (Cái)",
    "Cọc Phuy (VNĐ)",
    "Quà Tặng / Khuyến Mại",
    "Vượt Nợ",
  ];

  const rows = orders.map((o) => {
    const totalLiters =
      o.totalLiters ||
      o.items?.reduce((sum, item) => {
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

    const rawTotal =
      o.items?.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0) || o.total;

    return [
      o.id,
      new Date(o.createdAt || Date.now()).toLocaleString("vi-VN"),
      o.customer,
      o.customerType,
      o.status,
      totalLiters,
      rawTotal,
      o.discountPercent || 0,
      o.discountAmount || 0,
      o.total,
      o.drumExchange?.delivered || 0,
      o.drumExchange?.returned || 0,
      (o.drumExchange?.delivered || 0) * 300000,
      o.promotionNotes || "",
      o.isOverCredit ? "Có" : "Không",
    ];
  });

  exportToCsv(filename, headers, rows);
}
