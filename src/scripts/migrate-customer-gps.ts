import { prisma } from "../lib/prisma";

interface CustomerGpsData {
  id: string;
  name?: string;
  address?: string;
  lat: number;
  lng: number;
  visitDay?: "T2" | "T3" | "T4" | "T5" | "T6" | "T7";
}

const GPS_MIGRATION_LIST: CustomerGpsData[] = [
  {
    id: "cmtqw94fg0000930ggse8qtvc",
    name: "Garage Thảo Điền Auto (Quận 2)",
    address: "42 Đường Quốc Hương, P. Thảo Điền, TP. Thủ Đức, TP.HCM",
    lat: 10.80625,
    lng: 106.73291,
    visitDay: "T6",
  },
  {
    id: "cmtqzscn3000093fcchxngjlf",
    name: "Garage Auto Bình Thạnh",
    address: "152 Điện Biên Phủ, Phường 25, Quận Bình Thạnh, TP.HCM",
    lat: 10.80152,
    lng: 106.71453,
    visitDay: "T5",
  },
  {
    id: "seed-fleet-customer",
    name: "Đội Xe Logistics Miền Nam",
    address: "Đường CN13, KCN Tân Bình, P. Tây Thạnh, Q. Tân Phú, TP.HCM",
    lat: 10.81685,
    lng: 106.62952,
    visitDay: "T3",
  },
  {
    id: "seed-garage-drums",
    name: "Garage Minh Đức (Chi nhánh 2)",
    address: "800 Huỳnh Tấn Phát, P. Tân Phú, Quận 7, TP.HCM",
    lat: 10.73012,
    lng: 106.72654,
    visitDay: "T2",
  },
  {
    id: "seed-c01",
    name: "Garage Minh Đức (Trụ sở chính)",
    address: "12 Nguyễn Văn Linh, P. Tân Thuận Tây, Quận 7, TP.HCM",
    lat: 10.74235,
    lng: 106.71582,
    visitDay: "T2",
  },
  {
    id: "seed-c02",
    name: "Đội Xe Logistics Demo",
    address: "KCN Tân Bình, P. Tây Thạnh, Q. Tân Phú, TP.HCM",
    lat: 10.818218,
    lng: 106.63412,
    visitDay: "T3",
  },
  {
    id: "seed-c03",
    name: "Garage Ô Tô Tân Phú",
    address: "88 Đường Tân Kỳ Tân Quý, P. Sơn Kỳ, Q. Tân Phú, TP.HCM",
    lat: 10.804122,
    lng: 106.62145,
    visitDay: "T4",
  },
  {
    id: "seed-c04",
    name: "Tiệm Sửa Xe Chú Ba",
    address: "89 Lê Văn Sỹ, Phường 13, Quận 3, TP.HCM",
    lat: 10.7854,
    lng: 106.68,
    visitDay: "T5",
  },
  {
    id: "seed-c05",
    name: "Nhà Phân Phối Phụ Tùng Miền Nam",
    address: "QL1A, Xã Bình Chánh, Huyện Bình Chánh, TP.HCM",
    lat: 10.68652,
    lng: 106.57581,
    visitDay: "T4",
  },
];

async function runMigration() {
  console.log("🚀 BẮT ĐẦU MIGRATE TỌA ĐỘ GPS (KINH ĐỘ & VĨ ĐỘ) CHO KHÁCH HÀNG...");

  let updatedCount = 0;

  for (const item of GPS_MIGRATION_LIST) {
    const existing = await prisma.customer.findUnique({
      where: { id: item.id },
    });

    if (!existing) {
      console.warn(`⚠️ Không tìm thấy khách hàng với ID: ${item.id}`);
      continue;
    }

    const updated = await prisma.customer.update({
      where: { id: item.id },
      data: {
        ...(item.name ? { name: item.name } : {}),
        ...(item.address ? { address: item.address } : {}),
        lat: item.lat,
        lng: item.lng,
        ...(item.visitDay ? { visitDay: item.visitDay } : {}),
      },
    });

    updatedCount++;
    console.log(
      `✅ [${updatedCount}/${GPS_MIGRATION_LIST.length}] ${updated.name}: ` +
        `Địa chỉ="${updated.address}", Lat=${updated.lat}, Lng=${updated.lng}, Tuyến=${updated.visitDay}`
    );
  }

  console.log(`\n🎉 ĐÃ CẬP NHẬT THÀNH CÔNG ${updatedCount} KHÁCH HÀNG LÊN DATABASE!`);
}

runMigration()
  .catch((e) => {
    console.error("❌ Lỗi trong quá trình migrate:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
