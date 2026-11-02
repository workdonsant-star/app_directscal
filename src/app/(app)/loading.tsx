import { AppPage } from "@/components/app-page";
import { AppTopbar } from "@/components/app-topbar";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <>
      <AppTopbar />
      <AppPage>
        <div role="status" aria-label="Carregando informações" className="flex flex-col gap-6">
          <div aria-hidden="true" className="flex flex-col gap-3">
            <Skeleton className="h-7 w-56" />
            <Skeleton className="h-4 w-2/3 max-w-xl" />
          </div>
          <div aria-hidden="true" className="flex flex-col gap-4">
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </AppPage>
    </>
  );
}
