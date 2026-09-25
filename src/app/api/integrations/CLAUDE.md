# `src/app/api/integrations` — Webhooks de provedores

Route Handlers desta pasta são endpoints públicos de provedores externos. Cada endpoint deve validar assinatura, rejeitar payloads inválidos, ser idempotente quando o provedor reenviar eventos e delegar a regra de negócio para `src/lib/integrations`.
