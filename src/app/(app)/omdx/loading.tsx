function MetricSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-5">
      <div className="h-3 w-28 rounded bg-muted" />
      <div className="mt-6 h-10 w-20 rounded bg-muted" />
      <div className="mt-5 h-2 w-full rounded bg-muted" />
    </div>
  );
}

export default function OmdxLoading() {
  return (
    <>
      <div className="flex h-14 items-center gap-3 border-b px-4">
        <div className="h-8 w-8 rounded-md bg-muted" />
        <div className="h-4 w-40 rounded bg-muted" />
        <div className="ml-auto h-9 w-48 rounded-md bg-muted" />
      </div>
      <main className="flex flex-1 flex-col px-6 py-8 lg:px-10">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <MetricSkeleton key={index} />
            ))}
          </section>
          <section className="grid gap-8 xl:grid-cols-2">
            <div className="h-[560px] rounded-lg border bg-card p-6">
              <div className="h-5 w-56 rounded bg-muted" />
              <div className="mt-3 h-3 w-80 max-w-full rounded bg-muted" />
              <div className="mt-8 h-[430px] rounded-md bg-muted" />
            </div>
            <div className="h-[560px] rounded-lg border bg-card p-6">
              <div className="h-5 w-44 rounded bg-muted" />
              <div className="mt-3 h-3 w-72 max-w-full rounded bg-muted" />
              <div className="mt-8 h-[430px] rounded-md bg-muted" />
            </div>
          </section>
          <div className="h-80 rounded-lg border bg-card" />
        </div>
      </main>
    </>
  );
}
