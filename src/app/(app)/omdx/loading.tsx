import { AppPage } from "@/components/app-page";
import { AppTopbar } from "@/components/app-topbar";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function LoadingPanel({
  className,
  label,
}: {
  className: string;
  label: string;
}) {
  return (
    <Card
      aria-label={label}
      className={`rounded-[5px] border-0 bg-sidebar p-5 shadow-none ring-0 ${className}`}
    >
      <Skeleton className="size-full rounded-[3px]" />
    </Card>
  );
}

export default function OmdxLoading() {
  return (
    <>
      <AppTopbar />
      <AppPage>
        <div className="flex w-full flex-col gap-8">
          <div aria-label="Carregando cabeçalho" className="h-12 w-72">
            <Skeleton className="size-full rounded-md" />
          </div>

          <section
            aria-label="Carregando indicadores executivos"
            className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3"
          >
            {[
              "Carregando base de respostas",
              "Carregando maturidade geral",
              "Carregando gap médio",
            ].map((label) => (
              <LoadingPanel key={label} className="h-[128px]" label={label} />
            ))}
          </section>

          <section
            aria-label="Carregando comparativos de maturidade"
            className="grid gap-6 xl:grid-cols-3"
          >
            {[
              "Carregando maturidade por camada",
              "Carregando maturidade por dimensão",
              "Carregando composição por dimensão",
            ].map((label) => (
              <LoadingPanel
                key={label}
                className="h-[462px]"
                label={label}
              />
            ))}
          </section>

          <section
            aria-label="Carregando matrizes de vulnerabilidades e alavancas"
            className="grid gap-6 xl:grid-cols-2"
          >
            {[
              "Carregando vulnerabilidades por pergunta",
              "Carregando alavancas prioritárias",
            ].map((label) => (
              <LoadingPanel
                key={label}
                className="min-h-[414px]"
                label={label}
              />
            ))}
          </section>
        </div>
      </AppPage>
    </>
  );
}
