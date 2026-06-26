# `src/components/pessoas` — Componentes do módulo Pessoas

Antes de editar, releia o `AGENTS.md` da raiz e `src/components/CLAUDE.md`.

## Propósito

Esta pasta contém os componentes do módulo Pessoas: Overview, diretório com ação de copiar link público de cadastro, perfil individual, fechamento mensal e configurações mínimas.

## Convenções locais

- O perfil da pessoa é a superfície central do módulo.
- Componentes recebem DTOs de `src/lib/data/pessoas-data-source.ts`; não importam mocks brutos nem consultam Supabase diretamente.
- Use linguagem operacional e financeira: vínculo, custo, fechamento, pendência, responsabilidade.
- Não tratar Pessoas como RH genérico ou folha completa.
- Tabelas operacionais ficam livres no fluxo da página, com wrapper `overflow-hidden rounded-lg border`.
- Badges e formatadores compartilhados ficam nesta pasta para manter rótulos consistentes.

## Escopo atual

- MVP navegável com dados mockados server-side e cadastros vindos do onboarding operacional quando disponíveis.
- Sem Server Actions, persistência própria de Pessoas ou motor legal de CLT nesta fase.
- CLT aparece como cadastro/simulação de custo, sem cálculo oficial.
