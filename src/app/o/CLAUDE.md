# `src/app/o` — Cadastro operacional público

## Propósito

Rotas públicas acessadas por link de cadastro operacional. Não usam autenticação, sidebar, topbar ou navegação interna.

## Convenções locais

- Resolver a empresa exclusivamente pelo token da URL.
- Exibir apenas o formulário curto da pessoa e o domínio autorizado.
- Não expor lista de membros, diagnóstico, dados internos da empresa ou informações de outros usuários.
- A persistência acontece por Route Handler server-side em `/api/omdx/operational-members`.
