import {
  OrderStatus,
  PrismaClient,
  type CustomerType,
  type UserRole,
  type VisitDayOfWeek,
} from "@prisma/client";

const prisma = new PrismaClient();

const products = [
  {
    sku: "DN-15W40-200L",
    name: "Dầu Động Cơ Diesel Turbo 15W-40 CI-4 Phuy 200L",
    viscosity: "15W-40",
    standard: "API CI-4 / ACEA E7",
    volume: "200",
    unitPrice: 11_800_000,
    stock: 18,
    isDrum: true,
  },
  {
    sku: "DN-15W40-18L",
    name: "Dầu Động Cơ Diesel Turbo 15W-40 CI-4 Thùng 18L",
    viscosity: "15W-40",
    standard: "API CI-4 / ACEA E7",
    volume: "18",
    unitPrice: 1_350_000,
    stock: 85,
    isDrum: true,
  },
  {
    sku: "DN-GEAR-80W90",
    name: "Dầu Cầu & Hộp Số Bánh Răng 80W-90 GL-5",
    viscosity: "80W-90",
    standard: "API GL-5 / MT-1",
    volume: "4",
    unitPrice: 360_000,
    stock: 140,
    isDrum: false,
  },
  {
    sku: "DN-5W30-4L",
    name: "Dầu Động Cơ Ô Tô Du Lịch 5W-30 Full Synthetic",
    viscosity: "5W-30",
    standard: "API SP / ILSAC GF-6A",
    volume: "4",
    unitPrice: 680_000,
    stock: 110,
    isDrum: false,
  },
  {
    sku: "DN-10W40-4L",
    name: "Dầu Động Cơ Bán Tổng Hợp 10W-40 Semi-Synthetic",
    viscosity: "10W-40",
    standard: "API SN / ACEA A3/B4",
    volume: "4",
    unitPrice: 420_000,
    stock: 95,
    isDrum: false,
  },
  {
    sku: "DN-HYD-68-200L",
    name: "Dầu Thủy Lực Công Nghiệp Hydraulic ISO VG 68 Phuy",
    viscosity: "ISO VG 68",
    standard: "DIN 51524 HLP / ISO 11158",
    volume: "200",
    unitPrice: 9_800_000,
    stock: 8,
    isDrum: true,
  },
  {
    sku: "DN-ATF-1L",
    name: "Dầu Hộp Số Tự Động Cao Cấp ATF Dexron VI",
    viscosity: "ATF",
    standard: "GM Dexron VI / Mercon LV",
    volume: "1",
    unitPrice: 180_000,
    stock: 220,
    isDrum: false,
  },
  {
    sku: "BLT-COOL-5L",
    name: "Nước Làm Mát Động Cơ BlueTech Long Life Coolant 50/50",
    viscosity: "50/50 Pre-mix",
    standard: "JIS K 2234 / ASTM D3306",
    volume: "5",
    unitPrice: 190_000,
    stock: 310,
    isDrum: false,
  },
  {
    sku: "DN-20W50-1L",
    name: "Dầu Động Cơ Xe Máy 4 Thì 20W-50 Mineral",
    viscosity: "20W-50",
    standard: "API SJ / JASO MA2",
    volume: "1",
    unitPrice: 85_000,
    stock: 450,
    isDrum: false,
  },
  {
    sku: "DN-5W40-4L",
    name: "Dầu nhớt Turbo Diesel 5W-40",
    viscosity: "5W-40",
    standard: "API CK-4 / ACEA E9",
    volume: "4",
    unitPrice: 520_000,
    stock: 60,
    isDrum: false,
  },
  {
    sku: "DN-0W20-1L",
    name: "Dầu nhớt Hybrid 0W-20 Full Synthetic",
    viscosity: "0W-20",
    standard: "API SP / ILSAC GF-6",
    volume: "1",
    unitPrice: 195_000,
    stock: 80,
    isDrum: false,
  },
];

