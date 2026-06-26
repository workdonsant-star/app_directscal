export default function InsightsLoading() {
  return (
    <>
      <div className="flex h-14 items-center gap-3 border-b px-4">
        <div className="h-8 w-8 rounded-md bg-muted" />
        <div className="h-4 w-52 rounded bg-muted" />
        <div className="ml-auto h-9 w-48 rounded-md bg-muted" />
      </div>
      <main className="flex flex-1 flex-col px-6 py-8 lg:px-10">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="rounded-lg border bg-card p-5">
                <div className="h-3 w-28 rounded bg-muted" />
                <div className="mt-6 h-9 w-20 rounded bg-muted" />
                <div className="mt-5 h-2 w-full rounded bg-muted" />
              </div>
            ))}
          </section>
          <div className="overflow-hidden rounded-lg border">
            <div className="h-11 bg-muted/60" />
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="grid grid-cols-5 gap-4 border-t p-4">
                <div className="col-span-2 h-4 rounded bg-muted" />
                <div className="h-4 rounded bg-muted" />
                <div className="h-4 rounded bg-muted" />
                <div className="h-4 rounded bg-muted" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
