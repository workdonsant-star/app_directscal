# `src/app/api/acquisition` — APIs públicas de aquisição

## Propósito

Route Handlers usados pelos links públicos `/a/[token]`. Validam campanhas ativas, criam intents curtos de OAuth, registram usuários finais como `cliente` e persistem leads no Supabase.

## Convenções

- Não usar Supabase client no browser; todas as escritas passam por handlers server-side.
- Limpar o cookie mockado `directscal_session` em qualquer início de cadastro por campanha.
- Google usa cookie httpOnly de intent, força nova sessão Auth.js marcada como `acquisition` e completa empresa/dados em `/a/[token]/completar`.
- No fluxo Google, o e-mail canônico é sempre o e-mail Google autenticado; campos `nome` e `email` não vêm do formulário de completar.
- E-mail/senha cria usuário em `next_auth.users`, credencial em `app_private` e membership `cliente`, mas deve retornar `409` quando o e-mail já tem acesso ativo.
- Respostas de erro devem ser curtas, em pt-BR e seguras para UI pública.
