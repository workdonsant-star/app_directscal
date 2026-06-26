# `src/app/api/omdx` — Route Handlers Maturidade

## Propósito

Endpoints server-side para mutações reais de Maturidade em produção.

## Convenções

- Validar sessão com `getCurrentAuthSession()` nas mutações internas.
- Usar Zod dos contratos antes de escrever no banco.
- Usar Supabase service role apenas no servidor.
- O fluxo público de resposta não exige autenticação, não coleta identificação pessoal e valida token, status do diagnóstico, trava por navegador e conjunto completo de perguntas do template antes de gravar.
- A deduplicação pública usa cookie `httpOnly` por token; o client usa `localStorage` apenas para estado visual local.
- Respostas devem ser curtas, em pt-BR, sem expor detalhes de banco.
