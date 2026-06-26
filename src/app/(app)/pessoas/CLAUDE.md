# `src/app/(app)/pessoas` — Módulo Pessoas

Antes de editar, releia `AGENTS.md` e `src/app/CLAUDE.md`.

## Propósito

Rotas autenticadas do módulo Pessoas. O módulo estrutura quem está na operação, qual vínculo possui, quanto custa, quais pendências bloqueiam governança ou pagamento e como isso entra no fechamento mensal.

## Rotas

- `/pessoas` — Overview executivo de custo, pendências e alertas.
- `/pessoas/diretorio` — diretório operacional e financeiro, com botão para copiar o link público de cadastro.
- `/pessoas/[id]` — perfil individual como fonte primária da pessoa.
- `/pessoas/fechamento` — fechamento mensal simples.
- `/pessoas/pagamentos` — redirect legado para `/pessoas/fechamento`.
- `/pessoas/configuracoes` — parâmetros mínimos do MVP.

## Convenções

- Todas as páginas usam o shell autenticado do route group `(app)`.
- O acesso passa por `module_people`, registrado no catálogo mockado de módulos.
- Dados vêm de `src/lib/data/pessoas-data-source.ts`.
- O diretório compõe dados mockados de vínculos/custos com cadastros reais vindos de `operational_members` quando a organização possui onboarding operacional.
- O link público permanece em `/o/[token]` e é copiado a partir de `/pessoas/diretorio`; não existe tela autenticada própria para cadastro.
- Sem Server Actions, tabelas próprias de Pessoas ou motor legal de folha neste ciclo.
- CLT é cadastro/simulação de custo, não cálculo oficial de folha.
