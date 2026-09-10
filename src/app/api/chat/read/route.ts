import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({
    where: { email: authUser.email! },
    select: { id: true },
  });
  if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  await prisma.chatReadStatus.upsert({
    where: { userId: dbUser.id },
    create: { userId: dbUser.id, readAt: new Date() },
    update: { readAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
