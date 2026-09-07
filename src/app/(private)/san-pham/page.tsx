import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { ProductsPageClient } from "@/app/(private)/san-pham/ProductsPageClient";
import { PRODUCTS_QUERY_KEY } from "@/app/(private)/san-pham/product-query";
import { listProducts } from "@/lib/data/products";
import { getQueryClient } from "@/lib/query-client";

export default async function SanPhamPage() {
  const queryClient = getQueryClient();
  await queryClient.prefetchQuery({
    queryKey: PRODUCTS_QUERY_KEY,
    queryFn: listProducts,
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProductsPageClient />
    </HydrationBoundary>
  );
}
