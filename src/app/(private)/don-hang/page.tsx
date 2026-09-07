import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { OrdersPageClient } from "@/app/(private)/don-hang/OrdersPageClient";
import { ORDERS_QUERY_KEY } from "@/app/(private)/don-hang/order-query";
import { CUSTOMERS_QUERY_KEY } from "@/app/(private)/khach-hang/customer-query";
import { PRODUCTS_QUERY_KEY } from "@/app/(private)/san-pham/product-query";
import { listCustomers } from "@/lib/data/customers";
import { listOrders } from "@/lib/data/orders";
import { listProducts } from "@/lib/data/products";
import { getQueryClient } from "@/lib/query-client";

export default async function DonHangPage() {
  const queryClient = getQueryClient();

  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: ORDERS_QUERY_KEY,
      queryFn: listOrders,
    }),
    queryClient.prefetchQuery({
      queryKey: CUSTOMERS_QUERY_KEY,
      queryFn: listCustomers,
    }),
    queryClient.prefetchQuery({
      queryKey: PRODUCTS_QUERY_KEY,
      queryFn: listProducts,
    }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <OrdersPageClient />
    </HydrationBoundary>
  );
}
