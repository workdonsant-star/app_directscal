import { AppPage } from "@/components/app-page";
import { AppTopbar } from "@/components/app-topbar";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function Loading() {
  return (
    <>
      <AppTopbar />
      <AppPage>
        <div role="status" aria-label="Carregando campanhas" className="flex w-full flex-col gap-8">
          <section aria-hidden="true" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="flex flex-col gap-3 rounded-xl border bg-card px-6 py-5">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-9 w-16" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-36 max-w-full" />
              </div>
            ))}
          </section>
          <section aria-hidden="true" className="flex flex-col gap-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex flex-col gap-2"><Skeleton className="h-6 w-52" /><Skeleton className="h-4 w-96 max-w-full" /></div>
              <div className="flex gap-2"><Skeleton className="h-8 w-24" /><Skeleton className="h-8 w-32" /></div>
            </div>
            <Table>
              <TableHeader><TableRow>
                {["w-24", "w-16", "w-16", "w-28", "w-12", "w-16", "w-14", "w-12"].map((width, index) => <TableHead key={index}><Skeleton className={`h-4 ${width}`} /></TableHead>)}
              </TableRow></TableHeader>
              <TableBody>
                {Array.from({ length: 4 }, (_, row) => <TableRow key={row}>
                  {["w-28", "w-16", "w-20", "w-36", "w-8", "w-12", "w-8", "w-12"].map((width, index) => <TableCell key={index}><Skeleton className={`h-4 max-w-full ${width}`} /></TableCell>)}
                </TableRow>)}
              </TableBody>
            </Table>
          </section>
        </div>
      </AppPage>
    </>
  );
}
