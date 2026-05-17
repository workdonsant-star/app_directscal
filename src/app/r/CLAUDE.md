# `src/app/r` — Fluxo público do respondente

## Propósito

Rotas públicas acessadas por link de resposta do OMDx. Não usam sidebar, topbar, autenticação ou navegação do cliente administrador.

## Convenções locais

- Manter layout estreito e focado no respondente.
- O grupo organizacional vem do token da URL, não de seleção manual.
- `/r/[token]` resolve token real no Supabase e renderiza o formulário Likert completo.
- `/r/[token]/obrigado` confirma o registro da resposta e encerra a experiência do respondente.
- Não adicionar autenticação ou shell do app nesta árvore pública.
- A persistência acontece por `/api/omdx/responses`; componentes client não falam direto com Supabase.
