import { Settings2 } from "lucide-react";

import { PessoasStatusBadge } from "@/components/pessoas/pessoas-status-badge";
import type { PeopleConfigurationWorkspace } from "@/lib/types";

export function PessoasConfigurationWorkspace({
  workspace,
}: {
  workspace: PeopleConfigurationWorkspace;
}) {
  return (
    <div className="flex flex-col gap-8">
      <section>
        <div className="flex items-start gap-3">
          <Settings2 className="mt-1 size-5 text-primary" />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Configurações de Pessoas
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Parâmetros mínimos do MVP. A documentação técnica ainda precisa
              definir versionamento, permissões e regras oficiais antes de
              qualquer cálculo legal ou integração financeira.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-lg border">
          <div className="border-b px-4 py-3">
            <h2 className="text-base font-semibold text-foreground">
              Tipos de vínculo
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Campos e alertas mudam conforme o vínculo.
            </p>
          </div>
          <div className="divide-y">
            {workspace.employmentTypes.map((item) => (
              <div key={item.id} className="px-4 py-3">
                <p className="text-sm font-medium text-foreground">
                  {item.label}
                </p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border">
          <div className="border-b px-4 py-3">
            <h2 className="text-base font-semibold text-foreground">
              Status de pagamento
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Fluxo do cálculo até pagamento ou reabertura.
            </p>
          </div>
          <div className="grid gap-2 p-4 sm:grid-cols-2">
            {workspace.paymentStatuses.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-md border px-3 py-2"
              >
                <span className="text-sm text-foreground">{item.label}</span>
                <PessoasStatusBadge kind="payment" status={item.id} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-lg border">
          <div className="border-b px-4 py-3">
            <h2 className="text-base font-semibold text-foreground">
              Centros de custo
            </h2>
          </div>
          <div className="flex flex-wrap gap-2 p-4">
            {workspace.costCenters.map((item) => (
              <span
                key={item}
                className="rounded-md border px-2.5 py-1 text-sm text-foreground"
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-lg border">
          <div className="border-b px-4 py-3">
            <h2 className="text-base font-semibold text-foreground">
              Tipos de documento
            </h2>
          </div>
          <div className="flex flex-wrap gap-2 p-4">
            {workspace.documentTypes.map((item) => (
              <span
                key={item}
                className="rounded-md border px-2.5 py-1 text-sm text-foreground"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
