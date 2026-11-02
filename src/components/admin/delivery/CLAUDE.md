# `src/components/admin/delivery` — Workspace da entrega

Antes de editar, releia o **AGENTS.md** da raiz, `src/components/admin/CLAUDE.md` e `src/app/(app)/admin/entregas/CLAUDE.md`.

## Propósito

Interface interna de `/admin/entregas/[id]/*`: analisar os dados do cliente, produzir relatório, action points e ativos, e publicar. Cada etapa é uma rota; o estado editável fica no layout.

## Componentes

| Arquivo | Uso |
| --- | --- |
| `delivery-draft.ts` | Helpers puros: seções e campos vazios do relatório, `formatScore`, rótulos de camada. |
| `delivery-draft-provider.tsx` | Contexto client montado no `layout.tsx`: relatório, leituras por dimensão, action points, especialista, status e `persistDelivery` (PATCH `/api/admin/deliveries/[id]`). `useDeliveryDraft()` expõe tudo às etapas. |
| `delivery-shell.tsx` | Shell das etapas operacionais. Na rota `relatorio`, não renderiza cabeçalho, seletor, navegação lateral, checklist nem ações da topbar; o relatório apresenta apenas gráficos, campos e salvamento do rascunho. |
| `delivery-data-step.tsx` | Visão analítica legada; a rota `/dados` redireciona para o relatório. |
| `delivery-report-step.tsx` | Relatório editável com gráficos da coleta e seis seções de redação. |
| `delivery-action-points-step.tsx` | Seleção de action points do catálogo. |
| `delivery-publish-step.tsx` | Prévia do cliente. |

## Convenções

- Etapas são Client Components finos, consumindo `useDeliveryDraft()`; as páginas em `src/app/` só as renderizam. Ativos são páginas de servidor e não passam pelo provider.
- O provider usa `key={id}` no layout: trocar de diagnóstico reinicia o rascunho.
- Alterações não salvas ainda não geram aviso ao sair; salvar e publicar continuam explícitos.
- Ativos têm ciclo editorial próprio e não bloqueiam a publicação da entrega.
- Texto visível em pt-BR, sem emoji e sem ponto de exclamação; tokens e `cn()`; tabelas seguem `Table variant="operational"`.

- Nomes e opções de especialistas usam useSpecialists e o cadastro persistido; as autorizações de atribuição são verificadas novamente pelo servidor.

## Revisão C1 — 24/10/2026

- Nas etapas operacionais restantes, Pré-visualizar abre a etapa de publicação com as seis seções editoriais e títulos/descrições das ações selecionadas. Não persiste nem publica por navegar. O relatório é uma superfície de escrita isolada, sem essas opções.
- Relatórios novos começam com os seis campos e as leituras por dimensão vazios. Publicações existentes preservam a redação salva. O editor mostra gráficos da coleta junto aos campos, e a confirmação continua em Publicar.
- O provider compara o conteúdo atual com o último payload salvo: mudanças mostram Alterações não salvas e permitem republicar. Uma resposta de salvamento não marca como salvas edições feitas durante a requisição.
- Falha preserva toda a redação e aparece como alert; confirmação usa status neutro. Resposta sem JSON/publicação é falha, nunca sucesso.
- O banco conserva o snapshot publicado durante save; o status do rascunho não retira a versão já entregue ao cliente.

Shell e rascunho consomem o mesmo SpecialistsProvider preenchido pelo layout no servidor, preservando nomes e seleção desde a primeira renderização.

Provider e shell adaptam requisições, links, downloads e pathname por useAppRuntime, inclusive o checklist e o seletor de diagnóstico. O catálogo e os cálculos puros vêm de admin-delivery-domain.ts, para que a demo reutilize as etapas sem carregar os seeds de especialistas/empresas da operação.
