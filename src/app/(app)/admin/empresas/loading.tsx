import { AppPage } from "@/components/app-page";
import { AppTopbar } from "@/components/app-topbar";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function Loading() {
  return (
    <>
      <AppTopbar />
      <AppPage>
        <section role="status" aria-label="Carregando empresas" className="flex w-full flex-col gap-6">
          <div aria-hidden="true" className="flex flex-col gap-2">
            <Skeleton className="h-7 w-64" />
            <Skeleton className="h-4 w-[38rem] max-w-full" />
          </div>
          <Skeleton aria-hidden="true" className="h-9 w-full max-w-3xl" />
          <Table aria-hidden="true" variant="operational">
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"><Skeleton className="size-4" /></TableHead>
                {["w-20", "w-16", "w-16"].map((width, index) => <TableHead key={index}><Skeleton className={`h-4 ${width}`} /></TableHead>)}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }, (_, index) => (
                <TableRow key={index}>
                  <TableCell><Skeleton className="size-4" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-44 max-w-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32 max-w-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-48 max-w-full" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>
      </AppPage>
    </>
  );
}
