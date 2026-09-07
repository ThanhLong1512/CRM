import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const products = [
  {
    sku: "DN-5W30-4L",
    name: "Dầu nhớt động cơ 5W-30 Synthetic",
    viscosity: "5W-30",
    standard: "API SP / ACEA C3",
    volume: "4",
    unitPrice: 485000,
    stock: 120,
    isDrum: false,
  },
  {
    sku: "DN-10W40-4L",
    name: "Dầu nhớt động cơ 10W-40 Semi-Synthetic",
    viscosity: "10W-40",
    standard: "API SN / ACEA A3/B4",
    volume: "4",
    unitPrice: 320000,
    stock: 200,
    isDrum: false,
  },
  {
    sku: "DN-15W40-18L",
    name: "Dầu nhớt Diesel 15W-40 CI-4",
    viscosity: "15W-40",
    standard: "API CI-4 / ACEA E7",
    volume: "18",
    unitPrice: 1450000,
    stock: 45,
    isDrum: true,
  },
  {
    sku: "DN-0W20-1L",
    name: "Dầu nhớt Hybrid 0W-20 Full Synthetic",
    viscosity: "0W-20",
    standard: "API SP / ILSAC GF-6",
    volume: "1",
    unitPrice: 195000,
    stock: 80,
    isDrum: false,
  },
  {
    sku: "DN-ATF-1L",
    name: "Dầu hộp số ATF Dexron VI",
    viscosity: "ATF",
    standard: "Dexron VI / Mercon LV",
    volume: "1",
    unitPrice: 175000,
    stock: 95,
    isDrum: false,
  },
  {
    sku: "DN-GEAR-80W90",
    name: "Dầu cầu bánh răng 80W-90",
    viscosity: "80W-90",
    standard: "API GL-5",
    volume: "1",
    unitPrice: 98000,
    stock: 150,
    isDrum: false,
  },
  {
    sku: "DN-5W40-4L",
    name: "Dầu nhớt Turbo Diesel 5W-40",
    viscosity: "5W-40",
    standard: "API CK-4 / ACEA E9",
    volume: "4",
    unitPrice: 520000,
    stock: 60,
    isDrum: false,
  },
  {
    sku: "DN-20W50-4L",
    name: "Dầu nhớt xe máy 20W-50 Mineral",
    viscosity: "20W-50",
    standard: "API SJ / JASO MA2",
    volume: "4",
    unitPrice: 210000,
    stock: 180,
    isDrum: false,
  },
  {
    sku: "DN-15W40-200L",
    name: "Dầu nhớt Diesel 15W-40 Phuy 200L",
    viscosity: "15W-40",
    standard: "API CI-4 / ACEA E7",
    volume: "200",
    unitPrice: 12_500_000,
    stock: 20,
    isDrum: true,
  },
];

