import { prisma } from "../lib/prisma";

async function main() {
  const customers = await prisma.customer.findMany({
    orderBy: { createdAt: "asc" },
  });

  console.log(`=== TỔNG CỘNG ${customers.length} KHÁCH HÀNG TRONG DATABASE ===\n`);
  for (const c of customers) {
    console.log(`- ID: ${c.id}`);
    console.log(`  Tên: ${c.name}`);
    console.log(`  Loại: ${c.type} (${c.dealerTier})`);
    console.log(`  SĐT: ${c.phone || "—"}`);
    console.log(`  Địa chỉ: ${c.address || "—"}`);
    console.log(`  Tọa độ hiện tại: lat=${c.lat ?? "null"}, lng=${c.lng ?? "null"}`);
    console.log(`  Tuyến ghé thăm (visitDay): ${c.visitDay || "—"}`);
    console.log("--------------------------------------------------");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
