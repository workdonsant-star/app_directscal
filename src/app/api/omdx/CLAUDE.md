# `src/app/api/omdx` — Route Handlers OMDx

## Propósito

Endpoints server-side para mutações reais do OMDx em produção.

## Convenções

- Validar sessão com `getCurrentAuthSession()` nas mutações internas.
- Usar Zod dos contratos antes de escrever no banco.
- Usar Supabase service role apenas no servidor.
- O fluxo público de resposta não exige autenticação, mas valida token, status do diagnóstico e deduplicação.
- Respostas devem ser curtas, em pt-BR, sem expor detalhes de banco.
