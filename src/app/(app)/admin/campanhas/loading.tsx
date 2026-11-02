import { AppPage } from "@/components/app-page";
import { AppTopbar } from "@/components/app-topbar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <>
      <AppTopbar />
      <AppPage>
        <div role="status" aria-label="Carregando campanhas" className="flex flex-col gap-8">
          <div aria-hidden="true" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }, (_, index) => (
              <Card key={index} className="gap-2">
                <CardHeader className="pb-0"><Skeleton className="h-4 w-28 bg-border" /></CardHeader>
                <CardContent className="flex flex-col gap-1">
                  <Skeleton className="h-9 w-16 bg-border" />
                  <Skeleton className="h-5 w-36 bg-border" />
                  <Skeleton className="h-4 w-40 bg-border" />
                </CardContent>
              </Card>
            ))}
          </div>
          <div aria-hidden="true" className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <h2 className="text-ui-title text-foreground">Campanhas de aquisição</h2>
              <p className="text-muted-foreground text-sm">Cada campanha tem um link público e um formulário próprio.</p>
            </div>
            <Skeleton className="h-11 w-full" />
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="flex h-[55px] items-center justify-between gap-6 border-b border-border/50 px-4">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-5 w-1/4" />
                <Skeleton className="h-5 w-16" />
              </div>
            ))}
          </div>
        </div>
      </AppPage>
    </>
  );
}
