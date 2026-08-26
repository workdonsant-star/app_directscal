import { AppPage } from "@/components/app-page";
import { AppTopbar } from "@/components/app-topbar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const metricWidths = ["w-28", "w-40", "w-36", "w-44"];
const questionWidths = ["w-4/5", "w-3/5", "w-11/12", "w-2/3", "w-5/6"];

export default function InsightsLoading() {
  return (
    <>
      <AppTopbar
        breadcrumb={[{ label: "Insights" }, { label: "Dimensão" }]}
        actions={<Skeleton className="h-7 w-[18ch]" />}
      />

      <AppPage>
        <div className="flex w-full flex-col gap-6">
          <section
            aria-label="Carregando indicadores da dimensão"
            className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
          >
            {metricWidths.map((width, index) => (
              <Card key={width} size="sm" className="gap-2">
                <CardHeader className="flex flex-row items-start justify-between gap-3 pb-0">
                  <Skeleton className={`h-4 ${width}`} />
                  <Skeleton className="size-6 shrink-0 rounded-md" />
                </CardHeader>
                <CardContent>
                  <div className="py-4">
                    <Skeleton
                      className={
                        index === 1 || index === 3 ? "h-9 w-24" : "h-9 w-14"
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </section>

          <section
            aria-label="Carregando resultado das perguntas"
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col gap-1">
              <Skeleton className="h-7 w-56" />
              <Skeleton className="h-5 w-full max-w-2xl" />
            </div>

            <table
              aria-hidden="true"
              className="w-full table-fixed caption-bottom border-y text-sm"
            >
              <thead className="border-b bg-muted/30">
                <tr>
                  <th className="h-11 px-4 text-left">
                    <Skeleton className="h-4 w-20" />
                  </th>
                  <th className="h-11 w-[440px] px-4 text-left">
                    <Skeleton className="h-4 w-40" />
                  </th>
                  <th className="h-11 w-28 px-4 text-left">
                    <Skeleton className="h-4 w-20" />
                  </th>
                  <th className="h-11 w-36 px-4 text-left">
                    <Skeleton className="h-4 w-14" />
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {questionWidths.map((width, index) => (
                  <tr key={`${width}-${index}`}>
                    <td className="px-4 py-4 align-middle">
                      <div className="space-y-2">
                        <Skeleton className={`h-4 ${width}`} />
                        {index % 2 === 0 && <Skeleton className="h-4 w-2/5" />}
                      </div>
                    </td>
                    <td className="px-4 py-4 align-middle">
                      <Skeleton className="h-5 w-full max-w-[360px] rounded-sm" />
                    </td>
                    <td className="px-4 py-4 align-middle">
                      <Skeleton className="h-4 w-10" />
                    </td>
                    <td className="px-4 py-4 align-middle">
                      <div className="flex items-center gap-2">
                        <Skeleton className="size-2 shrink-0 rounded-full" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      </AppPage>
    </>
  );
}
