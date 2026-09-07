import { MasterListSkeleton } from "@/components/features/MasterListSkeleton";

export default function DashboardLoading() {
  return <MasterListSkeleton statCount={4} columns={2} rows={4} />;
}
