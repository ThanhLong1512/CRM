export type ProductDto = {
  id: string;
  sku: string;
  name: string;
  viscosity: string | null;
  standard: string | null;
  volume: string | null;
  unitPrice: number;
  wholesalePrice?: number | null;
  garagePrice?: number | null;
  retailPrice?: number | null;
  volumeLiters?: number | null;
  stock: number;
  isDrum: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export const PRODUCTS_QUERY_KEY = ["products"] as const;

export async function fetchProducts(): Promise<ProductDto[]> {
  const res = await fetch("/api/products", {
    method: "GET",
    credentials: "same-origin",
  });

  if (!res.ok) {
    throw new Error("Không tải được danh sách sản phẩm.");
  }

  return res.json() as Promise<ProductDto[]>;
}

export type StockStatusFilter = "all" | "in_stock" | "out_of_stock";

export function filterProducts(
  products: ProductDto[],
  opts: {
    query: string;
    status: StockStatusFilter;
    category: string;
  },
): ProductDto[] {
  const q = opts.query.trim().toLowerCase();

  return products.filter((product) => {
    if (q) {
      const haystack = [
        product.name,
        product.sku,
        product.viscosity ?? "",
        product.standard ?? "",
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }

    if (opts.status === "in_stock" && product.stock <= 0) return false;
    if (opts.status === "out_of_stock" && product.stock > 0) return false;

    if (
      opts.category !== "all" &&
      (product.viscosity ?? "").toLowerCase() !== opts.category.toLowerCase()
    ) {
      return false;
    }

    return true;
  });
}
