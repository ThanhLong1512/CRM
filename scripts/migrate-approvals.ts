import { PrismaClient, ApprovalTargetType, ApprovalStatus } from "@prisma/client";

const prisma = new PrismaClient();

function formatVND(amount: number): string {
  return new Intl.NumberFormat("vi-VN").format(amount);
}

async function migrateApprovals() {
  console.log("=== BẮT ĐẦU MIGRATE DỮ LIỆU SANG APPROVALREQUEST ===");

  let migratedReceipts = 0;
  let updatedReceipts = 0;
  let migratedOrders = 0;

  // 1. Migrate Phiếu Thu Nợ (DebtPayment)
  const debtPayments = await prisma.debtPayment.findMany({
    include: {
      customer: { select: { id: true, name: true } },
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  console.log(`Tìm thấy ${debtPayments.length} phiếu thu nợ trong hệ thống.`);

  for (const dp of debtPayments) {
    const existing = await prisma.approvalRequest.findFirst({
      where: {
        targetType: ApprovalTargetType.DEBT_RECEIPT,
        targetId: dp.id,
      },
    });

    let status: ApprovalStatus = ApprovalStatus.PENDING;
    if (dp.status === "APPROVED") status = ApprovalStatus.APPROVED;
    if (dp.status === "CANCELLED") status = ApprovalStatus.CANCELLED;

    if (!existing) {
      await prisma.approvalRequest.create({
        data: {
          targetType: ApprovalTargetType.DEBT_RECEIPT,
          targetId: dp.id,
          targetCode: dp.receiptNumber,
          title: `Phiếu thu nợ ${dp.receiptNumber}`,
          summary: `Khách hàng: ${dp.customer.name} · Thu: ${formatVND(Number(dp.amount))} đ · ${dp.method === "CASH" ? "Tiền mặt" : "Chuyển khoản"}`,
          amount: dp.amount,
          requiredRole: "ACCOUNTANT",
          requesterId: dp.userId,
          status: status,
          decisionReason: dp.cancelReason || (status === ApprovalStatus.APPROVED ? "Đã duyệt thu tiền" : null),
          actionBy: dp.approvedBy || dp.cancelledBy || (status === ApprovalStatus.APPROVED ? dp.userId : null),
          actionAt: dp.approvedAt || dp.cancelledAt || (status === ApprovalStatus.APPROVED ? dp.createdAt : null),
          metadata: {
            customerId: dp.customerId,
            customerName: dp.customer.name,
            method: dp.method,
            notes: dp.notes,
            receiptNumber: dp.receiptNumber,
          },
          createdAt: dp.createdAt,
        },
      });
      migratedReceipts++;
      console.log(`  + Đã migrate phiếu thu: ${dp.receiptNumber} [${status}]`);
    } else {
      // Cập nhật trạng thái nếu có thay đổi
      if (existing.status !== status) {
        await prisma.approvalRequest.update({
          where: { id: existing.id },
          data: {
            status: status,
            decisionReason: dp.cancelReason || (status === ApprovalStatus.APPROVED ? "Đã duyệt thu tiền" : null),
            actionBy: dp.approvedBy || dp.cancelledBy || existing.actionBy,
            actionAt: dp.approvedAt || dp.cancelledAt || existing.actionAt,
          },
        });
        updatedReceipts++;
        console.log(`  ~ Đã cập nhật phiếu thu: ${dp.receiptNumber} -> [${status}]`);
      }
    }
  }

  // 2. Migrate Đơn Hàng Bảo Lãnh Nợ (Order Credit Override)
  const creditOrders = await prisma.order.findMany({
    where: {
      OR: [
        { isCreditOverride: true },
        { creditOverrideStatus: { in: ["PENDING", "APPROVED", "REJECTED"] } },
      ],
    },
    include: {
      customer: { select: { id: true, name: true, currentDebt: true, creditLimit: true } },
      user: { select: { id: true, name: true, email: true } },
      items: { select: { quantity: true, unitPrice: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  console.log(`Tìm thấy ${creditOrders.length} đơn hàng bảo lãnh công nợ.`);

  for (const o of creditOrders) {
    const existing = await prisma.approvalRequest.findFirst({
      where: {
        targetType: ApprovalTargetType.ORDER_CREDIT_OVERRIDE,
        targetId: o.id,
      },
    });

    let status: ApprovalStatus = ApprovalStatus.PENDING;
    if (o.creditOverrideStatus === "APPROVED") status = ApprovalStatus.APPROVED;
    if (o.creditOverrideStatus === "REJECTED") status = ApprovalStatus.REJECTED;

    const goodsTotal = o.items.reduce((sum, it) => sum + it.quantity * Number(it.unitPrice), 0);
    const totalPayable = Math.max(0, goodsTotal - Number(o.discountAmount) + Number(o.drumDepositAmount));

    if (!existing) {
      await prisma.approvalRequest.create({
        data: {
          targetType: ApprovalTargetType.ORDER_CREDIT_OVERRIDE,
          targetId: o.id,
          targetCode: o.id,
          title: `Bảo lãnh nợ đơn ${o.id.slice(-6).toUpperCase()}`,
          summary: `Khách: ${o.customer.name} · Đơn: ${formatVND(totalPayable)} đ · Dư nợ: ${formatVND(Number(o.customer.currentDebt))} đ`,
          amount: totalPayable,
          requiredRole: "ADMIN",
          requesterId: o.userId,
          status: status,
          actionBy: o.creditOverrideApprovedBy || (status === ApprovalStatus.APPROVED ? o.userId : null),
          actionAt: status !== ApprovalStatus.PENDING ? o.updatedAt : null,
          metadata: {
            customerId: o.customerId,
            customerName: o.customer.name,
            currentDebt: Number(o.customer.currentDebt),
            creditLimit: Number(o.customer.creditLimit),
            reason: o.creditOverrideReason,
          },
          createdAt: o.createdAt,
        },
      });
      migratedOrders++;
      console.log(`  + Đã migrate đơn hàng bảo lãnh: ${o.id.slice(-6).toUpperCase()} [${status}]`);
    }
  }

  // 3. Thống kê kết quả
  const totalApprovals = await prisma.approvalRequest.count();
  const pendingCount = await prisma.approvalRequest.count({ where: { status: ApprovalStatus.PENDING } });
  const approvedCount = await prisma.approvalRequest.count({ where: { status: ApprovalStatus.APPROVED } });
  const rejectedCount = await prisma.approvalRequest.count({ where: { status: ApprovalStatus.REJECTED } });
  const cancelledCount = await prisma.approvalRequest.count({ where: { status: ApprovalStatus.CANCELLED } });

  console.log("\n=== KẾT QUẢ MIGRATE ===");
  console.log(`- Phiếu thu nợ mới migrate: ${migratedReceipts}`);
  console.log(`- Phiếu thu nợ cập nhật: ${updatedReceipts}`);
  console.log(`- Đơn bảo lãnh mới migrate: ${migratedOrders}`);
  console.log(`- Tổng số bản ghi ApprovalRequest hiện tại: ${totalApprovals}`);
  console.log(`  + Chờ duyệt (PENDING): ${pendingCount}`);
  console.log(`  + Đã duyệt (APPROVED): ${approvedCount}`);
  console.log(`  + Đã từ chối (REJECTED): ${rejectedCount}`);
  console.log(`  + Đã hủy (CANCELLED): ${cancelledCount}`);
}

migrateApprovals()
  .catch((e) => {
    console.error("Lỗi migrate:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
