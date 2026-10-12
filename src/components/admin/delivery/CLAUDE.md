# `src/components/admin/delivery` — Workspace da entrega

Antes de editar, releia o **AGENTS.md** da raiz, `src/components/admin/CLAUDE.md` e `src/app/(app)/admin/entregas/CLAUDE.md`.

## Propósito

Interface interna de `/admin/entregas/[id]/*`: analisar os dados do cliente, produzir relatório, action points e ativos, e publicar. Cada etapa é uma rota; o estado editável fica no layout.

## Componentes

| Arquivo | Uso |
| --- | --- |
| `delivery-draft.ts` | Helpers puros: seções do relatório, textos iniciais, `formatScore`, rótulos de camada. |
| `delivery-draft-provider.tsx` | Contexto client montado no `layout.tsx`: relatório, leituras por dimensão, action points, especialista, status e `persistDelivery` (PATCH `/api/admin/deliveries/[id]`). `useDeliveryDraft()` expõe tudo às etapas. |
| `delivery-shell.tsx` | Cabeçalho (empresa, status, seletor de diagnóstico, download), navegação lateral por fase (Analisar, Produzir, Entregar), especialista e checklist "Para publicar" visível em todas as etapas. Salvar e publicar na topbar, ocultos em `/ativos`. |
| `delivery-data-step.tsx` | Visão analítica e análise por dimensão com a leitura do especialista. |
| `delivery-report-step.tsx` | Editor das seções do relatório. |
| `delivery-action-points-step.tsx` | Seleção de action points do catálogo. |
| `delivery-publish-step.tsx` | Prévia do cliente. |

## Convenções

- Etapas são Client Components finos, consumindo `useDeliveryDraft()`; as páginas em `src/app/` só as renderizam. Ativos são páginas de servidor e não passam pelo provider.
- O provider usa `key={id}` no layout: trocar de diagnóstico reinicia o rascunho.
- Alterações não salvas ainda não geram aviso ao sair; salvar e publicar continuam explícitos.
- Ativos têm ciclo editorial próprio e não bloqueiam a publicação da entrega.
- Texto visível em pt-BR, sem emoji e sem ponto de exclamação; tokens e `cn()`; tabelas seguem `Table variant="operational"`.

- Nomes e opções de especialistas usam useSpecialists e o cadastro persistido; as autorizações de atribuição são verificadas novamente pelo servidor.
