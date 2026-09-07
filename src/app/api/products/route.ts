import { NextResponse } from "next/server";
import { listProducts } from "@/lib/data/products";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const products = await listProducts();
  return NextResponse.json(products);
}
