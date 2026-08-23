import { AppTopbar } from "@/components/app-topbar";
import { Skeleton } from "@/components/ui/skeleton";

export default function LayersDashboardLoading() {
  return (
    <>
      <AppTopbar
        breadcrumb={[
          { label: "Maturidade", href: "/omdx" },
          { label: "Camadas" },
        ]}
      />
      <main className="flex flex-1 flex-col px-6 py-8 lg:px-10">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
          <div className="space-y-2">
            <Skeleton className="h-7 w-64" />
            <Skeleton className="h-5 w-full max-w-xl" />
          </div>
          <div className="rounded-lg border p-4">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="mt-3 h-5 w-full max-w-2xl" />
            <Skeleton className="mt-8 h-[420px] w-full" />
          </div>
          <div className="rounded-lg border p-4">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="mt-3 h-5 w-full max-w-2xl" />
            <Skeleton className="mt-8 h-[420px] w-full" />
          </div>
        </div>
      </main>
    </>
  );
}
