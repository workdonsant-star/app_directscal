import { AppPage } from "@/components/app-page";

export default function DiagnosticsLoading() {
  return (
    <>
      <div className="flex h-14 items-center gap-3 border-b px-4">
        <div className="h-8 w-8 rounded-md bg-muted" />
        <div className="h-4 w-56 rounded bg-muted" />
      </div>
      <AppPage>
        <div className="flex w-full flex-col gap-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="h-6 w-52 rounded bg-muted" />
              <div className="mt-3 h-3 w-96 max-w-full rounded bg-muted" />
            </div>
            <div className="h-9 w-40 rounded-md bg-muted" />
          </div>
          <div className="overflow-hidden rounded-lg border">
            <div className="h-11 bg-muted/60" />
            {Array.from({ length: 7 }).map((_, index) => (
              <div key={index} className="grid grid-cols-5 gap-4 border-t p-4">
                <div className="h-4 rounded bg-muted" />
                <div className="h-4 rounded bg-muted" />
                <div className="h-4 rounded bg-muted" />
                <div className="h-4 rounded bg-muted" />
                <div className="h-4 rounded bg-muted" />
              </div>
            ))}
          </div>
        </div>
      </AppPage>
    </>
  );
}
