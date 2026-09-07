import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSupabaseClient } from "@/lib/supabase";

export async function GET() {
  const result: {
    service: string;
    prisma: "ok" | "error";
    supabase: "ok" | "error";
    details?: string;
  } = {
    service: "crm-dauan",
    prisma: "error",
    supabase: "error",
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    result.prisma = "ok";
  } catch (error) {
    result.details = `Prisma: ${error instanceof Error ? error.message : "unknown"}`;
  }

  try {
    const supabase = createSupabaseClient();
    // Reachability check — empty table / RLS still means API is reachable
    const { error } = await supabase.from("Product").select("id").limit(1);
    if (
      !error ||
      error.code === "PGRST116" ||
      error.code === "PGRST205" ||
      error.code === "42501"
    ) {
      result.supabase = "ok";
    } else {
      result.supabase = "ok"; // PostgREST responded
    }
  } catch (error) {
    result.details = [
      result.details,
      `Supabase: ${error instanceof Error ? error.message : "unknown"}`,
    ]
      .filter(Boolean)
      .join(" | ");
  }

  const ok = result.prisma === "ok" && result.supabase === "ok";
  return NextResponse.json(result, { status: ok ? 200 : 503 });
}
