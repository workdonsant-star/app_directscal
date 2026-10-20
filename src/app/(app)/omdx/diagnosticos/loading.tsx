import { AppPage } from "@/components/app-page";
import { AppTopbar } from "@/components/app-topbar";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const columns = [
  { label: "Diagnóstico", width: 260 },
  { label: "Criado por", width: 190 },
  { label: "Fundador", width: 105 },
  { label: "Liderança", width: 105 },
  { label: "Times", width: 105 },
  { label: "Status", width: 85 },
  { label: "Respostas", width: 85 },
  { label: "Resp. fundador", width: 120 },
  { label: "Resp. liderança", width: 120 },
  { label: "Resp. time", width: 120 },
  { label: "Score", width: 60 },
  { label: "", width: 60 },
];

export default function DiagnosticsLoading() {
  return (
    <>
      <AppTopbar actions={
        <div aria-hidden="true" className="flex min-w-0 items-center gap-2">
          <div className="flex gap-2">
            {[72, 72, 96, 104].map((width, index) => <Skeleton key={index} style={{ width }} className="h-8 rounded-[5px] motion-reduce:animate-none" />)}
          </div>
          <Skeleton className="h-8 w-36 rounded-[5px] motion-reduce:animate-none" />
        </div>
      } />
      <AppPage>
        <div role="status" aria-busy="true" className="min-w-0 w-full">
          <span className="sr-only">Carregando pesquisas</span>
          <div aria-hidden="true">
            <Table className="min-w-[1360px] table-fixed">
              <TableHeader>
                <TableRow>
                  {columns.map((column, index) => (
                    <TableHead key={index} style={{ width: column.width }} className={index >= 6 ? "h-11 px-4 text-right" : "h-11 px-4"}>{column.label}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 5 }, (_, row) => (
                  <TableRow key={row}>
                    <TableCell className="px-4 py-4">
                      <div className="flex flex-col gap-2">
                        <Skeleton className="h-4 w-36 motion-reduce:animate-none" />
                        <Skeleton className="h-3 w-40 motion-reduce:animate-none" />
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Skeleton className="size-6 shrink-0 rounded-full motion-reduce:animate-none" />
                        <div className="flex flex-col gap-2">
                          <Skeleton className="h-4 w-24 motion-reduce:animate-none" />
                          <Skeleton className="h-3 w-10 motion-reduce:animate-none" />
                        </div>
                      </div>
                    </TableCell>
                    {[0, 1, 2].map((index) => <TableCell key={index} className="px-4 py-4"><Skeleton className="h-6 w-16 rounded-[5px] motion-reduce:animate-none" /></TableCell>)}
                    <TableCell className="px-4 py-4"><Skeleton className="h-5 w-14 rounded-full motion-reduce:animate-none" /></TableCell>
                    {[0, 1, 2, 3, 4].map((index) => <TableCell key={index} className="px-4 py-4"><Skeleton className="ml-auto h-4 w-6 motion-reduce:animate-none" /></TableCell>)}
                    <TableCell className="px-4 py-4"><Skeleton className="size-7 rounded-[5px] motion-reduce:animate-none" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </AppPage>
    </>
  );
}
