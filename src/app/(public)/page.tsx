import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function PublicHomePage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center gap-8 px-6 py-16">
      <div className="space-y-3">
        <p className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
          CRM / DMS
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-foreground">
          crm-dauan
        </h1>
        <p className="max-w-xl text-lg text-muted-foreground">
          Distribution management for lubricant oil — products, sales, and fleet
          operations in one place.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Link href="/dashboard" className={cn(buttonVariants())}>
          Open dashboard
        </Link>
        <Link
          href="/catalog"
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          Product catalog
        </Link>
      </div>
    </main>
  );
}
