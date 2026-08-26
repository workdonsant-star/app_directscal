# `src/app/api/acquisition` — APIs públicas de aquisição

## Propósito

Route Handlers usados pelos links públicos `/a/[slug]`. Validam campanhas ativas, criam intents curtos de OAuth, registram usuários finais como `cliente` e persistem leads no Supabase.

## Convenções

- Não usar Supabase client no browser; todas as escritas passam por handlers server-side.
- Limpar o cookie mockado `directscal_session` e cookies de sessão Auth.js em qualquer início de cadastro por campanha.
- Google usa cookie httpOnly de intent, força nova sessão Auth.js marcada como `acquisition` e completa empresa/dados em `/a/[slug]/completar`.
- No fluxo Google, o e-mail canônico é sempre o e-mail Google autenticado; campos `nome` e `email` não vêm do formulário de completar.
- E-mail/senha cria usuário em `next_auth.users`, credencial em `app_private` e membership `cliente`, mas deve retornar `409` quando o e-mail já tem acesso ativo.
- Respostas de erro devem ser curtas, em pt-BR e seguras para UI pública.
- O campo manual de empresa não faz parte do onboarding. O CNPJ é consultado na API Minha Receita para antecipar a razão social na interface e consultado novamente no servidor antes de criar organização e lead.