const customers: Array<{
  id: string;
  name: string;
  phone: string;
  address: string;
  type: CustomerType;
  creditLimit: number;
  currentDebt: number;
  outstandingDrums: number;
  lat: number | null;
  lng: number | null;
  visitDay: VisitDayOfWeek;
}> = [
  {
    id: "seed-c01",
    name: "Garage Minh Đức",
    phone: "0909123456",
    address: "12 Nguyễn Văn Linh, Q.7, TP.HCM",
    type: "GARAGE",
    creditLimit: 50_000_000,
    currentDebt: 42_500_000,
    outstandingDrums: 4,
    lat: 10.732534,
    lng: 106.702049,
    visitDay: "T2",
  },
  {
    id: "seed-c02",
    name: "Đội Xe Logistics Demo",
    phone: "0909888777",
    address: "KCN Tân Bình, P. Tây Thạnh, Q. Tân Phú, TP.HCM",
    type: "FLEET",
    creditLimit: 100_000_000,
    currentDebt: 94_000_000,
    outstandingDrums: 12,
    lat: 10.818218,
    lng: 106.63412,
    visitDay: "T3",
  },
  {
    id: "seed-c03",
    name: "Garage Ô Tô Tân Phú",
    phone: "0348859482",
    address: "88 Đường Tân Kỳ Tân Quý, P. Sơn Kỳ, Q. Tân Phú",
    type: "GARAGE",
    creditLimit: 20_000_000,
    currentDebt: 6_500_000,
    outstandingDrums: 2,
    lat: 10.804122,
    lng: 106.62145,
    visitDay: "T4",
  },
  {
    id: "seed-c04",
    name: "Tiệm Sửa Xe Chú Ba",
    phone: "0918334455",
    address: "89 Lê Văn Sỹ, P.13, Q.3, TP.HCM",
    type: "GARAGE",
    creditLimit: 10_000_000,
    currentDebt: 0,
    outstandingDrums: 0,
    lat: 10.7854,
    lng: 106.68,
    visitDay: "T5",
  },
  {
    id: "seed-c05",
    name: "Nhà Phân Phối Phụ Tùng Miền Nam",
    phone: "0903112233",
    address: "QL1A, Xã Bình Chánh, H. Bình Chánh, TP.HCM",
    type: "GARAGE",
    creditLimit: 200_000_000,
    currentDebt: 68_000_000,
    outstandingDrums: 18,
    lat: 10.68652,
    lng: 106.57581,
    visitDay: "T4",
  },
];

const staffUsers: Array<{
  email: string;
  name: string;
  role: UserRole;
}> = [
  {
    email: "sales.anv@remixoil.vn",
    name: "Nguyễn Văn A",
    role: "SALES",
  },
  {
    email: "ketoan.btt@remixoil.vn",
    name: "Trần Thị B",
    role: "ACCOUNTANT",
  },
  {
    email: "admin.thang@remixoil.vn",
    name: "Trần Hữu Thắng",
    role: "ADMIN",
  },
  {
    email: "seed-drums@local.dev",
    name: "Seed Drum Actor",
    role: "ACCOUNTANT",
  },
];

const DEMO_AUTH_PASSWORD = "123456";

async function ensureSupabaseAuthUsers(
  users: Array<{ email: string; name: string }>,
) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url) {
    console.log("NEXT_PUBLIC_SUPABASE_URL missing — skipped Auth users.");
    return;
  }

  const { createClient } = await import("@supabase/supabase-js");

  if (serviceKey) {
    const admin = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    for (const user of users) {
      const { data: listed } = await admin.auth.admin.listUsers({
        page: 1,
        perPage: 200,
      });
      const exists = listed?.users?.some(
        (u) => u.email?.toLowerCase() === user.email.toLowerCase(),
      );
      if (exists) {
        console.log(`Auth user exists: ${user.email}`);
        continue;
      }
      const { error } = await admin.auth.admin.createUser({
        email: user.email,
        password: DEMO_AUTH_PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: user.name },
      });
      if (error) {
        console.warn(`Auth createUser failed for ${user.email}:`, error.message);
      } else {
        console.log(`Created Auth user (admin): ${user.email}`);
      }
    }
    return;
  }

  if (!anonKey) {
    console.log(
      "No SUPABASE_SERVICE_ROLE_KEY / ANON_KEY — skipped Auth users.",
    );
    return;
  }

  console.log(
    "No SERVICE_ROLE_KEY — ensuring Auth users via signUp (anon).",
  );
  const client = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  for (const user of users) {
    const signIn = await client.auth.signInWithPassword({
      email: user.email,
      password: DEMO_AUTH_PASSWORD,
    });
    if (!signIn.error) {
      console.log(`Auth login OK: ${user.email}`);
      await client.auth.signOut();
      continue;
    }
    const { error } = await client.auth.signUp({
      email: user.email,
      password: DEMO_AUTH_PASSWORD,
      options: { data: { full_name: user.name } },
    });
    if (error) {
      console.warn(`Auth signUp failed for ${user.email}:`, error.message);
    } else {
      console.log(`Created Auth user (signUp): ${user.email}`);
    }
    await client.auth.signOut();
  }
}

