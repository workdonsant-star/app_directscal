import { AppPage } from "@/components/app-page";
import { AppTopbar } from "@/components/app-topbar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const metricWidths = ["w-28", "w-40", "w-24"];
const questionWidths = ["w-4/5", "w-3/5", "w-11/12", "w-2/3", "w-5/6"];

export default function InsightsLoading() {
  return (
    <>
      <AppTopbar
        actions={<Skeleton className="h-7 w-[18ch]" />}
      />

      <AppPage>
        <div className="flex w-full flex-col gap-6">
          <section
            aria-label="Carregando indicadores da dimensão"
            className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
          >
            {metricWidths.map((width, index) => (
              <Card
                key={width}
                size="sm"
                className="h-[128px] gap-1 rounded-[5px] border-0 bg-sidebar py-2 shadow-none ring-0"
              >
                <CardHeader className="flex flex-row items-start justify-between gap-3 pb-0">
                  <Skeleton className={`h-4 ${width}`} />
                </CardHeader>
                <CardContent>
                  <div className="py-2">
                    <Skeleton
                      className={index === 1 ? "h-9 w-24" : "h-9 w-14"}
                    />
                    <Skeleton className="mt-2 h-3 w-36" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </section>

          <section aria-label="Carregando resultado das perguntas">
            <table
              aria-hidden="true"
              className="w-full table-fixed caption-bottom overflow-hidden rounded-[5px] text-sm"
            >
              <thead>
                <tr>
                  <th className="h-11 rounded-l-[5px] bg-muted px-4 text-left">
                    <Skeleton className="h-4 w-20" />
                  </th>
                  <th className="h-11 w-[440px] bg-muted px-4 text-left">
                    <Skeleton className="h-4 w-40" />
                  </th>
                  <th className="h-11 w-28 bg-muted px-4 text-left">
                    <Skeleton className="h-4 w-20" />
                  </th>
                  <th className="h-11 w-36 rounded-r-[5px] bg-muted px-4 text-left">
                    <Skeleton className="h-4 w-14" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {questionWidths.map((width, index) => (
                  <tr
                    key={`${width}-${index}`}
                    className={index < questionWidths.length - 1 ? "border-b-[0.5px] border-border" : undefined}
                  >
                    <td className="h-[55px] px-4 py-4 align-middle">
                      <Skeleton className={`h-4 ${width}`} />
                    </td>
                    <td className="h-[55px] px-4 py-4 align-middle">
                      <Skeleton className="h-[22px] w-full max-w-[360px] rounded-none" />
                    </td>
                    <td className="h-[55px] px-4 py-4 align-middle">
                      <Skeleton className="h-4 w-10" />
                    </td>
                    <td className="h-[55px] px-4 py-4 align-middle">
                      <Skeleton className="h-4 w-20" />
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
