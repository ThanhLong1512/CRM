import { prisma } from "@/lib/prisma";

export type CheckInDto = {
  id: string;
  customerId: string;
  customerName: string;
  userName: string | null;
  userEmail: string;
  lat: number;
  lng: number;
  distanceM: number;
  createdAt: string;
};

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function listTodayCheckIns(): Promise<CheckInDto[]> {
  const rows = await prisma.visitCheckIn.findMany({
    where: { createdAt: { gte: startOfToday() } },
    orderBy: { createdAt: "desc" },
    include: {
      customer: { select: { name: true } },
      user: { select: { name: true, email: true } },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    customerId: row.customerId,
    customerName: row.customer.name,
    userName: row.user.name,
    userEmail: row.user.email,
    lat: Number(row.lat),
    lng: Number(row.lng),
    distanceM: row.distanceM,
    createdAt: row.createdAt.toISOString(),
  }));
}