async function main() {
  for (const product of products) {
    await prisma.product.upsert({
      where: { sku: product.sku },
      update: product,
      create: product,
    });
  }
  console.log(`Seeded ${products.length} lubricant products.`);

  const loyaltyCodes = [
    { code: "BOTTLE-001", points: 10, productSku: "DN-5W30-4L" },
    { code: "BOTTLE-002", points: 10, productSku: "DN-5W30-4L" },
    { code: "BOTTLE-003", points: 15, productSku: "DN-10W40-4L" },
    { code: "BOTTLE-004", points: 15, productSku: "DN-10W40-4L" },
    { code: "BOTTLE-005", points: 20, productSku: "DN-5W40-4L" },
    { code: "DRUM-001", points: 50, productSku: "DN-15W40-18L" },
    { code: "DRUM-002", points: 50, productSku: "DN-15W40-18L" },
    { code: "TEST-100", points: 100, productSku: null },
  ];

  for (const row of loyaltyCodes) {
    await prisma.loyaltyCode.upsert({
      where: { code: row.code },
      update: {
        points: row.points,
        productSku: row.productSku,
      },
      create: row,
    });
  }
  console.log(`Seeded ${loyaltyCodes.length} loyalty codes.`);

  const rewards = [
    { name: "Áo thun CRM Dầu Nhớt", pointsCost: 50, stock: 30 },
    { name: "Nón lưỡi trai thợ", pointsCost: 30, stock: 50 },
    { name: "Chai nhớt 1L tặng", pointsCost: 80, stock: 20 },
    { name: "Bộ khăn lau động cơ", pointsCost: 20, stock: 100 },
  ];

  for (const reward of rewards) {
    const existing = await prisma.loyaltyReward.findFirst({
      where: { name: reward.name },
    });
    if (existing) {
      await prisma.loyaltyReward.update({
        where: { id: existing.id },
        data: {
          pointsCost: reward.pointsCost,
          stock: reward.stock,
          active: true,
        },
      });
    } else {
      await prisma.loyaltyReward.create({ data: reward });
    }
  }
  console.log(`Seeded ${rewards.length} loyalty rewards.`);

  const fleetCustomer = await prisma.customer.upsert({
    where: { id: "seed-fleet-customer" },
    update: {
      name: "Đội xe Logistics Demo",
      type: "FLEET",
      phone: "0909888777",
      creditLimit: 50_000_000,
    },
    create: {
      id: "seed-fleet-customer",
      name: "Đội xe Logistics Demo",
      type: "FLEET",
      phone: "0909888777",
      address: "KCN Tân Bình, TP.HCM",
      creditLimit: 50_000_000,
      currentDebt: 0,
    },
  });

  const fleetVehicles = [
    {
      plateNumber: "51C-123.45",
      label: "Xe tải 1",
      unit: "KM" as const,
      currentMeter: 92_000,
      lastServiceMeter: 85_000,
      intervalValue: 10_000,
    },
    {
      plateNumber: "51C-678.90",
      label: "Xe tải 2",
      unit: "KM" as const,
      currentMeter: 48_500,
      lastServiceMeter: 40_000,
      intervalValue: 10_000,
    },
    {
      plateNumber: "GEN-01",
      label: "Máy phát dự phòng",
      unit: "HOUR" as const,
      currentMeter: 480,
      lastServiceMeter: 0,
      intervalValue: 500,
    },
  ];

  for (const vehicle of fleetVehicles) {
    await prisma.fleetVehicle.upsert({
      where: { plateNumber: vehicle.plateNumber },
      update: {
        ...vehicle,
        customerId: fleetCustomer.id,
      },
      create: {
        ...vehicle,
        customerId: fleetCustomer.id,
      },
    });
  }
  console.log(`Seeded ${fleetVehicles.length} fleet vehicles.`);

  const drumProduct = await prisma.product.findUnique({
    where: { sku: "DN-15W40-200L" },
  });

  const garageCustomer = await prisma.customer.upsert({
    where: { id: "seed-garage-drums" },
    update: {
      name: "Garage Minh Đức",
      type: "GARAGE",
      phone: "0909123456",
      creditLimit: 20_000_000,
    },
    create: {
      id: "seed-garage-drums",
      name: "Garage Minh Đức",
      type: "GARAGE",
      phone: "0909123456",
      address: "12 Nguyễn Văn Linh, Q.7, TP.HCM",
      creditLimit: 20_000_000,
      currentDebt: 0,
      outstandingDrums: 0,
    },
  });

  const actor =
    (await prisma.user.findFirst({ orderBy: { createdAt: "asc" } })) ??
    (await prisma.user.create({
      data: {
        email: "seed-drums@local.dev",
        name: "Seed Drum Actor",
        role: "ACCOUNTANT",
      },
    }));

  const existingDrumTx = await prisma.drumTransaction.count({
    where: { customerId: garageCustomer.id },
  });

  if (existingDrumTx === 0) {
    await prisma.$transaction(async (tx) => {
      await tx.drumTransaction.create({
        data: {
          customerId: garageCustomer.id,
          type: "ISSUE",
          quantity: 5,
          productId: drumProduct?.id ?? null,
          notes: "Seed: xuất phuy demo",
          userId: actor.id,
        },
      });
      await tx.drumTransaction.create({
        data: {
          customerId: fleetCustomer.id,
          type: "ISSUE",
          quantity: 3,
          productId: drumProduct?.id ?? null,
          notes: "Seed: xuất phuy đội xe",
          userId: actor.id,
        },
      });
      await tx.drumTransaction.create({
        data: {
          customerId: garageCustomer.id,
          type: "RETURN",
          quantity: 1,
          notes: "Seed: thu 1 vỏ",
          userId: actor.id,
        },
      });
      await tx.customer.update({
        where: { id: garageCustomer.id },
        data: { outstandingDrums: 4 },
      });
      await tx.customer.update({
        where: { id: fleetCustomer.id },
        data: { outstandingDrums: 3 },
      });
    });
    console.log("Seeded drum transactions for 2 customers.");
  } else {
    console.log("Drum seed transactions already present — skipped.");
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
