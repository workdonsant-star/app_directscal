import { AppPage } from "@/components/app-page";

export default function AdminLoading() {
  return (
    <>
      <div className="flex h-14 items-center gap-3 border-b px-4">
        <div className="h-8 w-8 rounded-md bg-muted" />
        <div className="h-4 w-44 rounded bg-muted" />
      </div>
      <AppPage>
        <div className="flex w-full flex-col gap-8">
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="rounded-lg border bg-card p-5">
                <div className="h-3 w-24 rounded bg-muted" />
                <div className="mt-6 h-8 w-16 rounded bg-muted" />
                <div className="mt-5 h-3 w-32 rounded bg-muted" />
              </div>
            ))}
          </section>
          <div className="overflow-hidden rounded-lg border">
            <div className="h-11 bg-muted/60" />
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="grid grid-cols-6 gap-4 border-t p-4">
                <div className="col-span-2 h-4 rounded bg-muted" />
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