const fleetVehicles = [
  {
    plateNumber: "51C-123.45",
    label: "Xe tải nặng 10 tấn (Hino 500)",
    unit: "KM" as const,
    currentMeter: 7000,
    lastServiceMeter: 0,
    intervalValue: 10_000,
    notes: "Dầu động cơ Turbo Diesel 15W-40 (Cần 18 Lít)",
  },
  {
    plateNumber: "51C-678.90",
    label: "Xe đầu kéo Container 40ft (Freightliner)",
    unit: "KM" as const,
    currentMeter: 9650,
    lastServiceMeter: 0,
    intervalValue: 10_000,
    notes: "Dầu động cơ Turbo Diesel 15W-40 (Cần 36 Lít)",
  },
  {
    plateNumber: "51D-889.99",
    label: "Xe tải trung 5 tấn (Isuzu Forward)",
    unit: "KM" as const,
    currentMeter: 10_850,
    lastServiceMeter: 0,
    intervalValue: 10_000,
    notes: "Dầu động cơ Turbo Diesel 15W-40 (Cần 14 Lít)",
  },
];

const loyaltyCodes = [
  { code: "BOTTLE-001", points: 10, productSku: "DN-5W30-4L" },
  { code: "BOTTLE-002", points: 10, productSku: "DN-5W30-4L" },
  { code: "BOTTLE-003", points: 15, productSku: "DN-10W40-4L" },
  { code: "BOTTLE-004", points: 15, productSku: "DN-10W40-4L" },
  { code: "BOTTLE-005", points: 20, productSku: "DN-5W40-4L" },
  { code: "BOTTLE-006", points: 10, productSku: "DN-20W50-1L" },
  { code: "BOTTLE-007", points: 15, productSku: "DN-10W40-4L" },
  { code: "DRUM-001", points: 50, productSku: "DN-15W40-18L" },
  { code: "DRUM-002", points: 50, productSku: "DN-15W40-18L" },
  { code: "TEST-100", points: 100, productSku: null },
  { code: "SEED-DEMO-SCAN", points: 25, productSku: "DN-5W30-4L" },
];

const rewards = [
  { name: "Áo thun CRM Dầu Nhớt", pointsCost: 50, stock: 30 },
  { name: "Nón lưỡi trai thợ", pointsCost: 30, stock: 50 },
  { name: "Chai nhớt 1L tặng", pointsCost: 80, stock: 20 },
  { name: "Bộ khăn lau động cơ", pointsCost: 20, stock: 100 },
];

function monthsAgo(n: number, day = 12, hour = 10): Date {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  d.setDate(Math.min(day, 28));
  d.setHours(hour, 15, 0, 0);
  return d;
}

function daysAgo(n: number, hour = 9): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, 30, 0, 0);
  return d;
}

