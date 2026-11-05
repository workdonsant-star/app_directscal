import { AppPage } from "@/components/app-page";
import { AppTopbar } from "@/components/app-topbar";
import { Skeleton } from "@/components/ui/skeleton";

function ChartPlaceholder({ bars }: { bars: number }) {
  return (
    <div className="flex min-w-0 flex-col gap-4 rounded-[10px] bg-sidebar p-5 dark:bg-card">
      <Skeleton className="h-6 w-40" />
      <Skeleton className="h-3 w-64 max-w-full" />
      <div className="mt-5 flex flex-col gap-5">
        {Array.from({ length: bars }, (_, index) => (
          <div key={index} className="flex items-center gap-4">
            <Skeleton className="h-4 w-20 shrink-0" />
            <Skeleton className="h-2 flex-1 rounded-full" />
            <Skeleton className="h-4 w-8 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

function TablePlaceholder({ rows }: { rows: number }) {
  return (
    <div className="flex min-w-0 flex-col gap-4 rounded-[10px] bg-sidebar p-5 dark:bg-card">
      <Skeleton className="h-6 w-48 max-w-full" />
      <div className="grid grid-cols-4 gap-4 rounded-[5px] bg-muted/60 px-4 py-3">
        {["w-28", "w-20", "w-24", "w-16"].map((width, index) => <Skeleton key={index} className={`h-4 max-w-full ${width}`} />)}
      </div>
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="grid grid-cols-4 gap-4 border-b border-border/50 px-4 py-3">
          <Skeleton className="h-4 w-full max-w-44" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-12" />
        </div>
      ))}
    </div>
  );
}

export default function OmdxLoading() {
  return (
    <>
      <AppTopbar />
      <AppPage>
        <div role="status" aria-label="Carregando Analytics" className="flex w-full flex-col gap-10">
          <div aria-hidden="true" className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-7 w-72 max-w-full" />
              <Skeleton className="h-4 w-[38rem] max-w-full" />
            </div>
            <Skeleton className="h-9 w-44" />
          </div>
          <div aria-hidden="true" className="grid gap-10 xl:grid-cols-2 xl:gap-4">
            <ChartPlaceholder bars={6} />
            <ChartPlaceholder bars={3} />
          </div>
          <div aria-hidden="true" className="flex flex-col gap-10">
            <TablePlaceholder rows={5} />
          </div>
        </div>
      </AppPage>
    </>
  );
}
