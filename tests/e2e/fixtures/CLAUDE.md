# Fixtures de interface do ciclo 1

Cenários fictícios para montar componentes reais em uma rota temporária de desenvolvimento. Não são autenticação, persistência ou homologação de produção. Playwright intercepta toda API, incluindo especialistas e salvamento editorial; nenhum serviço externo deve ser chamado. Controles “Fixture” navegam entre componentes, sem provar a navegação autenticada.

Para reproduzir, crie temporariamente `src/app/c1-review-fixture/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CycleOneWorkspace } from "../../../tests/e2e/fixtures/cycle-one-workspace";
export default function Page() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <Suspense><CycleOneWorkspace /></Suspense>;
}
```

Crie também um CLAUDE.md local identificando a rota temporária. Execute `DIRECTSCAL_C1_UI_FIXTURE=true npx playwright test tests/e2e/cycle-one.spec.ts tests/e2e/password-recovery.spec.ts --timeout=60000`. Remova a pasta da rota após os testes e regenere tipos do Next antes do build. A suíte não roda sem a variável explícita. O sinal data-hydrated evita editar o formulário antes de conectar os handlers do React; capturas de Sheet esperam opacidade final.

A leitura nativa é comparada com as seis seções do mesmo fixture editorial. O Action Point usa título, descrição e prazo sugerido do catálogo. SQL verifica snapshots de publicação separadamente, com ROLLBACK. Capturas/PDFs e limites de evidência ficam em docs/evidencias/ciclo-1-2026-10-24.

## Ciclo 2

Crie temporariamente `src/app/c2-review-fixture/page.tsx` com o mesmo gate `NODE_ENV === "development"` acima e `CycleTwoWorkspace` importado de `../../../tests/e2e/fixtures/cycle-two-workspace`. Monte em Suspense. Execute `DIRECTSCAL_C2_UI_FIXTURE=true npx playwright test tests/e2e/cycle-two.spec.ts --workers=1 --timeout=60000`. Remova a rota ao terminar e execute `npx next typegen` antes do typecheck. Os 16 cenários usam APIs interceptadas para atribuição, fila de validade, RACI, metadados Slack/recuperação, paginação e consulta com fontes/feedback/recusa/erro. A preservação do contato usa props fixas da publicação; persistência e isolamento são verificações separadas, não uma segunda sessão real.

## Ciclo 3 — Operação de rotinas

Use a rota temporária `src/app/c3-review-fixture/page.tsx` com o mesmo gate de desenvolvimento e Suspense, importando CycleThreeWorkspace de `../../../tests/e2e/fixtures/cycle-three-workspace`. Execute `DIRECTSCAL_C3_UI_FIXTURE=true npx playwright test tests/e2e/cycle-three.spec.ts --workers=1 --timeout=60000`. Remova a rota e regenere tipos depois. O fixture usa SidebarProvider e DTO fictício; APIs são interceptadas, sem autenticação ou Slack real. A suíte verifica diretório indisponível/atualizado, responsável removido, conflito de transferência preservando campos, gravação confirmada seguida de falha de leitura e pré-requisitos ausentes, nos dois temas. Não comprova persistência entre sessões.
