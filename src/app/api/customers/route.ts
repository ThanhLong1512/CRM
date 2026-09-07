import { NextResponse } from "next/server";
import { listCustomers } from "@/lib/data/customers";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const customers = await listCustomers();
  return NextResponse.json(customers);
}
