import { prisma } from "@/lib/prisma";
import type { ProductDto } from "@/app/(private)/san-pham/product-query";

export async function listProducts(): Promise<ProductDto[]> {
  const products = await prisma.product.findMany({
    orderBy: { name: "asc" },
  });

  return products.map((product) => ({
    id: product.id,
    sku: product.sku,
    name: product.name,
    viscosity: product.viscosity,
    standard: product.standard,
    volume: product.volume,
    unitPrice: Number(product.unitPrice),
    stock: product.stock,
    isDrum: product.isDrum,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  }));
}
