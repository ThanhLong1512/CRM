import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";
import { listApprovalRequests, decideApprovalRequest } from "@/lib/approval/approvalEngine";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const status = req.nextUrl.searchParams.get("status") as any;
  const targetType = req.nextUrl.searchParams.get("targetType") as any;

  const res = await listApprovalRequests({
    status: status || "PENDING",
    targetType: targetType || "ALL",
  });

  return NextResponse.json(res);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: authUser.email! },
    select: { id: true, role: true },
  });

  if (!dbUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const body = await req.json();
  const { requestId, decision, reason } = body;

  if (!requestId || !decision || (decision !== "APPROVE" && decision !== "REJECT")) {
    return NextResponse.json({ error: "Dữ liệu không hợp lệ" }, { status: 400 });
  }

  const result = await decideApprovalRequest({
    requestId,
    decision,
    reason,
    approverId: dbUser.id,
    approverRole: dbUser.role,
  });

  if (!result.success) {
    return NextResponse.json(result, { status: 400 });
  }

  return NextResponse.json(result);
}
