# `src/lib/supabase` — Clientes Supabase

## Propósito

Esta pasta concentra os clientes Supabase usados pelo servidor Next.js.

## Convenções

- Nunca exportar `SUPABASE_SERVICE_ROLE_KEY` nem criar admin client em Client Components.
- `createSupabaseAdminClient()` é server-only e deve ser usado apenas em Route Handlers, callbacks Auth.js e leituras administrativas controladas.
- `createSupabaseRlsClient()` recebe o JWT assinado pela sessão Auth.js e respeita RLS.
- Tipos de banco ficam em `database.types.ts` até serem substituídos por tipos gerados pelo Supabase CLI.
