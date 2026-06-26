# `/api/omdx/operational-onboarding` — Onboarding operacional

## Propósito

Route Handlers autenticados para ações do admin no cadastro operacional de pessoas.

## Convenções locais

- Validar sessão com `getCurrentAuthSession()` pela data source.
- Usar Zod e helpers de `src/lib/data/operational-onboarding-data-source.ts`.
- Não existe ação manual de concluir onboarding; a estrutura de pessoas permanece aberta para novos cadastros.
- Quando o mapeamento for obrigatório, a ativação do diagnóstico depende de domínio autorizado e pelo menos 1 pessoa aprovada.
- Respostas ficam em pt-BR e não expõem detalhes do banco.