async function main() {
  for (const product of products) {
    await prisma.product.upsert({
      where: { sku: product.sku },
      update: product,
      create: product,
    });
  }
  console.log(`Seeded ${products.length} products.`);

  const userIds: string[] = [];
  for (const staff of staffUsers) {
    const user = await prisma.user.upsert({
      where: { email: staff.email },
      update: { name: staff.name, role: staff.role },
      create: staff,
    });
    userIds.push(user.id);
  }
  const salesUserId = userIds[0]!;
  const fleetSalesId = userIds[2] ?? userIds[0]!;
  console.log(`Seeded ${staffUsers.length} users.`);

  await ensureSupabaseAuthUsers(
    staffUsers
      .filter((u) => u.email.endsWith("@remixoil.vn"))
      .map((u) => ({ email: u.email, name: u.name })),
  );

  for (const customer of customers) {
    await prisma.customer.upsert({
      where: { id: customer.id },
      update: {
        name: customer.name,
        phone: customer.phone,
        address: customer.address,
        type: customer.type,
        creditLimit: customer.creditLimit,
        currentDebt: customer.currentDebt,
        outstandingDrums: customer.outstandingDrums,
        lat: customer.lat,
        lng: customer.lng,
        visitDay: customer.visitDay,
      },
      create: customer,
    });
  }
  console.log(`Seeded ${customers.length} customers.`);

  const productBySku = Object.fromEntries(
    (
      await prisma.product.findMany({
        where: { sku: { in: products.map((p) => p.sku) } },
      })
    ).map((p) => [p.sku, p]),
  );

  for (const vehicle of fleetVehicles) {
    await prisma.fleetVehicle.upsert({
      where: { plateNumber: vehicle.plateNumber },
      update: { ...vehicle, customerId: "seed-c02" },
      create: { ...vehicle, customerId: "seed-c02" },
    });
  }
  console.log(`Seeded ${fleetVehicles.length} fleet vehicles.`);

  type SeedOrderItem = { sku: string; quantity: number; unitPrice: number };
  type SeedOrder = {
    localId: string;
    customerId: string;
    userId: string;
    status: OrderStatus;
    createdAt: Date;
    items: SeedOrderItem[];
  };

  const showcaseOrders: SeedOrder[] = [
    {
      localId: "seed-ord-2026-001",
      customerId: "seed-c01",
      userId: salesUserId,
      status: "PENDING",
      createdAt: daysAgo(1, 9),
      items: [
        { sku: "DN-15W40-200L", quantity: 1, unitPrice: 12_500_000 },
        { sku: "DN-15W40-18L", quantity: 2, unitPrice: 1_000_000 },
      ],
    },
    {
      localId: "seed-ord-2026-002",
      customerId: "seed-c02",
      userId: fleetSalesId,
      status: "CONFIRMED",
      createdAt: daysAgo(1, 8),
      items: [
        { sku: "DN-15W40-200L", quantity: 2, unitPrice: 12_100_000 },
        { sku: "DN-15W40-18L", quantity: 2, unitPrice: 1_400_000 },
      ],
    },
    {
      localId: "seed-ord-2026-003",
      customerId: "seed-c05",
      userId: salesUserId,
      status: "SHIPPED",
      createdAt: daysAgo(2, 15),
      items: [{ sku: "DN-HYD-68-200L", quantity: 2, unitPrice: 9_800_000 }],
    },
    {
      localId: "seed-ord-2026-004",
      customerId: "seed-c03",
      userId: salesUserId,
      status: "SHIPPED",
      createdAt: daysAgo(3, 11),
      items: [{ sku: "DN-5W30-4L", quantity: 6, unitPrice: 750_000 }],
    },
  ];

  const skuPool = [
    "DN-15W40-200L",
    "DN-15W40-18L",
    "DN-5W30-4L",
    "DN-10W40-4L",
    "DN-HYD-68-200L",
    "DN-ATF-1L",
    "DN-GEAR-80W90",
    "DN-20W50-1L",
    "DN-5W40-4L",
    "BLT-COOL-5L",
  ] as const;
  const customerIds = customers.map((c) => c.id);
  const statuses: OrderStatus[] = ["PENDING", "CONFIRMED", "SHIPPED", "SHIPPED"];

  const historicalOrders: SeedOrder[] = [];
  for (let monthOffset = 0; monthOffset <= 5; monthOffset++) {
    for (let i = 0; i < 5; i++) {
      const sku = skuPool[(monthOffset * 5 + i) % skuPool.length]!;
      const product = productBySku[sku];
      if (!product) continue;
      const qty = 1 + ((monthOffset + i) % 4);
      historicalOrders.push({
        localId: `seed-hist-m${monthOffset}-n${i}`,
        customerId: customerIds[(monthOffset + i) % customerIds.length]!,
        userId: i % 2 === 0 ? salesUserId : fleetSalesId,
        status: statuses[(monthOffset + i) % statuses.length]!,
        createdAt: monthsAgo(monthOffset, 5 + i * 4, 8 + i),
        items: [
          {
            sku,
            quantity: qty,
            unitPrice: Number(product.unitPrice),
          },
        ],
      });
    }
  }

  // Extra RFM spread for C04 (at risk — older purchase) and recent VIP buys
  historicalOrders.push(
    {
      localId: "seed-hist-c04-old",
      customerId: "seed-c04",
      userId: salesUserId,
      status: "SHIPPED",
      createdAt: daysAgo(48, 10),
      items: [{ sku: "DN-20W50-1L", quantity: 24, unitPrice: 85_000 }],
    },
    {
      localId: "seed-hist-c01-cycle",
      customerId: "seed-c01",
      userId: salesUserId,
      status: "SHIPPED",
      createdAt: daysAgo(17, 14),
      items: [{ sku: "DN-15W40-18L", quantity: 4, unitPrice: 1_350_000 }],
    },
  );

  const allOrders = [...showcaseOrders, ...historicalOrders];
  let orderCount = 0;
  for (const order of allOrders) {
    const items = order.items
      .map((item) => {
        const product = productBySku[item.sku];
        if (!product) return null;
        return {
          productId: product.id,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
    if (items.length === 0) continue;

    await prisma.order.upsert({
      where: { localId: order.localId },
      update: {
        status: order.status,
        userId: order.userId,
        customerId: order.customerId,
        createdAt: order.createdAt,
        syncedAt: order.createdAt,
        items: {
          deleteMany: {},
          create: items,
        },
      },
      create: {
        localId: order.localId,
        status: order.status,
        userId: order.userId,
        customerId: order.customerId,
        createdAt: order.createdAt,
        syncedAt: order.createdAt,
        items: { create: items },
      },
    });
    orderCount += 1;
  }
  console.log(`Seeded ${orderCount} orders with line items.`);

  const drumProduct = productBySku["DN-15W40-200L"];
  const drumTargets = ["seed-c01", "seed-c02", "seed-c03", "seed-c05"] as const;
  let drumsCreated = 0;
  for (const customerId of drumTargets) {
    const existing = await prisma.drumTransaction.count({
      where: { customerId, notes: { startsWith: "Seed:" } },
    });
    if (existing > 0) continue;

    if (customerId === "seed-c01") {
      await prisma.drumTransaction.create({
        data: {
          customerId,
          type: "ISSUE",
          quantity: 4,
          productId: drumProduct?.id ?? null,
          notes: "Seed: xuất phuy Garage Minh Đức",
          userId: salesUserId,
        },
      });
      drumsCreated += 1;
    } else if (customerId === "seed-c02") {
      await prisma.drumTransaction.createMany({
        data: [
          {
            customerId,
            type: "ISSUE",
            quantity: 15,
            productId: drumProduct?.id ?? null,
            notes: "Seed: xuất phuy đội xe",
            userId: fleetSalesId,
          },
          {
            customerId,
            type: "RETURN",
            quantity: 3,
            notes: "Seed: thu vỏ đội xe",
            userId: fleetSalesId,
          },
        ],
      });
      drumsCreated += 2;
    } else if (customerId === "seed-c05") {
      await prisma.drumTransaction.createMany({
        data: [
          {
            customerId,
            type: "ISSUE",
            quantity: 20,
            productId: drumProduct?.id ?? null,
            notes: "Seed: xuất phuy NPP Miền Nam",
            userId: salesUserId,
          },
          {
            customerId,
            type: "RETURN",
            quantity: 2,
            notes: "Seed: thu vỏ NPP",
            userId: salesUserId,
          },
        ],
      });
      drumsCreated += 2;
    } else if (customerId === "seed-c03") {
      await prisma.drumTransaction.create({
        data: {
          customerId,
          type: "ISSUE",
          quantity: 2,
          productId: drumProduct?.id ?? null,
          notes: "Seed: xuất phuy Tân Phú",
          userId: salesUserId,
        },
      });
      drumsCreated += 1;
    }
  }
  console.log(
    drumsCreated > 0
      ? `Seeded ${drumsCreated} drum transactions.`
      : "Drum seed transactions already present — skipped.",
  );

  const existingCheckIns = await prisma.visitCheckIn.count({
    where: {
      OR: [
        { customerId: "seed-c01", userId: salesUserId },
        { customerId: "seed-c02", userId: fleetSalesId },
        { customerId: "seed-c03", userId: salesUserId },
      ],
    },
  });
  if (existingCheckIns === 0) {
    await prisma.visitCheckIn.createMany({
      data: [
        {
          customerId: "seed-c01",
          userId: salesUserId,
          lat: 10.732534,
          lng: 106.702049,
          distanceM: 12,
          createdAt: daysAgo(0, 10),
        },
        {
          customerId: "seed-c02",
          userId: fleetSalesId,
          lat: 10.818218,
          lng: 106.63412,
          distanceM: 28,
          createdAt: daysAgo(0, 8),
        },
        {
          customerId: "seed-c03",
          userId: salesUserId,
          lat: 10.804122,
          lng: 106.62145,
          distanceM: 45,
          createdAt: daysAgo(1, 16),
        },
      ],
    });
    console.log("Seeded 3 visit check-ins.");
  } else {
    console.log("Visit check-ins already present — skipped.");
  }

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

  const mechanicDefs = [
    {
      name: "Chú Ba (Thợ máy)",
      phone: "0918334455",
      points: 1250,
    },
    {
      name: "Thợ Hùng Garage Minh Đức",
      phone: "0909123499",
      points: 180,
    },
    {
      name: "Thợ Phong Tân Phú",
      phone: "0348859400",
      points: 85,
    },
  ];

  const mechanics = [];
  for (const m of mechanicDefs) {
    const mechanic = await prisma.mechanic.upsert({
      where: { phone: m.phone },
      update: { name: m.name, points: m.points },
      create: m,
    });
    mechanics.push(mechanic);
  }
  console.log(`Seeded ${mechanics.length} mechanics.`);

  const demoCode = await prisma.loyaltyCode.findUnique({
    where: { code: "SEED-DEMO-SCAN" },
  });
  const primaryMechanic = mechanics[0]!;
  if (demoCode && !demoCode.redeemedAt) {
    await prisma.$transaction(async (tx) => {
      await tx.loyaltyCode.update({
        where: { id: demoCode.id },
        data: {
          redeemedAt: daysAgo(5, 11),
          mechanicId: primaryMechanic.id,
        },
      });
      await tx.pointLedger.create({
        data: {
          mechanicId: primaryMechanic.id,
          delta: demoCode.points,
          reason: "SCAN",
          refId: demoCode.id,
          note: `Seed: quét mã ${demoCode.code}`,
          createdAt: daysAgo(5, 11),
        },
      });
    });
    console.log("Seeded demo scan ledger (SEED-DEMO-SCAN).");
  }

  const cheapReward = await prisma.loyaltyReward.findFirst({
    where: { name: "Bộ khăn lau động cơ" },
  });
  const existingRedemption = cheapReward
    ? await prisma.rewardRedemption.count({
        where: {
          mechanicId: primaryMechanic.id,
          rewardId: cheapReward.id,
        },
      })
    : 0;
  if (cheapReward && existingRedemption === 0 && primaryMechanic.points >= 20) {
    await prisma.$transaction(async (tx) => {
      await tx.rewardRedemption.create({
        data: {
          mechanicId: primaryMechanic.id,
          rewardId: cheapReward.id,
          pointsSpent: cheapReward.pointsCost,
          createdAt: daysAgo(4, 15),
        },
      });
      await tx.pointLedger.create({
        data: {
          mechanicId: primaryMechanic.id,
          delta: -cheapReward.pointsCost,
          reason: "REDEEM",
          refId: cheapReward.id,
          note: `Seed: đổi ${cheapReward.name}`,
          createdAt: daysAgo(4, 15),
        },
      });
      await tx.loyaltyReward.update({
        where: { id: cheapReward.id },
        data: { stock: { decrement: 1 } },
      });
      await tx.mechanic.update({
        where: { id: primaryMechanic.id },
        data: { points: Math.max(0, primaryMechanic.points - cheapReward.pointsCost) },
      });
    });
    // Re-align Chú Ba to demo balance after historical redeem bookkeeping
    await prisma.mechanic.update({
      where: { id: primaryMechanic.id },
      data: { points: 1250 },
    });
    console.log("Seeded sample reward redemption.");
  }

  console.log("Seed complete.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
