import { AppPage } from "@/components/app-page";
import { AppTopbar } from "@/components/app-topbar";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <>
      <AppTopbar />
      <AppPage>
        <section role="status" aria-label="Carregando empresas" className="flex flex-col gap-4">
          <div aria-hidden="true" className="flex flex-col gap-1">
            <h1 className="text-ui-page">Empresas cadastradas</h1>
            <p className="text-muted-foreground text-sm">
              Empresas com conta criada no sistema. Abra uma empresa para acessar seus dados e ativos de gestão.
            </p>
          </div>
          <div aria-hidden="true" className="flex flex-col gap-4">
            <Skeleton className="h-11 w-full max-w-3xl" />
            <Skeleton className="h-11 w-full" />
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="flex h-[55px] items-center justify-between gap-6 border-b border-border/50 px-4">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-5 w-1/6" />
              </div>
            ))}
          </div>
        </section>
      </AppPage>
    </>
  );
}
