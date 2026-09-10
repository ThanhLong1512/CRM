import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";

const PAGE_SIZE = 80;

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const since = req.nextUrl.searchParams.get("since");

  const messages = await prisma.chatMessage.findMany({
    where: since ? { createdAt: { gt: new Date(since) } } : undefined,
    orderBy: { createdAt: "asc" },
    take: PAGE_SIZE,
    select: {
      id: true,
      content: true,
      imageUrl: true,
      senderId: true,
      createdAt: true,
      sender: {
        select: { id: true, name: true, email: true, role: true },
      },
    },
  });

  return NextResponse.json({ messages });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({
    where: { email: authUser.email! },
    select: { id: true, name: true, role: true },
  });
  if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = await req.json();
  const content = String(body?.content ?? "").trim();
  const imageUrl = typeof body?.imageUrl === "string" && body.imageUrl.trim() ? body.imageUrl.trim() : null;

  if (!content && !imageUrl) {
    return NextResponse.json({ error: "Tin nhắn hoặc hình ảnh không được để trống" }, { status: 400 });
  }

  if (content.length > 2000) {
    return NextResponse.json({ error: "Nội dung tin nhắn tối đa 2000 ký tự" }, { status: 400 });
  }

  const message = await prisma.chatMessage.create({
    data: { 
      content, 
      imageUrl,
      senderId: dbUser.id 
    },
    select: {
      id: true,
      content: true,
      imageUrl: true,
      senderId: true,
      createdAt: true,
      sender: {
        select: { id: true, name: true, email: true, role: true },
      },
    },
  });

  return NextResponse.json({ message }, { status: 201 });
}
