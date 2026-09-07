import { LoyaltyPageClient } from "@/app/(private)/tich-diem/LoyaltyPageClient";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ mechanicId?: string }>;
};

export default async function TichDiemPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const mechanicId = params.mechanicId?.trim() || null;

  const [mechanic, rewards, ledger] = await Promise.all([
    mechanicId
      ? prisma.mechanic.findUnique({ where: { id: mechanicId } })
      : Promise.resolve(null),
    prisma.loyaltyReward.findMany({
      where: { active: true },
      orderBy: { pointsCost: "asc" },
    }),
    mechanicId
      ? prisma.pointLedger.findMany({
          where: { mechanicId },
          orderBy: { createdAt: "desc" },
          take: 30,
        })
      : Promise.resolve([]),
  ]);

  return (
    <LoyaltyPageClient
      key={mechanic?.id ?? "none"}
      initialMechanic={
        mechanic
          ? {
              id: mechanic.id,
              name: mechanic.name,
              phone: mechanic.phone,
              points: mechanic.points,
            }
          : null
      }
      rewards={rewards.map((r) => ({
        id: r.id,
        name: r.name,
        pointsCost: r.pointsCost,
        stock: r.stock,
      }))}
      ledger={ledger.map((row) => ({
        id: row.id,
        delta: row.delta,
        reason: row.reason,
        note: row.note,
        createdAt: row.createdAt.toISOString(),
      }))}
    />
  );
}
