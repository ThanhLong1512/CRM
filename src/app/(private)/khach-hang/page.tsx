import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { CustomersPageClient } from "@/app/(private)/khach-hang/CustomersPageClient";
import { CUSTOMERS_QUERY_KEY } from "@/app/(private)/khach-hang/customer-query";
import { listCustomers } from "@/lib/data/customers";
import { getQueryClient } from "@/lib/query-client";

export default async function KhachHangPage() {
  const queryClient = getQueryClient();
  await queryClient.prefetchQuery({
    queryKey: CUSTOMERS_QUERY_KEY,
    queryFn: listCustomers,
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <CustomersPageClient />
    </HydrationBoundary>
  );
}
